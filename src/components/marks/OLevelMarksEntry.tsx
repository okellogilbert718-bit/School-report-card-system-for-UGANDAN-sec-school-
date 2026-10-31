import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateOLevelScore, parseCSV, exportToCSV, downloadFile } from '../../utils/academicCalculations';
import { OLevelMark, MarkStatus } from '../../types';
import {
  BookOpen,
  Save,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  Lock,
  Search,
  X,
  ArrowDownAZ,
  ArrowUpAZ,
} from 'lucide-react';

export const OLevelMarksEntry: React.FC = () => {
  const {
    schoolProfile,
    currentUser,
    classes,
    subjects,
    teachers,
    learners,
    oLevelMarks,
    batchSaveOLevelMarks,
    oLevelBoundaries,
  } = useApp();

  const isTeacher = currentUser.role === 'teacher';
  const isAdmin = currentUser.role === 'admin';
  const currentTeacher = isTeacher ? teachers.find((t) => t.id === currentUser.teacherId) : null;

  // Filter O Level classes (S.1 - S.4)
  const oLevelClasses = useMemo(
    () => classes.filter((c) => c.programme === 'O_LEVEL'),
    [classes]
  );

  const [selectedClassId, setSelectedClassId] = useState<string>(
    oLevelClasses[oLevelClasses.length - 1]?.id || oLevelClasses[0]?.id || ''
  );

  const currentClass = useMemo(
    () => oLevelClasses.find((c) => c.id === selectedClassId),
    [oLevelClasses, selectedClassId]
  );

  const [selectedStream, setSelectedStream] = useState<string>(
    currentClass?.streams[0] || 'Red'
  );

  // Filter O Level subjects only! (A-Level subjects never appear here)
  const availableSubjects = useMemo(() => {
    let subs = subjects.filter((s) => s.programme === 'O_LEVEL');
    if (isTeacher && currentTeacher) {
      subs = subs.filter((s) => currentTeacher.assignedSubjectIds.includes(s.id));
    }
    return subs;
  }, [subjects, isTeacher, currentTeacher]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    availableSubjects[0]?.id || ''
  );

  const currentSubject = useMemo(
    () => availableSubjects.find((s) => s.id === selectedSubjectId) || availableSubjects[0],
    [availableSubjects, selectedSubjectId]
  );

  // Active term
  const termId = schoolProfile.activeTermId;

  // Learners in this class, stream, who take this subject
  const targetLearners = useMemo(() => {
    if (!currentSubject) return [];
    return learners.filter(
      (l) =>
        l.programme === 'O_LEVEL' &&
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
          l.stream.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [targetLearners, searchQuery, sortOrder]);

  // Local draft state for scores
  interface RowState {
    learnerId: string;
    existingMarkId?: string;
    a1_3: number;
    a1_20: number;
    a2_3: number;
    a2_20: number;
    a3_eot: number;
    status: MarkStatus;
    comment: string;
    teacherInitials: string;
    hasErrors: boolean;
  }

  const [rows, setRows] = useState<{ [learnerId: string]: RowState }>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Synchronize or initialize row state when subject or class changes
  React.useEffect(() => {
    if (!currentSubject) return;

    const initial: { [learnerId: string]: RowState } = {};
    targetLearners.forEach((l) => {
      const existing = oLevelMarks.find(
        (m) =>
          m.termId === termId &&
          m.learnerId === l.id &&
          m.subjectId === currentSubject.id
      );

      if (existing) {
        initial[l.id] = {
          learnerId: l.id,
          existingMarkId: existing.id,
          a1_3: existing.a1_score3,
          a1_20: existing.a1_score20,
          a2_3: existing.a2_score3,
          a2_20: existing.a2_score20,
          a3_eot: existing.a3_eot,
          status: existing.status,
          comment: existing.subjectComment,
          teacherInitials: existing.teacherInitials || (currentTeacher?.initials || 'TR'),
          hasErrors: false,
        };
      } else {
        initial[l.id] = {
          learnerId: l.id,
          a1_3: 0,
          a1_20: 0,
          a2_3: 0,
          a2_20: 0,
          a3_eot: 0,
          status: 'draft',
          comment: '',
          teacherInitials: currentTeacher?.initials || 'TR',
          hasErrors: false,
        };
      }
    });

    setRows(initial);
    setSaveMessage(null);
  }, [currentSubject, selectedClassId, selectedStream, targetLearners, termId, oLevelMarks, currentTeacher]);

  const handleScoreChange = (
    learnerId: string,
    field: 'a1_3' | 'a1_20' | 'a2_3' | 'a2_20' | 'a3_eot',
    value: string
  ) => {
    const num = parseFloat(value) || 0;
    setRows((prev) => {
      const current = prev[learnerId] || {
        learnerId,
        a1_3: 0,
        a1_20: 0,
        a2_3: 0,
        a2_20: 0,
        a3_eot: 0,
        status: 'draft',
        comment: '',
        teacherInitials: currentTeacher?.initials || 'TR',
        hasErrors: false,
      };

      const updated = { ...current, [field]: num };

      // Validate bounds
      const errorA1_3 = updated.a1_3 < 0 || updated.a1_3 > 3;
      const errorA1_20 = updated.a1_20 < 0 || updated.a1_20 > 20;
      const errorA2_3 = updated.a2_3 < 0 || updated.a2_3 > 3;
      const errorA2_20 = updated.a2_20 < 0 || updated.a2_20 > 20;
      const errorA3_eot = updated.a3_eot < 0 || updated.a3_eot > 80;

      updated.hasErrors = errorA1_3 || errorA1_20 || errorA2_3 || errorA2_20 || errorA3_eot;

      // Auto update comment if empty
      if (!updated.comment.trim()) {
        const calc = calculateOLevelScore(
          updated.a1_3,
          updated.a1_20,
          updated.a2_3,
          updated.a2_20,
          updated.a3_eot,
          oLevelBoundaries
        );
        updated.comment = calc.defaultComment;
      }

      return { ...prev, [learnerId]: updated };
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

  const handleSaveAll = (targetStatus?: MarkStatus) => {
    if (!currentSubject) return;

    const toSave: (Omit<OLevelMark, 'id' | 'updatedAt'> & { id?: string })[] = [];

    Object.values(rows).forEach((r) => {
      const calc = calculateOLevelScore(
        r.a1_3,
        r.a1_20,
        r.a2_3,
        r.a2_20,
        r.a3_eot,
        oLevelBoundaries
      );

      toSave.push({
        id: r.existingMarkId,
        termId,
        learnerId: r.learnerId,
        subjectId: currentSubject.id,
        a1_score3: r.a1_3,
        a1_score20: r.a1_20,
        a2_score3: r.a2_3,
        a2_score20: r.a2_20,
        a3_eot: r.a3_eot,
        weightedAverage: calc.weightedAverage,
        totalScore: calc.totalScore,
        grade: calc.grade,
        subjectComment: r.comment || calc.defaultComment,
        teacherInitials: r.teacherInitials || (currentTeacher?.initials || 'TR'),
        status: targetStatus || r.status,
      });
    });

    batchSaveOLevelMarks(toSave);
    setSaveMessage('All O-Level marks saved & recalculated successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleExportCSV = () => {
    if (!currentSubject) return;
    const headers = [
      'LIN',
      'Admission No',
      'Learner Name',
      'Class',
      'Stream',
      'A1 (/3)',
      'A1 (/20)',
      'A2 (/3)',
      'A2 (/20)',
      'End of Term (/80)',
      'Teacher Initials',
      'Comment',
    ];

    const dataRows = targetLearners.map((l) => {
      const r = rows[l.id] || {
        a1_3: 0,
        a1_20: 0,
        a2_3: 0,
        a2_20: 0,
        a3_eot: 0,
        teacherInitials: 'TR',
        comment: '',
      };
      return [
        l.lin,
        l.admissionNo,
        l.fullName,
        currentClass?.code || 'S.4',
        l.stream,
        r.a1_3,
        r.a1_20,
        r.a2_3,
        r.a2_20,
        r.a3_eot,
        r.teacherInitials,
        r.comment,
      ];
    });

    const safeSchool = schoolProfile.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const csvStr =
      `"${schoolProfile.name} - O-Level Marks - ${currentSubject.code} ${currentSubject.name} - ${currentClass?.name} (${selectedStream})"\n` +
      exportToCSV(headers, dataRows);
    const fname = `${safeSchool}_O_Level_${currentSubject.code}_${currentClass?.code}_Marks.csv`;
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
            const a1_3 = parseFloat(item['A1 (/3)'] || '0') || 0;
            const a1_20 = parseFloat(item['A1 (/20)'] || '0') || 0;
            const a2_3 = parseFloat(item['A2 (/3)'] || '0') || 0;
            const a2_20 = parseFloat(item['A2 (/20)'] || '0') || 0;
            const a3_eot = parseFloat(item['End of Term (/80)'] || '0') || 0;
            const comment = item['Comment'] || '';
            const teacherInitials = item['Teacher Initials'] || 'TR';

            next[matched.id] = {
              ...(next[matched.id] || {
                learnerId: matched.id,
                status: 'draft',
              }),
              a1_3: Math.min(3, Math.max(0, a1_3)),
              a1_20: Math.min(20, Math.max(0, a1_20)),
              a2_3: Math.min(3, Math.max(0, a2_3)),
              a2_20: Math.min(20, Math.max(0, a2_20)),
              a3_eot: Math.min(80, Math.max(0, a3_eot)),
              comment,
              teacherInitials,
              hasErrors: false,
            };
          }
        });
        return next;
      });

      setSaveMessage('CSV marks parsed and filled into table. Click "Save & Recalculate" to commit.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              O Level (UCE) New Lower Secondary
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Term: {termId.toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            O Level Marks Entry &amp; Continuous Assessment
          </h2>
          <p className="text-xs text-slate-500">
            Assessment 1 (/3, /20), Assessment 2 (/3, /20), End of Term (/80), and automatic Ugandan UNEB grading
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

      {/* Class, Stream & Subject Selector Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Academic Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800"
          >
            {oLevelClasses.map((c) => (
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
            O Level Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-emerald-50/50 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900"
          >
            {availableSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name} ({s.category.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Workflow Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Enrolled:</span>
          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
            {targetLearners.length}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600">
            Subject Code: <strong className="font-mono text-emerald-800">{currentSubject?.code}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Bulk Workflow:</span>
          <button
            type="button"
            onClick={() => handleSaveAll('draft')}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            Mark as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveAll('submitted')}
            className="px-2.5 py-1 rounded-md bg-sky-50 border border-sky-300 text-[11px] font-semibold text-sky-800 hover:bg-sky-100 flex items-center gap-1"
          >
            <Send className="w-3 h-3" /> Submit for Validation
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleSaveAll('validated')}
              className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 flex items-center gap-1"
            >
              <FileCheck className="w-3 h-3" /> Validate &amp; Approve
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
            placeholder="Live search by student name, LIN, admission number..."
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
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="Toggle alphabetical sort"
          >
            {sortOrder === 'asc' ? (
              <>
                <ArrowDownAZ className="w-4 h-4 text-emerald-700" />
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

      {/* Marks Table Grid */}
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
                <th className="px-2 py-3 w-20 text-center">A1 (/3)</th>
                <th className="px-2 py-3 w-24 text-center">A1 (/20)</th>
                <th className="px-2 py-3 w-20 text-center">A2 (/3)</th>
                <th className="px-2 py-3 w-24 text-center">A2 (/20)</th>
                <th className="px-2 py-3 w-24 text-center">EOT (/80)</th>
                <th className="px-2 py-3 w-20 text-center bg-amber-950">Weighted</th>
                <th className="px-2 py-3 w-16 text-center bg-amber-900">Total</th>
                <th className="px-2 py-3 w-16 text-center bg-amber-800">Grade</th>
                <th className="px-3 py-3 min-w-[200px]">Teacher Comment</th>
                <th className="px-2 py-3 w-16 text-center">Initials</th>
                <th className="px-3 py-3 w-24 text-center">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {targetLearners.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-slate-400">
                    No learners found taking this subject in {currentClass?.name} ({selectedStream}).
                  </td>
                </tr>
              ) : displayedLearners.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-slate-500">
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
                    a1_3: 0,
                    a1_20: 0,
                    a2_3: 0,
                    a2_20: 0,
                    a3_eot: 0,
                    status: 'draft',
                    comment: '',
                    teacherInitials: currentTeacher?.initials || 'TR',
                    hasErrors: false,
                  };

                  const calc = calculateOLevelScore(
                    row.a1_3,
                    row.a1_20,
                    row.a2_3,
                    row.a2_20,
                    row.a3_eot,
                    oLevelBoundaries
                  );

                  return (
                    <tr
                      key={learner.id}
                      className={row.hasErrors ? 'bg-rose-50/50' : 'hover:bg-slate-50/80 transition'}
                    >
                      <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Learner info */}
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900 leading-tight">
                          {learner.fullName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {learner.lin} &bull; {learner.stream}
                        </div>
                      </td>

                      {/* A1 /3 */}
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="3"
                          value={row.a1_3}
                          onChange={(e) => handleScoreChange(learner.id, 'a1_3', e.target.value)}
                          className={`w-16 px-1.5 py-1 text-center font-mono font-semibold text-xs rounded-md border ${
                            row.a1_3 > 3 || row.a1_3 < 0
                              ? 'border-rose-500 bg-rose-50 text-rose-700'
                              : 'border-slate-300'
                          }`}
                        />
                      </td>

                      {/* A1 /20 */}
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="20"
                          value={row.a1_20}
                          onChange={(e) => handleScoreChange(learner.id, 'a1_20', e.target.value)}
                          className={`w-16 px-1.5 py-1 text-center font-mono font-semibold text-xs rounded-md border ${
                            row.a1_20 > 20 || row.a1_20 < 0
                              ? 'border-rose-500 bg-rose-50 text-rose-700'
                              : 'border-slate-300'
                          }`}
                        />
                      </td>

                      {/* A2 /3 */}
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="3"
                          value={row.a2_3}
                          onChange={(e) => handleScoreChange(learner.id, 'a2_3', e.target.value)}
                          className={`w-16 px-1.5 py-1 text-center font-mono font-semibold text-xs rounded-md border ${
                            row.a2_3 > 3 || row.a2_3 < 0
                              ? 'border-rose-500 bg-rose-50 text-rose-700'
                              : 'border-slate-300'
                          }`}
                        />
                      </td>

                      {/* A2 /20 */}
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="20"
                          value={row.a2_20}
                          onChange={(e) => handleScoreChange(learner.id, 'a2_20', e.target.value)}
                          className={`w-16 px-1.5 py-1 text-center font-mono font-semibold text-xs rounded-md border ${
                            row.a2_20 > 20 || row.a2_20 < 0
                              ? 'border-rose-500 bg-rose-50 text-rose-700'
                              : 'border-slate-300'
                          }`}
                        />
                      </td>

                      {/* EOT /80 */}
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="80"
                          value={row.a3_eot}
                          onChange={(e) => handleScoreChange(learner.id, 'a3_eot', e.target.value)}
                          className={`w-16 px-1.5 py-1 text-center font-mono font-bold text-xs rounded-md border ${
                            row.a3_eot > 80 || row.a3_eot < 0
                              ? 'border-rose-500 bg-rose-50 text-rose-700'
                              : 'border-amber-400 bg-amber-50/40 text-slate-900'
                          }`}
                        />
                      </td>

                      {/* Live Weighted Average */}
                      <td className="px-2 py-2 text-center font-mono font-bold text-slate-800 bg-slate-50">
                        {calc.weightedAverage}%
                      </td>

                      {/* Live Total Score */}
                      <td className="px-2 py-2 text-center font-mono font-extrabold text-slate-900 bg-amber-50/60">
                        {calc.totalScore}
                      </td>

                      {/* Live Automated Grade */}
                      <td className="px-2 py-2 text-center">
                        <span
                          className={`inline-block w-8 py-0.5 rounded-sm font-black text-xs text-center ${
                            calc.grade.startsWith('D')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : calc.grade.startsWith('C')
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : calc.grade.startsWith('P')
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {calc.grade}
                        </span>
                      </td>

                      {/* Comment text box */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.comment || calc.defaultComment}
                          onChange={(e) => handleCommentChange(learner.id, e.target.value)}
                          placeholder="Subject comment..."
                          className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        />
                      </td>

                      {/* Initials */}
                      <td className="px-2 py-2 text-center font-mono text-xs font-semibold text-slate-600">
                        {row.teacherInitials || 'TR'}
                      </td>

                      {/* Status / Workflow */}
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
