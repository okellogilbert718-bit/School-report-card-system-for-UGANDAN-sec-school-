import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolLogo } from '../common/SchoolLogo';
import {
  calculateOLevelScore,
  calculateALevelSubjectScore,
  calculateOLevelDivision,
  exportToCSV,
  downloadFile,
} from '../../utils/academicCalculations';
import {
  Printer,
  Download,
  Search,
  X,
  FileSpreadsheet,
  Award,
  BookOpen,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
  Sparkles,
  Layers,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const ClassMarksheet: React.FC = () => {
  const {
    schoolProfile,
    classes,
    subjects,
    learners,
    terms,
    oLevelMarks,
    aLevelMarks,
    oLevelBoundaries,
    aLevelBoundaries,
  } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || ''
  );
  const currentClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || classes[0],
    [classes, selectedClassId]
  );

  const [selectedStream, setSelectedStream] = useState<string>('ALL');
  const [selectedTermId, setSelectedTermId] = useState<string>(
    schoolProfile.activeTermId || terms[0]?.id || ''
  );
  const activeTerm = useMemo(
    () => terms.find((t) => t.id === selectedTermId) || terms[0],
    [terms, selectedTermId]
  );

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'average' | 'total'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'broadsheet' | 'scores' | 'grades'>('broadsheet');

  const isALevel = currentClass?.programme === 'A_LEVEL';

  // Filter learners for this class and stream
  const classLearners = useMemo(() => {
    return learners.filter(
      (l) =>
        l.classId === selectedClassId &&
        (selectedStream === 'ALL' || l.stream === selectedStream) &&
        l.enrolmentStatus === 'Active'
    );
  }, [learners, selectedClassId, selectedStream]);

  // Determine subjects taken by students in this class
  const classSubjects = useMemo(() => {
    if (isALevel) {
      return subjects
        .filter((s) => s.programme === 'A_LEVEL')
        .sort((a, b) => a.code.localeCompare(b.code));
    }
    return subjects
      .filter((s) => s.programme === 'O_LEVEL')
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [subjects, isALevel]);

  // Compute marksheet rows for O-Level
  const oLevelRows = useMemo(() => {
    if (isALevel) return [];

    const computed = classLearners.map((learner) => {
      let totalMarks = 0;
      let totalWeight = 0;
      let subjectCount = 0;
      const aggregatesList: number[] = [];
      let passedEng = false;
      let passedMath = false;

      const subjectData: {
        [subjectId: string]: {
          score: number;
          grade: string;
          aggregate: number;
          isAllocated: boolean;
        };
      } = {};

      classSubjects.forEach((sub) => {
        const isAllocated = learner.allocatedSubjectIds.includes(sub.id);
        if (!isAllocated) {
          subjectData[sub.id] = { score: 0, grade: '—', aggregate: 9, isAllocated: false };
          return;
        }

        const mark = oLevelMarks.find(
          (m) =>
            m.termId === activeTerm.id &&
            m.learnerId === learner.id &&
            m.subjectId === sub.id
        );

        if (mark) {
          const calc = calculateOLevelScore(
            mark.a1_score3,
            mark.a1_score20,
            mark.a2_score3,
            mark.a2_score20,
            mark.a3_eot,
            oLevelBoundaries,
            mark.weightedAverage
          );

          totalMarks += calc.totalScore;
          totalWeight += calc.weightedAverage;
          subjectCount++;
          aggregatesList.push(calc.aggregate);

          if (sub.code === '112' && calc.aggregate <= 8) passedEng = true;
          if (sub.code === '456' && calc.aggregate <= 8) passedMath = true;

          subjectData[sub.id] = {
            score: calc.totalScore,
            grade: calc.grade,
            aggregate: calc.aggregate,
            isAllocated: true,
          };
        } else {
          subjectData[sub.id] = { score: 0, grade: '—', aggregate: 9, isAllocated: true };
        }
      });

      const averageScore = subjectCount > 0 ? Math.round((totalWeight / subjectCount) * 10) / 10 : 0;
      const sortedAggs = [...aggregatesList].sort((a, b) => a - b);
      const best8 = sortedAggs.length >= 8
        ? sortedAggs.slice(0, 8).reduce((a, b) => a + b, 0)
        : sortedAggs.reduce((a, b) => a + b, 0);

      const division = calculateOLevelDivision(aggregatesList, passedEng && passedMath);

      return {
        learner,
        subjectData,
        totalMarks,
        averageScore,
        best8Aggregates: best8,
        division,
        subjectCount,
      };
    });

    // Calculate initial rank by best 8 aggregates (ascending) and average score (descending)
    computed.sort((a, b) => {
      if (a.best8Aggregates !== b.best8Aggregates) {
        return a.best8Aggregates - b.best8Aggregates;
      }
      return b.averageScore - a.averageScore;
    });

    return computed.map((row, idx) => ({
      ...row,
      rank: idx + 1,
    }));
  }, [isALevel, classLearners, classSubjects, oLevelMarks, activeTerm, oLevelBoundaries]);

  // Compute marksheet rows for A-Level
  const aLevelRows = useMemo(() => {
    if (!isALevel) return [];

    const computed = classLearners.map((learner) => {
      let totalPoints = 0;
      let totalScoreSum = 0;
      let subjectCount = 0;
      let principalPasses = 0;
      let subsidiaryPasses = 0;

      const subjectData: {
        [subjectId: string]: {
          average: number;
          grade: string;
          points: number;
          isAllocated: boolean;
          paperSummary: string;
        };
      } = {};

      classSubjects.forEach((sub) => {
        const isAllocated = learner.allocatedSubjectIds.includes(sub.id);
        if (!isAllocated) {
          subjectData[sub.id] = {
            average: 0,
            grade: '—',
            points: 0,
            isAllocated: false,
            paperSummary: '',
          };
          return;
        }

        const mark = aLevelMarks.find(
          (m) =>
            m.termId === activeTerm.id &&
            m.learnerId === learner.id &&
            m.subjectId === sub.id
        );

        const calc = calculateALevelSubjectScore(
          sub,
          mark?.paperScores || {},
          aLevelBoundaries,
          mark?.averageScore
        );

        totalPoints += calc.points;
        totalScoreSum += calc.averageScore;
        subjectCount++;

        const isSubsidiary =
          sub.category === 'subsidiary' ||
          sub.code.startsWith('S') ||
          sub.code === 'P850';

        if (isSubsidiary) {
          if (calc.grade.includes('Pass') || calc.points >= 1) subsidiaryPasses++;
        } else {
          // Principal (A to E = principal pass, O = subsidiary pass)
          if (['A', 'B', 'C', 'D', 'E'].includes(calc.grade.charAt(0))) {
            principalPasses++;
          } else if (calc.grade.charAt(0) === 'O') {
            subsidiaryPasses++;
          }
        }

        // Summary string of papers
        const paperSummary = mark?.paperScores
          ? Object.entries(mark.paperScores)
              .map(([num, val]) => `P${num}:${val}`)
              .join(' ')
          : '';

        subjectData[sub.id] = {
          average: calc.averageScore,
          grade: calc.grade,
          points: calc.points,
          isAllocated: true,
          paperSummary,
        };
      });

      const averageScore = subjectCount > 0 ? Math.round((totalScoreSum / subjectCount) * 10) / 10 : 0;

      return {
        learner,
        subjectData,
        totalPoints,
        averageScore,
        principalPasses,
        subsidiaryPasses,
        subjectCount,
      };
    });

    // Calculate initial rank by totalPoints descending, then averageScore descending
    computed.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.averageScore - a.averageScore;
    });

    return computed.map((row, idx) => ({
      ...row,
      rank: idx + 1,
    }));
  }, [isALevel, classLearners, classSubjects, aLevelMarks, activeTerm, aLevelBoundaries]);

  // Filtered and Sorted Rows for display
  const displayedOLevelRows = useMemo(() => {
    let rows = [...oLevelRows];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          r.learner.fullName.toLowerCase().includes(q) ||
          r.learner.lin.toLowerCase().includes(q) ||
          r.learner.admissionNo.toLowerCase().includes(q) ||
          r.learner.stream.toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.learner.fullName.localeCompare(b.learner.fullName);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (sortBy === 'average') {
        return sortOrder === 'asc' ? a.averageScore - b.averageScore : b.averageScore - a.averageScore;
      }
      if (sortBy === 'total') {
        return sortOrder === 'asc' ? a.totalMarks - b.totalMarks : b.totalMarks - a.totalMarks;
      }
      // default: rank
      return sortOrder === 'asc' ? a.rank - b.rank : b.rank - a.rank;
    });

    return rows;
  }, [oLevelRows, searchQuery, sortBy, sortOrder]);

  const displayedALevelRows = useMemo(() => {
    let rows = [...aLevelRows];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          r.learner.fullName.toLowerCase().includes(q) ||
          r.learner.lin.toLowerCase().includes(q) ||
          r.learner.admissionNo.toLowerCase().includes(q) ||
          (r.learner.aLevelCombination && r.learner.aLevelCombination.toLowerCase().includes(q)) ||
          r.learner.stream.toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.learner.fullName.localeCompare(b.learner.fullName);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (sortBy === 'average') {
        return sortOrder === 'asc' ? a.averageScore - b.averageScore : b.averageScore - a.averageScore;
      }
      if (sortBy === 'total') {
        return sortOrder === 'asc' ? a.totalPoints - b.totalPoints : b.totalPoints - a.totalPoints;
      }
      // default: rank
      return sortOrder === 'asc' ? a.rank - b.rank : b.rank - a.rank;
    });

    return rows;
  }, [aLevelRows, searchQuery, sortBy, sortOrder]);

  // Overall Class Analytics
  const analytics = useMemo(() => {
    if (!isALevel) {
      const div1 = oLevelRows.filter((r) => r.division.includes('Division 1')).length;
      const div2 = oLevelRows.filter((r) => r.division.includes('Division 2')).length;
      const div3 = oLevelRows.filter((r) => r.division.includes('Division 3')).length;
      const div4 = oLevelRows.filter((r) => r.division.includes('Division 4')).length;
      const div9 = oLevelRows.filter((r) => r.division.includes('Division 9')).length;
      const total = oLevelRows.length;
      const classAvg = total > 0
        ? Math.round((oLevelRows.reduce((a, b) => a + b.averageScore, 0) / total) * 10) / 10
        : 0;

      return {
        total,
        classAvg,
        div1,
        div2,
        div3,
        div4,
        div9,
        maxPts: 0,
        avgPts: 0,
        students15Plus: 0,
        threePrincipals: 0,
      };
    } else {
      const total = aLevelRows.length;
      const maxPts = total > 0 ? Math.max(...aLevelRows.map((r) => r.totalPoints)) : 0;
      const avgPts = total > 0
        ? Math.round((aLevelRows.reduce((a, b) => a + b.totalPoints, 0) / total) * 10) / 10
        : 0;
      const students15Plus = aLevelRows.filter((r) => r.totalPoints >= 15).length;
      const threePrincipals = aLevelRows.filter((r) => r.principalPasses >= 3).length;

      return {
        total,
        classAvg: 0,
        div1: 0,
        div2: 0,
        div3: 0,
        div4: 0,
        div9: 0,
        maxPts,
        avgPts,
        students15Plus,
        threePrincipals,
      };
    }
  }, [isALevel, oLevelRows, aLevelRows]);

  // CSV Export for Marksheet
  const handleExportCSV = () => {
    const safeSchoolName = schoolProfile.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeSchoolName}_${currentClass.name}_${selectedStream}_Official_Marksheet.csv`;

    if (!isALevel) {
      const headers = [
        'Rank',
        'Candidate Full Name',
        'Admission No',
        'LIN',
        'Stream',
        ...classSubjects.map((s) => `${s.code} - ${s.name} Score`),
        ...classSubjects.map((s) => `${s.code} Grade`),
        ...classSubjects.map((s) => `${s.code} Aggregate`),
        'Total Score',
        'Overall Average (%)',
        'Best 8 Aggregates',
        'UCE Division',
      ];

      const dataRows = displayedOLevelRows.map((r) => [
        r.rank,
        r.learner.fullName,
        r.learner.admissionNo,
        r.learner.lin,
        r.learner.stream,
        ...classSubjects.map((s) => (r.subjectData[s.id]?.isAllocated ? r.subjectData[s.id].score : '—')),
        ...classSubjects.map((s) => (r.subjectData[s.id]?.isAllocated ? r.subjectData[s.id].grade : '—')),
        ...classSubjects.map((s) => (r.subjectData[s.id]?.isAllocated ? r.subjectData[s.id].aggregate : '—')),
        r.totalMarks,
        r.averageScore,
        r.best8Aggregates,
        r.division,
      ]);

      const csvContent =
        `"${schoolProfile.name} - Official Class Marksheet - ${currentClass.name} (${selectedStream}) - ${activeTerm.name}"\n` +
        `"Generated on: ${new Date().toLocaleDateString()} | Total Candidates: ${displayedOLevelRows.length}"\n\n` +
        exportToCSV(headers, dataRows);

      downloadFile(filename, csvContent);
    } else {
      const headers = [
        'Rank',
        'Candidate Full Name',
        'Admission No',
        'LIN',
        'Combination',
        'Stream',
        ...classSubjects.map((s) => `${s.code} - ${s.name} Avg`),
        ...classSubjects.map((s) => `${s.code} Grade`),
        ...classSubjects.map((s) => `${s.code} Points`),
        'Total Points Got (/20)',
        'Principal Passes',
        'Subsidiary Passes',
        'Overall Average (%)',
      ];

      const dataRows = displayedALevelRows.map((r) => [
        r.rank,
        r.learner.fullName,
        r.learner.admissionNo,
        r.learner.lin,
        r.learner.aLevelCombination || 'UACE',
        r.learner.stream,
        ...classSubjects.map((s) => (r.subjectData[s.id]?.isAllocated ? r.subjectData[s.id].average : '—')),
        ...classSubjects.map((s) => (r.subjectData[s.id]?.isAllocated ? r.subjectData[s.id].grade : '—')),
        ...classSubjects.map((s) => (r.subjectData[s.id]?.isAllocated ? r.subjectData[s.id].points : '—')),
        r.totalPoints,
        r.principalPasses,
        r.subsidiaryPasses,
        r.averageScore,
      ]);

      const csvContent =
        `"${schoolProfile.name} - Official Class Marksheet - ${currentClass.name} (${selectedStream}) - ${activeTerm.name}"\n` +
        `"Generated on: ${new Date().toLocaleDateString()} | Total Candidates: ${displayedALevelRows.length}"\n\n` +
        exportToCSV(headers, dataRows);

      downloadFile(filename, csvContent);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar (Hidden in Print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                School Office &amp; DOS Broadsheets
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {activeTerm.name} ({schoolProfile.academicYear})
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Class Marksheets &amp; Subject Broadsheets
            </h2>
            <p className="text-xs text-slate-500">
              Master broadsheet showing scores, UNEB grades, and aggregates across all subjects per class
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Marksheet (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Marksheet</span>
            </button>
          </div>
        </div>

        {/* Filter Strip */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Class Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Academic Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStream('ALL');
              }}
              className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.programme === 'A_LEVEL' ? 'A-Level UACE' : 'O-Level UCE'})
                </option>
              ))}
            </select>
          </div>

          {/* Stream Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Stream
            </label>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800"
            >
              <option value="ALL">All Streams Combined</option>
              {currentClass?.streams.map((s) => (
                <option key={s} value={s}>
                  {s} Stream
                </option>
              ))}
            </select>
          </div>

          {/* Term Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Academic Term
            </label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.publicationStatus === 'published' ? 'Published' : 'Draft'})
                </option>
              ))}
            </select>
          </div>

          {/* Display Mode */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Cell Display Format
            </label>
            <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('broadsheet')}
                className={`py-1.5 text-center rounded-md transition ${
                  viewMode === 'broadsheet'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setViewMode('scores')}
                className={`py-1.5 text-center rounded-md transition ${
                  viewMode === 'scores'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Scores
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grades')}
                className={`py-1.5 text-center rounded-md transition ${
                  viewMode === 'grades'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grades
              </button>
            </div>
          </div>
        </div>

        {/* Live Automatic Search & Sorting Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Live search candidate by name, LIN, admission number..."
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 text-slate-800"
            >
              <option value="rank">Class Position / Rank</option>
              <option value="name">Candidate Name</option>
              <option value="average">Overall Average (%)</option>
              <option value="total">{isALevel ? 'Total Points (/20)' : 'Total Score'}</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />
              <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>

        {/* Analytics KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Enrolled Candidates
            </span>
            <div className="text-xl font-black text-slate-900 mt-1 font-mono">
              {classLearners.length}
            </div>
            <span className="text-[10px] text-slate-400">{currentClass?.name} ({selectedStream})</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Curriculum Subjects
            </span>
            <div className="text-xl font-black text-emerald-800 mt-1 font-mono">
              {classSubjects.length}
            </div>
            <span className="text-[10px] text-slate-400">{isALevel ? 'UACE Papers' : 'UCE Subjects'}</span>
          </div>

          {!isALevel ? (
            <>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Division 1
                </span>
                <div className="text-xl font-black text-emerald-800 mt-1 font-mono">
                  {analytics.div1}
                </div>
                <span className="text-[10px] text-slate-400">
                  {analytics.total > 0 ? Math.round((analytics.div1 / analytics.total) * 100) : 0}% of class
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                  Division 2
                </span>
                <div className="text-xl font-black text-sky-800 mt-1 font-mono">
                  {analytics.div2}
                </div>
                <span className="text-[10px] text-slate-400">Credit division</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  Division 3 &amp; 4
                </span>
                <div className="text-xl font-black text-amber-800 mt-1 font-mono">
                  {analytics.div3 + analytics.div4}
                </div>
                <span className="text-[10px] text-slate-400">Pass divisions</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Class Mean Average
                </span>
                <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                  {analytics.classAvg}%
                </div>
                <span className="text-[10px] text-slate-400">Across all exams</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                  Max Points Scored
                </span>
                <div className="text-xl font-black text-sky-800 mt-1 font-mono">
                  {analytics.maxPts} <span className="text-xs font-normal text-slate-400">/ 20</span>
                </div>
                <span className="text-[10px] text-slate-400">UACE Top candidate</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Class Mean Points
                </span>
                <div className="text-xl font-black text-emerald-800 mt-1 font-mono">
                  {analytics.avgPts} <span className="text-xs font-normal text-slate-400">Pts</span>
                </div>
                <span className="text-[10px] text-slate-400">Average points got</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  3 Principal Passes
                </span>
                <div className="text-xl font-black text-amber-800 mt-1 font-mono">
                  {analytics.threePrincipals}
                </div>
                <span className="text-[10px] text-slate-400">University eligible</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  15+ Points Scored
                </span>
                <div className="text-xl font-black text-purple-800 mt-1 font-mono">
                  {analytics.students15Plus}
                </div>
                <span className="text-[10px] text-slate-400">Distinction profile</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Official Printable Marksheet Paper Sheet */}
      <div className="bg-white text-slate-900 border-2 border-slate-800 rounded-none sm:rounded-xl p-4 sm:p-6 shadow-xl print:shadow-none print:border-none print:p-0">
        {/* Official School Marksheet Header */}
        <div className="border-b-2 border-slate-800 pb-4 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-2">
              <SchoolLogo
                url={schoolProfile.logoUrl}
                name={schoolProfile.name}
                size="md"
                className="mx-auto"
              />
            </div>
            {/* School Name from Settings */}
            <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-slate-950 font-serif">
              {schoolProfile.name}
            </h1>
            <p className="text-xs font-bold italic text-amber-800">
              &ldquo;{schoolProfile.motto}&rdquo;
            </p>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              {schoolProfile.address} &bull; Tel: {schoolProfile.phone} &bull; Email: {schoolProfile.email}
            </p>

            <div className="mt-2.5 inline-block bg-slate-900 text-white font-black text-[11px] sm:text-xs uppercase tracking-widest px-5 py-1 rounded-xs">
              {isALevel
                ? 'UGANDA ADVANCED CERTIFICATE OF EDUCATION (UACE) - MASTER CLASS MARKSHEET'
                : 'UGANDA CERTIFICATE OF EDUCATION (UCE) - MASTER CLASS MARKSHEET'}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-800">
              <span>
                Class: <strong className="font-extrabold text-slate-950">{currentClass?.name}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Stream: <strong className="font-extrabold text-slate-950">{selectedStream === 'ALL' ? 'All Streams' : selectedStream}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Term: <strong className="font-extrabold text-slate-950">{activeTerm.name} ({schoolProfile.academicYear})</strong>
              </span>
              <span>&bull;</span>
              <span>
                Total Candidates: <strong className="font-mono font-bold text-slate-950">{classLearners.length}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 3. The Comprehensive Marksheet Grid */}
        <div className="my-4 overflow-x-auto">
          {!isALevel ? (
            /* O-LEVEL MARKSHEET TABLE */
            <table className="w-full text-left text-xs border-collapse border-2 border-slate-800">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-extrabold uppercase text-[10px] border-b-2 border-slate-800">
                  <th className="border border-slate-700 px-2 py-2 text-center w-10">Pos</th>
                  <th className="border border-slate-700 px-3 py-2 min-w-[150px]">Candidate Full Name</th>
                  <th className="border border-slate-700 px-2 py-2 w-20 text-center">Adm No</th>
                  <th className="border border-slate-700 px-2 py-2 w-14 text-center">Stream</th>

                  {/* Columns for every subject in the class */}
                  {classSubjects.map((s) => (
                    <th
                      key={s.id}
                      className="border border-slate-700 px-1.5 py-1.5 text-center min-w-[56px]"
                      title={`${s.code} - ${s.name}`}
                    >
                      <div className="font-mono font-black">{s.code}</div>
                      <div className="text-[8px] font-normal truncate max-w-[54px]">{s.name}</div>
                    </th>
                  ))}

                  <th className="border border-slate-700 px-2 py-2 text-center w-14 bg-slate-300 font-black">
                    Total
                  </th>
                  <th className="border border-slate-700 px-2 py-2 text-center w-14 bg-slate-300 font-black">
                    Mean %
                  </th>
                  <th className="border border-slate-700 px-2 py-2 text-center w-16 bg-amber-200 text-amber-950 font-black">
                    Best 8
                  </th>
                  <th className="border border-slate-700 px-2 py-2 text-center min-w-[90px] bg-slate-300 font-black">
                    Division
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-[11px]">
                {displayedOLevelRows.length === 0 ? (
                  <tr>
                    <td colSpan={8 + classSubjects.length} className="p-8 text-center text-slate-500">
                      No candidates found matching the selected class or search filter.
                    </td>
                  </tr>
                ) : (
                  displayedOLevelRows.map((r) => (
                    <tr key={r.learner.id} className="hover:bg-slate-50 transition border-b border-slate-300">
                      {/* Position / Rank */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-mono font-bold text-slate-900 bg-slate-50">
                        {r.rank}
                      </td>

                      {/* Candidate Name */}
                      <td className="border border-slate-300 px-2 py-1">
                        <span className="font-extrabold text-slate-900 block leading-tight">
                          {r.learner.fullName}
                        </span>
                        <span className="font-mono text-[9px] text-slate-500 block">
                          LIN: {r.learner.lin}
                        </span>
                      </td>

                      {/* Admission Number */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-mono text-[10px] text-slate-700">
                        {r.learner.admissionNo}
                      </td>

                      {/* Stream */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-semibold text-slate-700">
                        {r.learner.stream}
                      </td>

                      {/* Subject Cells */}
                      {classSubjects.map((s) => {
                        const cell = r.subjectData[s.id];
                        if (!cell || !cell.isAllocated) {
                          return (
                            <td key={s.id} className="border border-slate-300 px-1 py-1 text-center text-slate-300 font-mono text-[10px] bg-slate-50/50">
                              —
                            </td>
                          );
                        }

                        if (viewMode === 'scores') {
                          return (
                            <td key={s.id} className="border border-slate-300 px-1 py-1 text-center font-mono font-semibold text-slate-900">
                              {cell.score}%
                            </td>
                          );
                        }

                        if (viewMode === 'grades') {
                          return (
                            <td key={s.id} className="border border-slate-300 px-1 py-1 text-center font-bold text-slate-900">
                              {cell.grade}
                            </td>
                          );
                        }

                        // Full broadsheet view: Score + Grade
                        return (
                          <td key={s.id} className="border border-slate-300 px-1 py-1 text-center leading-tight">
                            <span className="font-mono font-bold text-slate-900 block text-[10px]">
                              {cell.score}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1 rounded-2xs inline-block ${
                                cell.grade === 'D1' || cell.grade === 'D2'
                                  ? 'text-emerald-900 bg-emerald-100/80'
                                  : cell.grade.startsWith('C')
                                  ? 'text-sky-900 bg-sky-100/80'
                                  : cell.grade.startsWith('P')
                                  ? 'text-amber-900 bg-amber-100/80'
                                  : 'text-rose-900 bg-rose-100/80'
                              }`}
                            >
                              {cell.grade}
                            </span>
                          </td>
                        );
                      })}

                      {/* Total Score */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-mono font-extrabold text-slate-950 bg-slate-50">
                        {r.totalMarks}
                      </td>

                      {/* Overall Average */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-mono font-bold text-slate-900 bg-slate-50">
                        {r.averageScore}%
                      </td>

                      {/* Best 8 Aggregates */}
                      <td className="border border-slate-300 px-1.5 py-1 text-center font-mono font-black text-amber-950 bg-amber-50">
                        {r.best8Aggregates}
                      </td>

                      {/* UCE Division Status */}
                      <td className="border border-slate-300 px-2 py-1 text-center font-bold text-[10px]">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-xs ${
                            r.division.includes('Division 1')
                              ? 'bg-emerald-100 text-emerald-900 font-extrabold'
                              : r.division.includes('Division 2')
                              ? 'bg-sky-100 text-sky-900'
                              : r.division.includes('Division 3')
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {r.division}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* A-LEVEL MARKSHEET TABLE */
            <table className="w-full text-left text-xs border-collapse border-2 border-slate-800">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-extrabold uppercase text-[10px] border-b-2 border-slate-800">
                  <th className="border border-slate-700 px-2 py-2 text-center w-10">Pos</th>
                  <th className="border border-slate-700 px-3 py-2 min-w-[140px]">Candidate Full Name</th>
                  <th className="border border-slate-700 px-2 py-2 w-20 text-center">Adm No</th>
                  <th className="border border-slate-700 px-2 py-2 w-24 text-center">Combination</th>
                  <th className="border border-slate-700 px-2 py-2 w-14 text-center">Stream</th>

                  {/* A-Level Subject Columns */}
                  {classSubjects.map((s) => (
                    <th
                      key={s.id}
                      className="border border-slate-700 px-1.5 py-1.5 text-center min-w-[65px]"
                      title={`${s.code} - ${s.name}`}
                    >
                      <div className="font-mono font-black">{s.code}</div>
                      <div className="text-[8px] font-normal truncate max-w-[65px]">{s.name}</div>
                    </th>
                  ))}

                  <th className="border border-slate-700 px-2 py-2 text-center w-14 bg-amber-300 text-slate-950 font-black">
                    Points Got
                  </th>
                  <th className="border border-slate-700 px-1 py-2 text-center w-12 bg-slate-300 font-black" title="Principal Passes">
                    PP
                  </th>
                  <th className="border border-slate-700 px-1 py-2 text-center w-12 bg-slate-300 font-black" title="Subsidiary Passes">
                    SP
                  </th>
                  <th className="border border-slate-700 px-2 py-2 text-center w-14 bg-slate-300 font-black">
                    Mean %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-[11px]">
                {displayedALevelRows.length === 0 ? (
                  <tr>
                    <td colSpan={9 + classSubjects.length} className="p-8 text-center text-slate-500">
                      No candidates found matching the selected class or search filter.
                    </td>
                  </tr>
                ) : (
                  displayedALevelRows.map((r) => (
                    <tr key={r.learner.id} className="hover:bg-slate-50 transition border-b border-slate-300">
                      {/* Position / Rank */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-mono font-bold text-slate-900 bg-slate-50">
                        {r.rank}
                      </td>

                      {/* Candidate Name */}
                      <td className="border border-slate-300 px-2 py-1">
                        <span className="font-extrabold text-slate-900 block leading-tight">
                          {r.learner.fullName}
                        </span>
                        <span className="font-mono text-[9px] text-slate-500 block">
                          LIN: {r.learner.lin}
                        </span>
                      </td>

                      {/* Admission No */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-mono text-[10px] text-slate-700">
                        {r.learner.admissionNo}
                      </td>

                      {/* Combination */}
                      <td className="border border-slate-300 px-1.5 py-1 text-center font-mono font-bold text-[10px] text-amber-950 bg-amber-50/50">
                        {r.learner.aLevelCombination || 'UACE'}
                      </td>

                      {/* Stream */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-semibold text-slate-700">
                        {r.learner.stream}
                      </td>

                      {/* Subject Cells */}
                      {classSubjects.map((s) => {
                        const cell = r.subjectData[s.id];
                        if (!cell || !cell.isAllocated) {
                          return (
                            <td key={s.id} className="border border-slate-300 px-1 py-1 text-center text-slate-300 font-mono text-[10px] bg-slate-50/50">
                              —
                            </td>
                          );
                        }

                        if (viewMode === 'scores') {
                          return (
                            <td key={s.id} className="border border-slate-300 px-1 py-1 text-center font-mono font-semibold text-slate-900">
                              {cell.average}%
                            </td>
                          );
                        }

                        if (viewMode === 'grades') {
                          return (
                            <td key={s.id} className="border border-slate-300 px-1 py-1 text-center font-bold text-slate-900">
                              {cell.grade} ({cell.points})
                            </td>
                          );
                        }

                        // Full broadsheet view
                        return (
                          <td key={s.id} className="border border-slate-300 px-1 py-1 text-center leading-tight">
                            <span className="font-mono font-bold text-slate-900 block text-[10px]">
                              {cell.average}%
                            </span>
                            <span
                              className={`text-[9px] font-black px-1 rounded-2xs inline-block ${
                                cell.grade === 'A' || cell.grade === 'B'
                                  ? 'text-emerald-900 bg-emerald-100/80'
                                  : cell.grade === 'C' || cell.grade === 'D'
                                  ? 'text-sky-900 bg-sky-100/80'
                                  : cell.grade === 'E' || cell.grade.includes('Pass')
                                  ? 'text-amber-900 bg-amber-100/80'
                                  : 'text-rose-900 bg-rose-100/80'
                              }`}
                            >
                              {cell.grade} ({cell.points}pts)
                            </span>
                          </td>
                        );
                      })}

                      {/* Total Points Got (/20) */}
                      <td className="border border-slate-300 px-1.5 py-1 text-center font-mono font-black text-amber-950 bg-amber-100/80 text-xs">
                        {r.totalPoints} / 20
                      </td>

                      {/* Principal Passes */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-mono font-extrabold text-slate-900">
                        {r.principalPasses}P
                      </td>

                      {/* Subsidiary Passes */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-mono font-semibold text-slate-700">
                        {r.subsidiaryPasses}S
                      </td>

                      {/* Mean % */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-mono font-bold text-slate-900 bg-slate-50">
                        {r.averageScore}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 4. Official Signatures and Endorsement Footer */}
        <div className="mt-6 pt-4 border-t-2 border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs items-end">
          <div>
            <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
              Class Teacher / DOS Verification:
            </p>
            <div className="border-b border-slate-500 w-44 h-8 flex items-end">
              <span className="font-serif italic text-xs text-slate-700">Mr. Okot David</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Director of Studies &bull; Certified Broadsheet Copy
            </p>
          </div>

          <div className="text-center">
            <div className="w-28 h-12 border-2 border-dashed border-slate-400 rounded-sm mx-auto flex items-center justify-center text-[9px] text-slate-400 font-mono uppercase">
              Official School Seal
            </div>
            <p className="text-[9px] text-slate-500 mt-1">Official Academic Records Office</p>
          </div>

          <div className="text-right">
            <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
              Headteacher Official Approval:
            </p>
            <div className="border-b border-slate-500 w-44 ml-auto h-8 flex items-end justify-center">
              <span className="font-serif italic text-xs text-slate-700">J. Ssenyonga</span>
            </div>
            <p className="font-bold text-slate-900 text-xs mt-1">{schoolProfile.headTeacherName}</p>
            <p className="text-[10px] text-slate-500">{schoolProfile.headTeacherTitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
