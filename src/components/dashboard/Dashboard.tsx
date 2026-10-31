import React from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolLogo } from '../common/SchoolLogo';
import {
  Users,
  GraduationCap,
  BookOpen,
  Award,
  Calendar,
  FileCheck,
  ArrowRight,
  Printer,
  Sparkles,
  ShieldAlert,
  Clock,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedLearnerId?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  setSelectedLearnerId,
}) => {
  const {
    schoolProfile,
    currentUser,
    learners,
    subjects,
    teachers,
    classes,
    terms,
    oLevelMarks,
    aLevelMarks,
  } = useApp();

  const currentTerm = terms.find((t) => t.id === schoolProfile.activeTermId) || terms[0];
  const isParentOrLearner = currentUser.role === 'learner_parent';

  // If learner/parent, find their linked learner
  const linkedLearner = isParentOrLearner
    ? learners.find((l) => l.id === currentUser.learnerId) || learners[0]
    : null;

  const oLevelLearnersCount = learners.filter((l) => l.programme === 'O_LEVEL').length;
  const aLevelLearnersCount = learners.filter((l) => l.programme === 'A_LEVEL').length;
  const activeLearnersCount = learners.filter((l) => l.enrolmentStatus === 'Active').length;

  // Learner/Parent View
  if (isParentOrLearner && linkedLearner) {
    const learnerClass = classes.find((c) => c.id === linkedLearner.classId);
    const isTermPublished = currentTerm?.publicationStatus === 'published';

    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {linkedLearner.photoUrl ? (
                <img
                  src={linkedLearner.photoUrl}
                  alt={linkedLearner.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center border-2 border-white shadow-md">
                  {linkedLearner.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
              )}
              <div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 mb-1">
                  Learner &amp; Parent Portal
                </span>
                <h2 className="text-xl sm:text-2xl font-bold">{linkedLearner.fullName}</h2>
                <p className="text-xs text-slate-300">
                  LIN: <span className="font-mono text-amber-300 font-semibold">{linkedLearner.lin}</span> &bull;{' '}
                  Class: {learnerClass?.name || 'S.4'} ({linkedLearner.stream}) &bull;{' '}
                  {linkedLearner.programme === 'O_LEVEL' ? 'O-Level Curriculum' : 'A-Level UACE'}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-xs text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>{currentTerm?.name}</span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  isTermPublished
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                {isTermPublished ? 'Report Published & Verified' : 'Term Report Pending Publication'}
              </span>
            </div>
          </div>
        </div>

        {/* Action & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span>Official Term Report Card</span>
                <FileCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {currentTerm?.name} Performance
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                View your complete results table, subject grades, conduct assessment, and headteacher circular.
              </p>
            </div>
            {isTermPublished ? (
              <button
                type="button"
                onClick={() => {
                  if (setSelectedLearnerId) setSelectedLearnerId(linkedLearner.id);
                  setActiveTab(
                    linkedLearner.programme === 'O_LEVEL' ? 'reports-o-level' : 'reports-a-level'
                  );
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
              >
                <span>View &amp; Print Official Report Card</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Reports for this term will be available once finalized by the school administration.</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
              <span>Term Attendance</span>
              <Calendar className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">
              {linkedLearner.daysPresent} / {linkedLearner.totalDays}{' '}
              <span className="text-xs font-normal text-slate-500">Days Present</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
              <div
                className="bg-sky-600 h-2 rounded-full"
                style={{
                  width: `${Math.round((linkedLearner.daysPresent / linkedLearner.totalDays) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500">
              Attendance rate:{' '}
              <span className="font-semibold text-slate-700">
                {Math.round((linkedLearner.daysPresent / linkedLearner.totalDays) * 100)}%
              </span>{' '}
              ({linkedLearner.conduct})
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
              <span>Next Term Schedule</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mb-1">
              {schoolProfile.nextTermBegins}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              {schoolProfile.feesBalanceNote}
            </p>
            <div className="text-[11px] font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <strong>Need help?</strong> Contact school bursar / DOS at {schoolProfile.phone}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Staff (Admin & Teacher) View
  return (
    <div className="space-y-6">
      {/* Top Banner with configured school name */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-6 sm:p-7 shadow-md border border-slate-700/70">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <SchoolLogo url={schoolProfile.logoUrl} name={schoolProfile.name} size="lg" />
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 mb-1.5">
                <Sparkles className="w-3 h-3" /> Ugandan Secondary Academic Management
              </span>
              <h2 className="text-xl sm:text-2xl font-bold leading-tight">
                {schoolProfile.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 italic mt-0.5">
                &ldquo;{schoolProfile.motto}&rdquo;
              </p>
              <p className="text-xs text-amber-300/90 mt-1">
                {schoolProfile.address} &bull; {schoolProfile.phone}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-xs space-y-1.5 shrink-0 w-full sm:w-auto">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Academic Year:</span>
              <span className="font-bold text-white">{schoolProfile.academicYear}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Active Term:</span>
              <span className="font-bold text-amber-300">{currentTerm?.name}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Report Status:</span>
              <span
                className={`px-2 py-0.5 rounded-sm font-semibold uppercase text-[10px] ${
                  currentTerm?.publicationStatus === 'published'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                {currentTerm?.publicationStatus === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-medium">Total Learners</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{learners.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            <span className="font-semibold text-emerald-600">{activeLearnersCount}</span> active enrolled
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-medium">Curriculum Split</span>
            <GraduationCap className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{oLevelLearnersCount}</span>
            <span className="text-xs text-slate-500 font-medium">O-Level</span>
            <span className="text-slate-300 font-light">/</span>
            <span className="text-2xl font-extrabold text-slate-900">{aLevelLearnersCount}</span>
            <span className="text-xs text-slate-500 font-medium">A-Level</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {classes.length} classes across 6 senior forms
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-medium">Subjects Registered</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{subjects.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {subjects.filter((s) => s.programme === 'O_LEVEL').length} O-Level &bull;{' '}
            {subjects.filter((s) => s.programme === 'A_LEVEL').length} A-Level
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-medium">Teaching Faculty</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{teachers.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Subject masters &amp; form tutors
          </p>
        </div>
      </div>

      {/* Quick Action Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* O Level Workspace Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-amber-400 transition group flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition">
              O Level Marks (S.1 - S.4)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Assessment 1 (/3, /20), Assessment 2 (/3, /20), End of term (/80), and UNEB D1-F9 grades.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('marks-o-level')}
              className="flex-1 py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition"
            >
              <span>Marks Entry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports-o-level')}
              className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Reports
            </button>
          </div>
        </div>

        {/* A Level Workspace Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-amber-400 transition group flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition">
              A Level Marks (S.5 - S.6)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Configurable 4-paper options, Principal grades (A-F), Subsidiary GP/Sub-Math, and UACE points.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('marks-a-level')}
              className="flex-1 py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition"
            >
              <span>Marks Entry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports-a-level')}
              className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Reports
            </button>
          </div>
        </div>

        {/* Class Marksheets & Broadsheets Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-amber-400 transition group flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition">
              Class Marksheets
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Master class broadsheets showing all candidate subject scores, division status, and ranks in one sheet.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('marksheets')}
              className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>Open Marksheet</span>
            </button>
          </div>
        </div>

        {/* Batch Printing Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-amber-400 transition group flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition">
              Batch Report Printing
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Print all class or stream report cards simultaneously with automatic page breaks and verification stamps.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('reports-batch')}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Launch Batch Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notice on Term Publication */}
      {currentTerm?.publicationStatus === 'draft' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <strong className="font-bold">{currentTerm.name} is currently in DRAFT status.</strong>
            <p className="mt-0.5">
              Learners and parents cannot view their report cards until the Director of Studies or Headteacher publishes the term in Settings &gt; Academic Structure &amp; Terms.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
