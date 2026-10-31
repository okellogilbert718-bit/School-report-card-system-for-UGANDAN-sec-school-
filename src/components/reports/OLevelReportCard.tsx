import React from 'react';
import { useApp } from '../../context/AppContext';
import { Learner } from '../../types';
import { SchoolLogo } from '../common/SchoolLogo';
import {
  calculateOLevelScore,
  getAutomaticHeadTeacherComment,
  calculateOLevelDivision,
} from '../../utils/academicCalculations';

interface OLevelReportCardProps {
  learner: Learner;
  termId?: string;
}

export const OLevelReportCard: React.FC<OLevelReportCardProps> = ({
  learner,
  termId,
}) => {
  const {
    schoolProfile,
    classes,
    subjects,
    terms,
    oLevelMarks,
    oLevelBoundaries,
    headTeacherComments,
  } = useApp();

  const activeTerm = terms.find((t) => t.id === (termId || schoolProfile.activeTermId)) || terms[0];
  const learnerClass = classes.find((c) => c.id === learner.classId);

  // Filter learner's allocated subjects (only O-Level)
  const learnerSubjects = subjects.filter(
    (s) =>
      s.programme === 'O_LEVEL' &&
      learner.allocatedSubjectIds.includes(s.id)
  );

  // Collect mark rows
  let totalScoreSum = 0;
  let totalWeightSum = 0;
  const aggregatesList: number[] = [];
  let passedEng = false;
  let passedMath = false;

  const subjectResults = learnerSubjects.map((sub) => {
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

      totalScoreSum += mark.totalScore || calc.totalScore;
      totalWeightSum += mark.weightedAverage || calc.weightedAverage;
      aggregatesList.push(calc.aggregate);

      if (sub.code === '112' && calc.aggregate <= 8) passedEng = true;
      if (sub.code === '456' && calc.aggregate <= 8) passedMath = true;

      return {
        subject: sub,
        a1_3: mark.a1_score3,
        a1_20: mark.a1_score20,
        a2_3: mark.a2_score3,
        a2_20: mark.a2_score20,
        a3_eot: mark.a3_eot,
        weightedAverage: mark.weightedAverage || calc.weightedAverage,
        totalScore: mark.totalScore || calc.totalScore,
        // Grade is dynamically evaluated against active assessment planning boundaries
        grade: calc.grade,
        comment: mark.subjectComment || calc.defaultComment,
        initials: mark.teacherInitials || 'TR',
        status: mark.status,
      };
    } else {
      // Unrecorded / pending subject
      return {
        subject: sub,
        a1_3: 0,
        a1_20: 0,
        a2_3: 0,
        a2_20: 0,
        a3_eot: 0,
        weightedAverage: 0,
        totalScore: 0,
        grade: '—',
        comment: 'Assessment pending',
        initials: 'TR',
        status: 'draft' as const,
      };
    }
  });

  const subjectCount = learnerSubjects.length;
  const overallAverage = subjectCount > 0 ? Math.round((totalWeightSum / subjectCount) * 10) / 10 : 0;

  // Best 8 Aggregates
  const sortedAggs = [...aggregatesList].sort((a, b) => a - b);
  const best8Aggregates = sortedAggs.slice(0, 8).reduce((acc, c) => acc + c, 0);
  const division = calculateOLevelDivision(aggregatesList, passedEng && passedMath);

  // Automatic headteacher comment based on learner's overall average
  const autoHeadComment = getAutomaticHeadTeacherComment(
    overallAverage,
    'O_LEVEL',
    headTeacherComments
  );

  return (
    <div className="report-card-sheet bg-white text-slate-900 border-2 border-slate-800 rounded-none sm:rounded-lg p-6 sm:p-8 max-w-4xl mx-auto shadow-xl print:shadow-none print:border-2 print:border-slate-800 print:p-6 mb-8">
      {/* 1. Official Centered Report Header */}
      <div className="border-b-2 border-slate-800 pb-5 text-center relative">
        <div className="flex flex-col items-center justify-center">
          {/* Logo / Crest */}
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
            UGANDA CERTIFICATE OF EDUCATION (UCE) - ACADEMIC REPORT CARD
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
              <span>Photo</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Learner Information Grid */}
      <div className="my-4 p-3 bg-slate-50 border border-slate-300 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Learner&apos;s Full Name
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
              Admission Number
            </span>
            <span className="font-mono font-bold text-slate-900">{learner.admissionNo}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Class &amp; Stream
            </span>
            <span className="font-bold text-slate-900">
              {learnerClass?.name || 'Senior 4'} ({learner.stream})
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
              Gender &amp; Section / House
            </span>
            <span className="font-medium text-slate-800">
              {learner.gender} &bull; {learner.section || 'Muteesa House'}
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
              General Conduct
            </span>
            <span className="font-semibold text-emerald-800">{learner.conduct}</span>
          </div>
        </div>
      </div>

      {/* 3. Official Print-Friendly Table */}
      {/* Subject Code, Subject, Assessment 1 (/3), Assessment 1 (/20), Assessment 2 (/3), Assessment 2 (/20), Assessment 3, weighted average, total, grade, subject comment, teacher initials */}
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-slate-800">
          <thead>
            <tr className="bg-slate-200 text-slate-900 font-extrabold uppercase text-[10px] border-b-2 border-slate-800">
              <th className="border border-slate-700 px-2 py-2 text-center w-12">Code</th>
              <th className="border border-slate-700 px-3 py-2 min-w-[130px]">Subject</th>
              <th className="border border-slate-700 px-1 py-2 text-center w-12" title="Formative Activity (/3)">
                A1 (/3)
              </th>
              <th className="border border-slate-700 px-1 py-2 text-center w-14" title="Topic Test (/20)">
                A1 (/20)
              </th>
              <th className="border border-slate-700 px-1 py-2 text-center w-12" title="Formative Activity (/3)">
                A2 (/3)
              </th>
              <th className="border border-slate-700 px-1 py-2 text-center w-14" title="Topic Project (/20)">
                A2 (/20)
              </th>
              <th className="border border-slate-700 px-1 py-2 text-center w-14" title="End of Term Examination">
                EOT (/80)
              </th>
              <th className="border border-slate-700 px-1 py-2 text-center w-14 bg-slate-300">
                W.Avg
              </th>
              <th className="border border-slate-700 px-1 py-2 text-center w-12 bg-slate-300 font-black">
                Total
              </th>
              <th className="border border-slate-700 px-1 py-2 text-center w-12 bg-slate-300 font-black">
                Grade
              </th>
              <th className="border border-slate-700 px-3 py-2 min-w-[170px]">Subject Teacher Comment</th>
              <th className="border border-slate-700 px-1 py-2 text-center w-10">Init.</th>
            </tr>
          </thead>
          <tbody>
            {subjectResults.map((r) => (
              <tr key={r.subject.id} className="border-b border-slate-300 hover:bg-slate-50">
                <td className="border border-slate-300 px-2 py-1.5 text-center font-mono font-bold">
                  {r.subject.code}
                </td>
                <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                  {r.subject.name}
                </td>
                <td className="border border-slate-300 px-1 py-1.5 text-center font-mono">
                  {r.a1_3}
                </td>
                <td className="border border-slate-300 px-1 py-1.5 text-center font-mono">
                  {r.a1_20}
                </td>
                <td className="border border-slate-300 px-1 py-1.5 text-center font-mono">
                  {r.a2_3}
                </td>
                <td className="border border-slate-300 px-1 py-1.5 text-center font-mono">
                  {r.a2_20}
                </td>
                <td className="border border-slate-300 px-1 py-1.5 text-center font-mono font-semibold">
                  {r.a3_eot}
                </td>
                <td className="border border-slate-300 px-1 py-1.5 text-center font-mono font-bold bg-slate-50">
                  {r.weightedAverage}%
                </td>
                <td className="border border-slate-300 px-1 py-1.5 text-center font-mono font-extrabold text-slate-950 bg-slate-100">
                  {r.totalScore}
                </td>
                <td className="border border-slate-300 px-1 py-1.5 text-center font-black text-xs bg-slate-100">
                  {r.grade}
                </td>
                <td className="border border-slate-300 px-3 py-1.5 text-[11px] text-slate-700 italic">
                  {r.comment}
                </td>
                <td className="border border-slate-300 px-1 py-1.5 text-center font-mono text-[10px] font-bold text-slate-600">
                  {r.initials}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Academic Summary Strip */}
      <div className="my-3 p-3 bg-slate-100 border-2 border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
        <div>
          <span className="text-[10px] font-bold text-slate-600 uppercase block">
            Overall Average
          </span>
          <span className="text-base font-black text-slate-900">{overallAverage}%</span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-600 uppercase block">
            Best 8 Aggregates
          </span>
          <span className="text-base font-black text-amber-900">
            {best8Aggregates || '—'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-600 uppercase block">
            UCE Division Status
          </span>
          <span className="text-sm font-extrabold text-emerald-800">{division}</span>
        </div>

        {schoolProfile.showClassPosition && (
          <div>
            <span className="text-[10px] font-bold text-slate-600 uppercase block">
              Class Position
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              3rd out of 42
            </span>
          </div>
        )}
      </div>

      {/* 5. Teacher & Automatic Headteacher Remarks */}
      <div className="space-y-3 mt-4 text-xs">
        {/* Class Teacher Remark */}
        <div className="border border-slate-400 p-2.5 rounded-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-900 uppercase text-[10px]">
              Class Teacher&apos;s Remark:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Sign: Mr. Kato Godfrey</span>
          </div>
          <p className="italic text-slate-800 text-[11px]">
            A dedicated learner with commendable consistency in sciences and practical assessments. Maintain this momentum into the final national examinations.
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
