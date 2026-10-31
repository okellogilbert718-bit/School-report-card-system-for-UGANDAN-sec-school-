import React from 'react';
import { useApp } from '../../context/AppContext';
import { Learner } from '../../types';
import { SchoolLogo } from '../common/SchoolLogo';
import {
  calculateALevelSubjectScore,
  getAutomaticHeadTeacherComment,
} from '../../utils/academicCalculations';

interface ALevelReportCardProps {
  learner: Learner;
  termId?: string;
}

export const ALevelReportCard: React.FC<ALevelReportCardProps> = ({
  learner,
  termId,
}) => {
  const {
    schoolProfile,
    classes,
    subjects,
    terms,
    aLevelMarks,
    aLevelBoundaries,
    headTeacherComments,
  } = useApp();

  const activeTerm = terms.find((t) => t.id === (termId || schoolProfile.activeTermId)) || terms[0];
  const learnerClass = classes.find((c) => c.id === learner.classId);

  // Filter ONLY learner's assigned subjects!
  const assignedSubjects = subjects.filter(
    (s) =>
      s.programme === 'A_LEVEL' &&
      learner.allocatedSubjectIds.includes(s.id)
  );

  let totalPointsCalculated = 0;
  let totalScoreSum = 0;
  let validScoreCount = 0;

  // Render subject and paper results as a visibly bordered rows-and-columns grid
  const subjectRows = assignedSubjects.map((sub) => {
    const mark = aLevelMarks.find(
      (m) =>
        m.termId === activeTerm.id &&
        m.learnerId === learner.id &&
        m.subjectId === sub.id
    );

    const activePapers = sub.papers
      ? sub.papers.filter((p) => p.active)
      : [{ paperNumber: 1, label: 'Paper 1', active: true, maxScore: 100 }];

    const calc = calculateALevelSubjectScore(
      sub,
      mark?.paperScores || {},
      aLevelBoundaries,
      mark?.averageScore
    );

    const finalAvg = mark?.averageScore ?? calc.averageScore;
    // Grades and points are dynamically evaluated against active assessment planning boundaries
    const finalGrade = calc.grade;
    const finalPoints = calc.points;
    const finalComment = mark?.subjectComment || calc.defaultComment;
    const initials = mark?.teacherInitials || 'TR';

    totalPointsCalculated += finalPoints;
    totalScoreSum += finalAvg;
    validScoreCount++;

    return {
      subject: sub,
      activePapers,
      allPapers: sub.papers || [
        { paperNumber: 1, label: 'Paper 1', active: true, maxScore: 100 },
        { paperNumber: 2, label: 'Paper 2', active: true, maxScore: 100 },
        { paperNumber: 3, label: 'Paper 3', active: false, maxScore: 100 },
        { paperNumber: 4, label: 'Paper 4', active: false, maxScore: 100 },
      ],
      paperScores: mark?.paperScores || {},
      average: finalAvg,
      grade: finalGrade,
      points: finalPoints,
      comment: finalComment,
      initials,
      status: mark?.status || 'draft',
    };
  });

  const overallAverage =
    validScoreCount > 0 ? Math.round((totalScoreSum / validScoreCount) * 10) / 10 : 0;

  // Automated Headteacher comment
  const autoHeadComment = getAutomaticHeadTeacherComment(
    overallAverage,
    'A_LEVEL',
    headTeacherComments
  );

  return (
    <div className="report-card-sheet bg-white text-slate-900 border-2 border-slate-800 rounded-none sm:rounded-lg p-6 sm:p-8 max-w-4xl mx-auto shadow-xl print:shadow-none print:border-2 print:border-slate-800 print:p-6 mb-8">
      {/* 1. Official Centered Report Header */}
      <div className="border-b-2 border-slate-800 pb-5 text-center relative">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-2">
            <SchoolLogo
              url={schoolProfile.logoUrl}
              name={schoolProfile.name}
              size="lg"
              className="mx-auto"
            />
          </div>

          {/* Centered School Name, Motto, Address, Phone, Email */}
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-950 font-serif">
            {schoolProfile.name}
          </h1>

          <p className="text-xs sm:text-sm font-bold italic text-amber-800 mt-0.5">
            &ldquo;{schoolProfile.motto}&rdquo;
          </p>

          <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1">
            {schoolProfile.address} &bull; Tel: {schoolProfile.phone} &bull; Email: {schoolProfile.email}
          </p>

          <div className="mt-3 inline-block bg-slate-900 text-white font-black text-xs sm:text-sm uppercase tracking-widest px-6 py-1 rounded-xs">
            UGANDA ADVANCED CERTIFICATE OF EDUCATION (UACE) - ACADEMIC REPORT
          </div>
        </div>

        {/* Learner Photo (or Initials fallback) pinned top-right */}
        <div className="absolute top-0 right-0 hidden sm:block">
          {learner.photoUrl ? (
            <img
              src={learner.photoUrl}
              alt={learner.fullName}
              className="w-20 h-24 object-cover border-2 border-slate-800 shadow-xs"
            />
          ) : (
            <div className="w-20 h-24 border-2 border-dashed border-slate-400 bg-slate-50 flex flex-col items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
              <span className="text-xs font-black text-slate-700">
                {learner.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <span>Candidate</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Learner Information Grid */}
      <div className="my-4 p-3 bg-slate-50 border border-slate-300 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Candidate Full Name
            </span>
            <span className="font-extrabold text-slate-900 text-sm">{learner.fullName}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              National LIN
            </span>
            <span className="font-mono font-bold text-slate-900">{learner.lin}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              UACE Index / Adm No
            </span>
            <span className="font-mono font-bold text-slate-900">{learner.admissionNo}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Class &amp; Stream
            </span>
            <span className="font-bold text-slate-900">
              {learnerClass?.name || 'Senior 6'} ({learner.stream})
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Subject Combination
            </span>
            <span className="font-extrabold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-sm inline-block">
              {learner.aLevelCombination || 'UACE PCM/ICT'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Academic Term &amp; Year
            </span>
            <span className="font-bold text-slate-900">
              {activeTerm.name} ({schoolProfile.academicYear})
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Attendance Record
            </span>
            <span className="font-bold text-slate-900">
              {learner.daysPresent} / {learner.totalDays} Days Present
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Conduct &amp; Responsibilities
            </span>
            <span className="font-semibold text-emerald-800">{learner.conduct}</span>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED A LEVEL REPORT-CARD TABLE: PAPER OPTIONS & SCORES IN ROWS AND COLUMNS */}
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border-2 border-slate-800">
          <thead>
            {/* Top Header Row with Grouped Paper Columns */}
            <tr className="bg-slate-200 text-slate-900 font-extrabold uppercase text-[10px] border-b-2 border-slate-800">
              <th rowSpan={2} className="border border-slate-700 px-2 py-2 text-center w-14">
                Code
              </th>
              <th rowSpan={2} className="border border-slate-700 px-3 py-2 min-w-[130px]">
                A-Level Subject
              </th>
              {/* Grouped Columns for Paper 1, Paper 2, Paper 3, Paper 4 */}
              <th colSpan={4} className="border border-slate-700 px-2 py-1 text-center bg-slate-300 font-black">
                Paper Options &amp; Scores (/100)
              </th>
              <th rowSpan={2} className="border border-slate-700 px-2 py-2 text-center w-16 bg-slate-300 font-black">
                Subj Avg
              </th>
              <th rowSpan={2} className="border border-slate-700 px-2 py-2 text-center w-14 bg-slate-300 font-black">
                Grade
              </th>
              <th rowSpan={2} className="border border-slate-700 px-2 py-2 text-center w-12 bg-slate-300 font-black">
                Points
              </th>
              <th rowSpan={2} className="border border-slate-700 px-3 py-2 min-w-[170px]">
                Subject Teacher Remark
              </th>
              <th rowSpan={2} className="border border-slate-700 px-1 py-2 text-center w-10">
                Init.
              </th>
            </tr>

            {/* Second Header Row Specifying Individual Paper Columns */}
            <tr className="bg-slate-100 font-bold uppercase text-[9px] border-b-2 border-slate-800 text-slate-800">
              <th className="border border-slate-700 px-1.5 py-1 text-center w-12 bg-slate-100">
                Paper 1
              </th>
              <th className="border border-slate-700 px-1.5 py-1 text-center w-12 bg-slate-100">
                Paper 2
              </th>
              <th className="border border-slate-700 px-1.5 py-1 text-center w-12 bg-slate-100">
                Paper 3
              </th>
              <th className="border border-slate-700 px-1.5 py-1 text-center w-12 bg-slate-100">
                Paper 4
              </th>
            </tr>
          </thead>
          <tbody>
            {subjectRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-4 text-center text-slate-500">
                  No subjects allocated to this candidate.
                </td>
              </tr>
            ) : (
              subjectRows.map((r) => {
                // Determine active paper configurations
                const p1Active = r.activePapers.some((p) => p.paperNumber === 1);
                const p2Active = r.activePapers.some((p) => p.paperNumber === 2);
                const p3Active = r.activePapers.some((p) => p.paperNumber === 3);
                const p4Active = r.activePapers.some((p) => p.paperNumber === 4);

                const p1Score = p1Active ? (r.paperScores[1] ?? '—') : '—';
                const p2Score = p2Active ? (r.paperScores[2] ?? '—') : '—';
                const p3Score = p3Active ? (r.paperScores[3] ?? '—') : '—';
                const p4Score = p4Active ? (r.paperScores[4] ?? '—') : '—';

                return (
                  <tr key={r.subject.id} className="border-b border-slate-400 hover:bg-slate-50">
                    {/* Subject Code */}
                    <td className="border border-slate-400 px-2 py-2 text-center font-mono font-bold text-slate-800">
                      {r.subject.code}
                    </td>

                    {/* Subject Name & Category */}
                    <td className="border border-slate-400 px-3 py-2">
                      <span className="font-extrabold text-slate-900 block leading-tight">
                        {r.subject.name}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">
                        {r.subject.category === 'subsidiary' ? 'Subsidiary' : 'Principal'}
                      </span>
                    </td>

                    {/* Paper 1 Column */}
                    <td
                      className={`border border-slate-400 px-1.5 py-2 text-center font-mono font-bold text-xs ${
                        p1Active ? 'bg-white text-slate-900' : 'bg-slate-100/70 text-slate-400'
                      }`}
                    >
                      {p1Score}
                    </td>

                    {/* Paper 2 Column */}
                    <td
                      className={`border border-slate-400 px-1.5 py-2 text-center font-mono font-bold text-xs ${
                        p2Active ? 'bg-white text-slate-900' : 'bg-slate-100/70 text-slate-400'
                      }`}
                    >
                      {p2Score}
                    </td>

                    {/* Paper 3 Column */}
                    <td
                      className={`border border-slate-400 px-1.5 py-2 text-center font-mono font-bold text-xs ${
                        p3Active ? 'bg-white text-slate-900' : 'bg-slate-100/70 text-slate-400'
                      }`}
                    >
                      {p3Score}
                    </td>

                    {/* Paper 4 Column */}
                    <td
                      className={`border border-slate-400 px-1.5 py-2 text-center font-mono font-bold text-xs ${
                        p4Active ? 'bg-white text-slate-900' : 'bg-slate-100/70 text-slate-400'
                      }`}
                    >
                      {p4Score}
                    </td>

                    {/* Subject Average Column */}
                    <td className="border border-slate-400 px-2 py-2 text-center font-mono font-black text-slate-950 bg-slate-50">
                      {r.average}%
                    </td>

                    {/* Grade Column */}
                    <td className="border border-slate-400 px-2 py-2 text-center font-black text-xs bg-slate-100">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-xs ${
                          r.grade === 'A'
                            ? 'text-emerald-900 font-black'
                            : r.grade === 'B' || r.grade === 'C'
                            ? 'text-sky-900 font-black'
                            : 'text-slate-900'
                        }`}
                      >
                        {r.grade}
                      </span>
                    </td>

                    {/* Points Column */}
                    <td className="border border-slate-400 px-2 py-2 text-center font-mono font-black text-slate-950 bg-slate-100">
                      {r.points}
                    </td>

                    {/* Teacher Remark Column */}
                    <td className="border border-slate-400 px-3 py-2 text-[11px] text-slate-700 italic">
                      {r.comment}
                    </td>

                    {/* Teacher Initials Column */}
                    <td className="border border-slate-400 px-2 py-2 text-center font-mono text-[10px] font-bold text-slate-600">
                      {r.initials}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. TOTAL POINTS GOT - LABELED CLEARLY FROM ONLY ASSIGNED-SUBJECT ROWS */}
      <div className="my-3 p-4 bg-amber-50/70 border-2 border-slate-800 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            UACE Academic Summary
          </span>
          <p className="text-[11px] text-slate-600">
            Computed from {subjectRows.length} officially allocated examination subjects &bull; Overall Average: <strong className="text-slate-900">{overallAverage}%</strong>
          </p>
        </div>

        {/* Total Points Got Badge */}
        <div className="px-5 py-2 bg-slate-900 text-white rounded-md text-center border border-amber-400 shadow-sm shrink-0">
          <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
            Total Points Got:
          </div>
          <div className="text-2xl font-black text-white font-mono leading-none mt-1">
            {totalPointsCalculated}{' '}
            <span className="text-xs font-normal text-slate-400">/ 20 Points</span>
          </div>
        </div>
      </div>

      {/* 5. Teacher & Automatic Headteacher Remarks */}
      <div className="space-y-3 mt-4 text-xs">
        {/* Class Teacher Remark */}
        <div className="border border-slate-400 p-2.5 rounded-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-900 uppercase text-[10px]">
              Class Teacher&apos;s Remark:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Sign: Mr. Okot David</span>
          </div>
          <p className="italic text-slate-800 text-[11px]">
            Outstanding intellectual maturity shown in the principal science subjects. On course for high university government merit sponsorship.
          </p>
        </div>

        {/* Automatic Headteacher Comment */}
        <div className="border border-slate-400 p-2.5 rounded-xs bg-amber-50/40">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-900 uppercase text-[10px]">
              Headteacher&apos;s Official Remark:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {schoolProfile.headTeacherName}
            </span>
          </div>
          <p className="italic text-slate-800 text-[11px] font-medium leading-relaxed">
            {autoHeadComment}
          </p>
        </div>
      </div>

      {/* 6. Footer Notice, Next Term Begins & Stamp Area */}
      <div className="mt-5 pt-3 border-t border-slate-400 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] items-end">
        <div>
          <p className="font-bold text-slate-900">Next Term Begins:</p>
          <p className="font-extrabold text-amber-900 text-xs mt-0.5">
            {schoolProfile.nextTermBegins}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">{schoolProfile.feesBalanceNote}</p>
        </div>

        <div className="text-center">
          <div className="w-24 h-12 border border-dashed border-slate-400 rounded-sm mx-auto flex items-center justify-center text-[9px] text-slate-400 font-mono uppercase">
            Official Stamp
          </div>
          <p className="text-[9px] text-slate-500 mt-1">Not valid without official seal</p>
        </div>

        <div className="text-right">
          <div className="border-b border-slate-600 w-36 ml-auto mb-1 h-8 flex items-end justify-center">
            <span className="font-serif italic text-xs text-slate-700">J. Ssenyonga</span>
          </div>
          <p className="font-bold text-slate-900">{schoolProfile.headTeacherName}</p>
          <p className="text-[10px] text-slate-500">{schoolProfile.headTeacherTitle}</p>
        </div>
      </div>
    </div>
  );
};
