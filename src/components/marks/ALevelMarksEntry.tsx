import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateALevelSubjectScore, parseCSV, exportToCSV, downloadFile } from '../../utils/academicCalculations';
import { ALevelMark, MarkStatus, SubjectPaperConfig } from '../../types';
import {
  Award,
  Save,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  CheckSquare,
  Square,
  HelpCircle,
  Search,
  X,
  ArrowDownAZ,
  ArrowUpAZ,
} from 'lucide-react';

export const ALevelMarksEntry: React.FC = () => {
  const {
    schoolProfile,
    currentUser,
    classes,
    subjects,
    teachers,
    learners,
    aLevelMarks,
    batchSaveALevelMarks,
    aLevelBoundaries,
    toggleSubjectPaper,
  } = useApp();

  const isTeacher = currentUser.role === 'teacher';
  const isAdmin = currentUser.role === 'admin';
  const currentTeacher = isTeacher ? teachers.find((t) => t.id === currentUser.teacherId) : null;

  // Filter A Level classes (Senior 5 & Senior 6)
  const aLevelClasses = useMemo(
    () => classes.filter((c) => c.programme === 'A_LEVEL'),
    [classes]
  );

  const [selectedClassId, setSelectedClassId] = useState<string>(
    aLevelClasses[aLevelClasses.length - 1]?.id || aLevelClasses[0]?.id || ''
  );

  const currentClass = useMemo(
    () => aLevelClasses.find((c) => c.id === selectedClassId),
    [aLevelClasses, selectedClassId]
  );

  const [selectedStream, setSelectedStream] = useState<string>(
    currentClass?.streams[0] || 'Science East'
  );

  // Filter A Level subjects only!
  const aLevelSubjects = useMemo(() => {
    let subs = subjects.filter((s) => s.programme === 'A_LEVEL');
    if (isTeacher && currentTeacher) {
      subs = subs.filter((s) => currentTeacher.assignedSubjectIds.includes(s.id));
    }
    return subs;
  }, [subjects, isTeacher, currentTeacher]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    aLevelSubjects[0]?.id || ''
  );

  const currentSubject = useMemo(
    () => aLevelSubjects.find((s) => s.id === selectedSubjectId) || aLevelSubjects[0],
    [aLevelSubjects, selectedSubjectId]
  );

  // Active term
  const termId = schoolProfile.activeTermId;

  // Active paper configuration for current subject (4 papers: Paper 1, Paper 2, Paper 3, Paper 4)
  const subjectPapers: SubjectPaperConfig[] = useMemo(() => {
    if (!currentSubject) return [];
    if (currentSubject.papers && currentSubject.papers.length > 0) {
      return currentSubject.papers;
    }
    return [
      { paperNumber: 1, label: 'Paper 1 (Core)', active: true, maxScore: 100 },
      { paperNumber: 2, label: 'Paper 2 (Theory/Essay)', active: true, maxScore: 100 },
      { paperNumber: 3, label: 'Paper 3 (Practical/Alternative)', active: true, maxScore: 100 },
      { paperNumber: 4, label: 'Paper 4 (Special Paper)', active: false, maxScore: 100 },
    ];
  }, [currentSubject]);

  // Active enabled papers for score columns
  const activePapers = useMemo(
    () => subjectPapers.filter((p) => p.active),
    [subjectPapers]
  );

  // Load A Level paper-entry learners from ACTIVE learner-subject assignments!
  // This guarantees score textboxes appear even when base assessment mark rows were not initialized.
  const targetLearners = useMemo(() => {
    if (!currentSubject) return [];
    return learners.filter(
      (l) =>
        l.programme === 'A_LEVEL' &&
        l.classId === selectedClassId &&
        (selectedStream === 'ALL' || l.stream === selectedStream) &&
        l.enrolmentStatus === 'Active' &&
        l.allocatedSubjectIds.includes(currentSubject.id)
    );
  }, [learners, selectedClassId, selectedStream, currentSubject]);

  // Live Automatic Search & Alphabetical Sorting State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Live searched & alphabetically sorted learners
  const displayedLearners = useMemo(() => {
    let result = [...targetLearners];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.fullName.toLowerCase().includes(q) ||
          l.lin.toLowerCase().includes(q) ||
          l.admissionNo.toLowerCase().includes(q) ||
          (l.aLevelCombination && l.aLevelCombination.toLowerCase().includes(q)) ||
          l.stream.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [targetLearners, searchQuery, sortOrder]);

  // Local state for paper scores per learner
  interface ALevelRowState {
    learnerId: string;
    existingMarkId?: string;
    paperScores: { [paperNumber: number]: number };
    status: MarkStatus;
    comment: string;
    teacherInitials: string;
    hasErrors: boolean;
  }

  const [rows, setRows] = useState<{ [learnerId: string]: ALevelRowState }>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Reload rows whenever subject, class, stream, or active papers change
  useEffect(() => {
    if (!currentSubject) return;

    const initial: { [learnerId: string]: ALevelRowState } = {};
    targetLearners.forEach((l) => {
      const existing = aLevelMarks.find(
        (m) =>
          m.termId === termId &&
          m.learnerId === l.id &&
          m.subjectId === currentSubject.id
      );

      const paperScores: { [paperNumber: number]: number } = {};
      subjectPapers.forEach((p) => {
        paperScores[p.paperNumber] =
          existing?.paperScores?.[p.paperNumber] ?? 0;
      });

      if (existing) {
        initial[l.id] = {
          learnerId: l.id,
          existingMarkId: existing.id,
          paperScores,
          status: existing.status,
          comment: existing.subjectComment,
          teacherInitials: existing.teacherInitials || (currentTeacher?.initials || 'TR'),
          hasErrors: false,
        };
      } else {
        initial[l.id] = {
          learnerId: l.id,
          paperScores,
          status: 'draft',
          comment: '',
          teacherInitials: currentTeacher?.initials || 'TR',
          hasErrors: false,
        };
      }
    });

    setRows(initial);
    setSaveMessage(null);
  }, [currentSubject, selectedClassId, selectedStream, targetLearners, termId, aLevelMarks, currentTeacher, subjectPapers]);

  const handlePaperScoreChange = (
    learnerId: string,
    paperNumber: number,
    valStr: string
  ) => {
    const score = parseFloat(valStr) || 0;
    setRows((prev) => {
      const current = prev[learnerId] || {
        learnerId,
        paperScores: {},
        status: 'draft',
        comment: '',
        teacherInitials: currentTeacher?.initials || 'TR',
        hasErrors: false,
      };

      const updatedScores = {
        ...current.paperScores,
        [paperNumber]: score,
      };

      // Check errors (> 100 or < 0)
      const hasErrors = Object.values(updatedScores).some(
        (s) => s < 0 || s > 100
      );

      // Auto update comment if empty
      let updatedComment = current.comment;
      if (!updatedComment.trim() && currentSubject) {
        const calc = calculateALevelSubjectScore(
          currentSubject,
          updatedScores,
          aLevelBoundaries
        );
        updatedComment = calc.defaultComment;
      }

      return {
        ...prev,
        [learnerId]: {
          ...current,
          paperScores: updatedScores,
          comment: updatedComment,
          hasErrors,
        },
      };
    });
  };

  const handleCommentChange = (learnerId: string, comment: string) => {
    setRows((prev) => ({
      ...prev,
      [learnerId]: { ...prev[learnerId], comment },
    }));
  };

  const handleStatusChange = (learnerId: string, status: MarkStatus) => {
    setRows((prev) => ({
      ...prev,
      [learnerId]: { ...prev[learnerId], status },
    }));
  };

  const handlePaperCheckboxToggle = (paperNumber: number, active: boolean) => {
    if (!currentSubject) return;
    toggleSubjectPaper(currentSubject.id, paperNumber, active);
  };

  const handleSaveAll = (targetStatus?: MarkStatus) => {
    if (!currentSubject) return;

    const toSave: (Omit<ALevelMark, 'id' | 'updatedAt'> & { id?: string })[] = [];

    Object.values(rows).forEach((r) => {
      const calc = calculateALevelSubjectScore(
        currentSubject,
        r.paperScores,
        aLevelBoundaries
      );

      toSave.push({
        id: r.existingMarkId,
        termId,
        learnerId: r.learnerId,
        subjectId: currentSubject.id,
        paperScores: r.paperScores,
        averageScore: calc.averageScore,
        grade: calc.grade,
        points: calc.points,
        subjectComment: r.comment || calc.defaultComment,
        teacherInitials: r.teacherInitials || (currentTeacher?.initials || 'TR'),
        status: targetStatus || r.status,
      });
    });

    batchSaveALevelMarks(toSave);
    setSaveMessage('All A-Level paper marks saved & paper averages computed successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleExportCSV = () => {
    if (!currentSubject) return;
    const paperHeaders = activePapers.map(
      (p) => `Paper ${p.paperNumber} (/100)`
    );
    const headers = [
      'LIN',
      'Admission No',
      'Learner Name',
      'Class',
      'Stream',
      ...paperHeaders,
      'Teacher Initials',
      'Comment',
    ];

    const dataRows = targetLearners.map((l) => {
      const r = rows[l.id] || { paperScores: {}, teacherInitials: 'TR', comment: '' };
      const pScores = activePapers.map((p) => r.paperScores[p.paperNumber] ?? 0);
      return [
        l.lin,
        l.admissionNo,
        l.fullName,
        currentClass?.code || 'S.6',
        l.stream,
        ...pScores,
        r.teacherInitials,
        r.comment,
      ];
    });

    const safeSchool = schoolProfile.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const csvStr =
      `"${schoolProfile.name} - A-Level Marks - ${currentSubject.code} ${currentSubject.name} - ${currentClass?.name} (${selectedStream})"\n` +
      exportToCSV(headers, dataRows);
    const fname = `${safeSchool}_A_Level_${currentSubject.code}_${currentClass?.code}_Marks.csv`;
    downloadFile(fname, csvStr);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);

      setRows((prev) => {
        const next = { ...prev };
        parsed.forEach((item) => {
          const lin = item['LIN'] || item['Lin'];
          const adm = item['Admission No'] || item['AdmissionNo'];
          const matched = targetLearners.find(
            (l) => l.lin === lin || l.admissionNo === adm
          );

          if (matched) {
            const paperScores: { [paperNumber: number]: number } = {};
            activePapers.forEach((p) => {
              const headerKey = `Paper ${p.paperNumber} (/100)`;
              const val = parseFloat(item[headerKey] || item[`Paper ${p.paperNumber}`] || '0') || 0;
              paperScores[p.paperNumber] = Math.min(100, Math.max(0, val));
            });

            const comment = item['Comment'] || '';
            const teacherInitials = item['Teacher Initials'] || 'TR';

            next[matched.id] = {
              ...(next[matched.id] || {
                learnerId: matched.id,
                status: 'draft',
              }),
              paperScores,
              comment,
              teacherInitials,
              hasErrors: false,
            };
          }
        });
        return next;
      });

      setSaveMessage('CSV paper scores loaded. Click "Save & Recalculate" to commit changes.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
              A Level (UACE) Principal &amp; Subsidiary Workspace
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Route: /marks/a-level
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            A Level Marks Entry &amp; Paper Options
          </h2>
          <p className="text-xs text-slate-500">
            Configure up to 4 paper options per subject, input live paper scores, and auto-compute Principal grades (A-F, 6-0 pts)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Export CSV</span>
          </button>

          <label className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-sky-600" />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Save &amp; Recalculate</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Class & Subject Selector Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            A Level Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800"
          >
            {aLevelClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Stream
          </label>
          <select
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800"
          >
            <option value="ALL">All Streams</option>
            {currentClass?.streams.map((s) => (
              <option key={s} value={s}>
                {s} Stream
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            A Level Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-sky-50/50 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900"
          >
            {aLevelSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name} ({s.category.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FOUR A LEVEL PAPER OPTIONS BOXES - VISIBLE IMMEDIATELY ON THE A LEVEL PAGE BEFORE/DURING ENTRY */}
      <div className="p-4 bg-linear-to-r from-sky-950 via-slate-900 to-slate-900 text-white rounded-xl shadow-xs border border-sky-800/80">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                A Level Paper Configuration
              </span>
              <span className="text-[11px] text-slate-300 font-mono">
                {currentSubject?.code} - {currentSubject?.name}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Check/uncheck papers below to activate or deactivate their score column. Changes immediately reflect in the marks grid and report card.
            </p>
          </div>
          {isAdmin && (
            <span className="text-[11px] px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30 font-semibold">
              Administrator Controls Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((paperNum) => {
            const paperConfig = subjectPapers.find((p) => p.paperNumber === paperNum) || {
              paperNumber: paperNum,
              label: `Paper ${paperNum}`,
              active: paperNum <= 2,
              maxScore: 100,
            };

            return (
              <div
                key={paperNum}
                onClick={() => {
                  if (isAdmin) {
                    handlePaperCheckboxToggle(paperNum, !paperConfig.active);
                  }
                }}
                className={`p-3 rounded-xl border transition cursor-pointer select-none flex items-center justify-between ${
                  paperConfig.active
                    ? 'bg-sky-900/60 border-sky-400 text-white shadow-xs'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    {paperConfig.active ? (
                      <CheckSquare className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Paper {paperNum}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate max-w-[120px] mt-0.5">
                    {paperConfig.label}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                    paperConfig.active
                      ? 'bg-sky-500 text-slate-950 font-black'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {paperConfig.active ? 'Active' : 'Off'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Metadata & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Enrolled Candidates:</span>
          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
            {targetLearners.length}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600">
            Active Papers: <strong className="text-sky-800">{activePapers.length} Papers</strong>
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600">
            Grading:{' '}
            <strong className="text-amber-800">
              {currentSubject?.category === 'subsidiary'
                ? 'Subsidiary (Pass P / Fail F, 1 Pt)'
                : 'Principal (A=6, B=5, C=4, D=3, E=2, O=1, F=0)'}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSaveAll('draft')}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            Mark Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveAll('submitted')}
            className="px-2.5 py-1 rounded-md bg-sky-50 border border-sky-300 text-[11px] font-semibold text-sky-800 hover:bg-sky-100 flex items-center gap-1"
          >
            <Send className="w-3 h-3" /> Submit
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleSaveAll('validated')}
              className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 flex items-center gap-1"
            >
              <FileCheck className="w-3 h-3" /> Validate
            </button>
          )}
        </div>
      </div>

      {/* Live Automatic Search & Alphabetical Sorting Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Live search by student name, LIN, combination, stream..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium">Sort Names:</span>
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              sortOrder === 'asc'
                ? 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="Toggle alphabetical sort"
          >
            {sortOrder === 'asc' ? (
              <>
                <ArrowDownAZ className="w-4 h-4 text-sky-700" />
                <span>Alphabetical (A &rarr; Z)</span>
              </>
            ) : (
              <>
                <ArrowUpAZ className="w-4 h-4 text-amber-700" />
                <span>Alphabetical (Z &rarr; A)</span>
              </>
            )}
          </button>

          {searchQuery && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200 font-mono">
              {displayedLearners.length} / {targetLearners.length} matched
            </span>
          )}
        </div>
      </div>

      {/* A Level Marks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-3 w-10">#</th>
                <th
                  onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="px-3 py-3 min-w-[160px] cursor-pointer hover:bg-slate-800 transition select-none"
                  title="Click to toggle alphabetical sort"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Learner</span>
                    {sortOrder === 'asc' ? (
                      <ArrowDownAZ className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <ArrowUpAZ className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 w-28">Combination</th>

                {/* Dynamic paper columns for every selected paper */}
                {activePapers.map((paper) => (
                  <th
                    key={paper.paperNumber}
                    className="px-2 py-3 w-24 text-center bg-sky-950 border-r border-sky-800"
                  >
                    Paper {paper.paperNumber} (/100)
                  </th>
                ))}

                <th className="px-2 py-3 w-24 text-center bg-amber-950">Paper Avg</th>
                <th className="px-2 py-3 w-16 text-center bg-amber-900">Grade</th>
                <th className="px-2 py-3 w-16 text-center bg-amber-800">Points</th>
                <th className="px-3 py-3 min-w-[200px]">Teacher Comment</th>
                <th className="px-2 py-3 w-16 text-center">Initials</th>
                <th className="px-3 py-3 w-24 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {targetLearners.length === 0 ? (
                <tr>
                  <td
                    colSpan={8 + activePapers.length}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No learners allocated to {currentSubject?.name} in {currentClass?.name} ({selectedStream}).
                  </td>
                </tr>
              ) : displayedLearners.length === 0 ? (
                <tr>
                  <td
                    colSpan={8 + activePapers.length}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-5 h-5 text-slate-400" />
                      <span>No candidates match &ldquo;<strong>{searchQuery}</strong>&rdquo;</span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-amber-700 font-bold hover:underline"
                      >
                        Clear Search Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedLearners.map((learner, idx) => {
                  const row = rows[learner.id] || {
                    learnerId: learner.id,
                    paperScores: {},
                    status: 'draft',
                    comment: '',
                    teacherInitials: currentTeacher?.initials || 'TR',
                    hasErrors: false,
                  };

                  const calc = calculateALevelSubjectScore(
                    currentSubject,
                    row.paperScores,
                    aLevelBoundaries
                  );

                  return (
                    <tr
                      key={learner.id}
                      className={row.hasErrors ? 'bg-rose-50/50' : 'hover:bg-slate-50/80 transition'}
                    >
                      <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Learner Info */}
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900 leading-tight">
                          {learner.fullName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {learner.lin} &bull; {learner.stream}
                        </div>
                      </td>

                      {/* Combination */}
                      <td className="px-3 py-2">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {learner.aLevelCombination || 'UACE Comb'}
                        </span>
                      </td>

                      {/* Score textboxes for EVERY selected A Level paper */}
                      {activePapers.map((paper) => {
                        const scoreVal = row.paperScores[paper.paperNumber] ?? 0;
                        const isInvalid = scoreVal < 0 || scoreVal > 100;

                        return (
                          <td
                            key={paper.paperNumber}
                            className="px-2 py-2 text-center border-r border-slate-100"
                          >
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={scoreVal}
                              onChange={(e) =>
                                handlePaperScoreChange(
                                  learner.id,
                                  paper.paperNumber,
                                  e.target.value
                                )
                              }
                              className={`w-16 px-1.5 py-1 text-center font-mono font-semibold text-xs rounded-md border ${
                                isInvalid
                                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                                  : 'border-slate-300'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Live Paper Average */}
                      <td className="px-2 py-2 text-center font-mono font-extrabold text-slate-900 bg-amber-50/40">
                        {calc.averageScore}%
                      </td>

                      {/* Live Grade */}
                      <td className="px-2 py-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-sm font-black text-xs text-center ${
                            calc.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : calc.grade === 'B' || calc.grade === 'C'
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : calc.grade === 'D' || calc.grade === 'E' || calc.grade.includes('Pass')
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {calc.grade}
                        </span>
                      </td>

                      {/* Live Points */}
                      <td className="px-2 py-2 text-center font-mono font-black text-xs text-slate-900 bg-slate-50">
                        {calc.points} pts
                      </td>

                      {/* Comment text box */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.comment || calc.defaultComment}
                          onChange={(e) => handleCommentChange(learner.id, e.target.value)}
                          placeholder="Teacher remark..."
                          className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        />
                      </td>

                      {/* Initials */}
                      <td className="px-2 py-2 text-center font-mono text-xs font-semibold text-slate-600">
                        {row.teacherInitials || 'TR'}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2 text-center">
                        <select
                          value={row.status}
                          onChange={(e) =>
                            handleStatusChange(learner.id, e.target.value as MarkStatus)
                          }
                          className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md border border-slate-300 bg-white"
                        >
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="validated">Validated</option>
                          <option value="published">Published</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
