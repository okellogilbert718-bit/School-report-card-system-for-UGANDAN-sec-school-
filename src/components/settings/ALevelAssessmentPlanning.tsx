import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GradeBoundary, HeadTeacherCommentRule } from '../../types';
import { DEFAULT_A_LEVEL_BOUNDARIES } from '../../data/mockData';
import {
  Award,
  Layers,
  Save,
  CheckCircle2,
  ArrowRight,
  Sliders,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface ALevelAssessmentPlanningProps {
  setActiveTab: (tab: string) => void;
}

export const ALevelAssessmentPlanning: React.FC<ALevelAssessmentPlanningProps> = ({
  setActiveTab,
}) => {
  const {
    aLevelBoundaries,
    updateALevelBoundaries,
    headTeacherComments,
    updateHeadTeacherComments,
    subjects,
    toggleSubjectPaper,
  } = useApp();

  const [boundaries, setBoundaries] = useState<GradeBoundary[]>(aLevelBoundaries);
  const [htComments, setHtComments] = useState<HeadTeacherCommentRule[]>(() =>
    headTeacherComments.filter((c) => c.programme === 'A_LEVEL')
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects.find((s) => s.programme === 'A_LEVEL')?.id || ''
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Keep local state in sync if context updates
  React.useEffect(() => {
    setBoundaries(aLevelBoundaries);
  }, [aLevelBoundaries]);

  const aLevelSubs = subjects.filter((s) => s.programme === 'A_LEVEL');
  const currentSub = aLevelSubs.find((s) => s.id === selectedSubjectId) || aLevelSubs[0];

  const handleBoundaryChange = (
    id: string,
    field: keyof GradeBoundary,
    value: string | number
  ) => {
    setBoundaries((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleAddBoundary = () => {
    const newId = `gb-a-${Date.now()}`;
    const newBoundary: GradeBoundary = {
      id: newId,
      grade: 'A*',
      minScore: 85,
      maxScore: 100,
      points: 6,
      descriptor: 'Special High Distinction (6 Pts)',
      commentTemplate: 'Exceptional intellectual mastery across all paper components.',
    };
    setBoundaries((prev) => [newBoundary, ...prev]);
  };

  const handleDeleteBoundary = (id: string) => {
    if (boundaries.length <= 1) {
      alert('You must maintain at least one grade boundary.');
      return;
    }
    setBoundaries((prev) => prev.filter((b) => b.id !== id));
  };

  const handleResetDefaults = () => {
    if (confirm('Reset A-Level grade boundaries to standard Ugandan UACE defaults (A - F)?')) {
      setBoundaries(DEFAULT_A_LEVEL_BOUNDARIES);
      updateALevelBoundaries(DEFAULT_A_LEVEL_BOUNDARIES);
      setSaveMessage('A-Level boundaries reset to standard UACE defaults (A - F). Immediately applied to reports.');
      setTimeout(() => setSaveMessage(null), 3500);
    }
  };

  const handleHtCommentChange = (id: string, comment: string) => {
    setHtComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, comment } : c))
    );
  };

  const handleSaveAll = () => {
    const sanitized: GradeBoundary[] = boundaries.map((b) => ({
      ...b,
      minScore: Number(b.minScore),
      maxScore: Number(b.maxScore),
      points: Number(b.points),
    }));
    updateALevelBoundaries(sanitized);
    const otherComments = headTeacherComments.filter((c) => c.programme !== 'A_LEVEL');
    updateHeadTeacherComments([...otherComments, ...htComments]);

    setSaveMessage('A-Level grade boundaries, points (UACE 6 - 0 scale), and labels saved! Immediately updated on all report cards.');
    setTimeout(() => setSaveMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
              Settings &bull; A Level Curriculum Planning
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            A Level Assessment Planning &amp; UACE Points Grading
          </h2>
          <p className="text-xs text-slate-500">
            Configure paper options per subject, editable principal grade boundaries (A - F, 6 - 0 pts), and headteacher remarks
          </p>
        </div>

        {/* Quick Links to A-Level Marks & Report Cards */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('marks-a-level')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Award className="w-3.5 h-3.5 text-sky-400" />
            <span>Open A-Level Marks</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports-a-level')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <span>View Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* 1. Subject Paper Configuration Manager */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600" />
          <span>Four A Level Paper Options per Subject</span>
        </h3>
        <p className="text-xs text-slate-500">
          Configure which of the 4 papers are active for each A-Level subject. These control the score textboxes in the workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs font-semibold text-slate-700">Select Subject:</label>
          <select
            value={currentSub?.id || ''}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
          >
            {aLevelSubs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name} ({s.category.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {currentSub && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[1, 2, 3, 4].map((paperNum) => {
              const paper = (currentSub.papers || []).find((p) => p.paperNumber === paperNum) || {
                paperNumber: paperNum,
                label: `Paper ${paperNum}`,
                active: paperNum <= 2,
                maxScore: 100,
              };

              return (
                <div
                  key={paperNum}
                  onClick={() => toggleSubjectPaper(currentSub.id, paperNum, !paper.active)}
                  className={`p-3 rounded-xl border cursor-pointer select-none transition flex items-center justify-between ${
                    paper.active
                      ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs flex items-center gap-1.5">
                      {paper.active ? (
                        <CheckSquare className="w-4 h-4 text-sky-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>Paper {paperNum}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal block mt-0.5 truncate max-w-[120px]">
                      {paper.label}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-xs font-black uppercase ${
                      paper.active ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {paper.active ? 'Active' : 'Disabled'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. UACE Principal Grade-to-Points Scale (A - F, 6 - 0 pts) */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600" />
              <span>Ugandan A-Level UACE Grade &amp; Points Boundaries (Editable)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Edit grade letters, percentage ranges, points weighting, descriptors, and comment templates
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleAddBoundary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              <span>Add Grade Tier</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Save All Changes</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2 w-20 text-center bg-sky-50/70 border-r border-slate-200">
                  Grade Code
                </th>
                <th className="px-3 py-2 w-20 text-center">Min %</th>
                <th className="px-3 py-2 w-20 text-center">Max %</th>
                <th className="px-3 py-2 w-20 text-center bg-amber-50">Points</th>
                <th className="px-3 py-2 min-w-[150px]">Descriptor</th>
                <th className="px-3 py-2 min-w-[250px]">Comment Template</th>
                <th className="px-2 py-2 w-12 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {boundaries.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  {/* EDITABLE GRADE CODE / LETTER */}
                  <td className="px-3 py-2 text-center bg-sky-50/40 border-r border-slate-100">
                    <input
                      type="text"
                      value={b.grade}
                      onChange={(e) => handleBoundaryChange(b.id, 'grade', e.target.value)}
                      placeholder="e.g. A"
                      className="w-16 px-1.5 py-1 text-center font-mono font-black text-xs text-slate-900 rounded-md border border-sky-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                  </td>

                  {/* EDITABLE MIN % */}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      step="0.5"
                      value={b.minScore}
                      onChange={(e) =>
                        handleBoundaryChange(b.id, 'minScore', parseFloat(e.target.value) || 0)
                      }
                      className="w-16 px-1.5 py-1 text-center font-mono text-xs rounded-md border border-slate-300 focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* EDITABLE MAX % */}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      step="0.5"
                      value={b.maxScore}
                      onChange={(e) =>
                        handleBoundaryChange(b.id, 'maxScore', parseFloat(e.target.value) || 0)
                      }
                      className="w-16 px-1.5 py-1 text-center font-mono text-xs rounded-md border border-slate-300 focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* EDITABLE POINTS */}
                  <td className="px-3 py-2 text-center font-mono font-black text-amber-900 bg-amber-50/50">
                    <input
                      type="number"
                      value={b.points}
                      onChange={(e) =>
                        handleBoundaryChange(b.id, 'points', parseInt(e.target.value) || 0)
                      }
                      className="w-14 px-1.5 py-1 text-center font-mono font-bold text-xs rounded-md border border-amber-300 focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* EDITABLE DESCRIPTOR */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={b.descriptor}
                      onChange={(e) => handleBoundaryChange(b.id, 'descriptor', e.target.value)}
                      placeholder="e.g. Principal Pass - Grade A"
                      className="w-full px-2 py-1 text-xs rounded-md border border-slate-300 focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* EDITABLE COMMENT TEMPLATE */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={b.commentTemplate}
                      onChange={(e) => handleBoundaryChange(b.id, 'commentTemplate', e.target.value)}
                      placeholder="Teacher comment template..."
                      className="w-full px-2 py-1 text-xs rounded-md border border-slate-300 focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* DELETE ROW */}
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteBoundary(b.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Delete this grade tier"
                    >
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Automatic Headteacher Comments for A-Level */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-600" />
          <span>Automatic Headteacher Comment Rules (A-Level)</span>
        </h3>
        <p className="text-xs text-slate-500">
          Comments automatically rendered on the student UACE report card based on overall candidate percentage
        </p>

        <div className="space-y-3">
          {htComments.map((ht) => (
            <div
              key={ht.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              <div className="font-mono text-xs font-bold text-slate-800 shrink-0 w-28">
                {ht.minAverage}% &mdash; {ht.maxAverage}%
              </div>
              <input
                type="text"
                value={ht.comment}
                onChange={(e) => handleHtCommentChange(ht.id, e.target.value)}
                className="flex-1 w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:ring-1 focus:ring-amber-500 bg-white"
              />
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Save A-Level Planning Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
