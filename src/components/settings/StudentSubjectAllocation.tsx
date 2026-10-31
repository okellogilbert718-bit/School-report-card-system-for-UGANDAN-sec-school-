import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Subject, Learner } from '../../types';
import {
  CheckSquare,
  Square,
  Save,
  CheckCircle2,
  Users,
  BookOpen,
  Filter,
  Sparkles,
} from 'lucide-react';

export const StudentSubjectAllocation: React.FC = () => {
  const { classes, subjects, learners, updateLearner } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[classes.length - 1]?.id || classes[0]?.id || ''
  );

  const currentClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || classes[0],
    [classes, selectedClassId]
  );

  const [selectedStream, setSelectedStream] = useState<string>('ALL');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Subjects for this class's programme
  const progSubjects = useMemo(
    () => subjects.filter((s) => s.programme === currentClass?.programme),
    [subjects, currentClass]
  );

  // Learners in this class and stream
  const targetLearners = useMemo(() => {
    return learners.filter(
      (l) =>
        l.classId === selectedClassId &&
        (selectedStream === 'ALL' || l.stream === selectedStream) &&
        l.enrolmentStatus === 'Active'
    );
  }, [learners, selectedClassId, selectedStream]);

  // Toggle individual learner-subject assignment
  const handleToggle = (learner: Learner, subjectId: string) => {
    const current = learner.allocatedSubjectIds || [];
    const next = current.includes(subjectId)
      ? current.filter((id) => id !== subjectId)
      : [...current, subjectId];

    updateLearner(learner.id, { allocatedSubjectIds: next });
    setSaveMessage(`Updated allocations for ${learner.fullName}`);
    setTimeout(() => setSaveMessage(null), 1500);
  };

  // Bulk allocate compulsory subjects for all learners in this class
  const handleAllocateCompulsory = () => {
    const compulsoryIds = progSubjects.filter((s) => s.isCompulsory).map((s) => s.id);
    targetLearners.forEach((l) => {
      const merged = Array.from(new Set([...(l.allocatedSubjectIds || []), ...compulsoryIds]));
      updateLearner(l.id, { allocatedSubjectIds: merged });
    });
    setSaveMessage(`Allocated ${compulsoryIds.length} compulsory subjects to all candidates!`);
    setTimeout(() => setSaveMessage(null), 2500);
  };

  // Bulk allocate all subjects for a column/subject
  const handleToggleColumn = (subjectId: string, allocate: boolean) => {
    targetLearners.forEach((l) => {
      const current = l.allocatedSubjectIds || [];
      const next = allocate
        ? Array.from(new Set([...current, subjectId]))
        : current.filter((id) => id !== subjectId);
      updateLearner(l.id, { allocatedSubjectIds: next });
    });
    setSaveMessage(allocate ? 'Allocated subject to all candidates' : 'Removed subject from all candidates');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
              Settings &bull; Curriculum Registration
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Student Subject Allocation Matrix
          </h2>
          <p className="text-xs text-slate-500">
            Interactive checkbox grid for enrolling learners into compulsory and elective UNEB / UACE subjects
          </p>
        </div>

        <button
          type="button"
          onClick={handleAllocateCompulsory}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Auto-Allocate Compulsory Subjects</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Class & Stream Selector Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Select Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedStream('ALL');
            }}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code}) &mdash; {c.programme === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Select Stream
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

        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>Active Candidates:</span>
          <span className="font-extrabold text-slate-900 font-mono text-sm">
            {targetLearners.length}
          </span>
        </div>
      </div>

      {/* Checkbox Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="px-3 py-3 w-10">#</th>
                <th className="px-3 py-3 min-w-[180px] sticky left-0 bg-slate-900 z-10 shadow-xs">
                  Candidate Full Name
                </th>
                <th className="px-2 py-3 w-20 text-center">Allocated</th>

                {/* Subject Columns */}
                {progSubjects.map((sub) => (
                  <th
                    key={sub.id}
                    className={`px-2 py-3 text-center min-w-[90px] border-l border-slate-800 ${
                      sub.isCompulsory ? 'bg-amber-950' : 'bg-slate-900'
                    }`}
                  >
                    <div className="font-mono text-amber-300 font-bold">{sub.code}</div>
                    <div className="truncate max-w-[85px] mx-auto text-[9px] text-slate-300 font-normal">
                      {sub.name}
                    </div>
                    {sub.isCompulsory && (
                      <span className="text-[8px] bg-amber-500 text-slate-950 px-1 rounded-xs font-black uppercase">
                        Req
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {targetLearners.length === 0 ? (
                <tr>
                  <td
                    colSpan={3 + progSubjects.length}
                    className="p-8 text-center text-slate-400"
                  >
                    No learners found in {currentClass?.name} ({selectedStream}).
                  </td>
                </tr>
              ) : (
                targetLearners.map((learner, idx) => {
                  const allocated = learner.allocatedSubjectIds || [];

                  return (
                    <tr key={learner.id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Sticky Learner Name */}
                      <td className="px-3 py-2 sticky left-0 bg-white font-bold text-slate-900 z-10 shadow-xs">
                        <div className="truncate max-w-[170px]">{learner.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-mono font-normal">
                          {learner.lin} &bull; {learner.stream}
                        </div>
                      </td>

                      {/* Count of allocated subjects */}
                      <td className="px-2 py-2 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold font-mono text-[10px]">
                          {allocated.length}
                        </span>
                      </td>

                      {/* Subject Checkboxes */}
                      {progSubjects.map((sub) => {
                        const isChecked = allocated.includes(sub.id);

                        return (
                          <td
                            key={sub.id}
                            onClick={() => handleToggle(learner, sub.id)}
                            className={`px-2 py-2 text-center cursor-pointer select-none border-l border-slate-100 transition ${
                              isChecked ? 'bg-amber-50/50' : 'hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-amber-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                          </td>
                        );
                      })}
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
