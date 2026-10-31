import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GradeBoundary, HeadTeacherCommentRule } from '../../types';
import { DEFAULT_O_LEVEL_BOUNDARIES } from '../../data/mockData';
import {
  BookOpen,
  Layers,
  Save,
  CheckCircle2,
  Lock,
  Unlock,
  ArrowRight,
  Sliders,
  Award,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Calculator,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

interface OLevelAssessmentPlanningProps {
  setActiveTab: (tab: string) => void;
}

export const OLevelAssessmentPlanning: React.FC<OLevelAssessmentPlanningProps> = ({
  setActiveTab,
}) => {
  const {
    currentUser,
    assessmentSets,
    updateAssessmentSet,
    oLevelBoundaries,
    updateOLevelBoundaries,
    headTeacherComments,
    updateHeadTeacherComments,
  } = useApp();

  const isAdmin = currentUser.role === 'admin';
  const [boundaries, setBoundaries] = useState<GradeBoundary[]>(oLevelBoundaries);
  const [htComments, setHtComments] = useState<HeadTeacherCommentRule[]>(() =>
    headTeacherComments.filter((c) => c.programme === 'O_LEVEL')
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Keep local state in sync if context updates
  React.useEffect(() => {
    setBoundaries(oLevelBoundaries);
  }, [oLevelBoundaries]);

  // Live Score Simulator State for testing edited boundaries
  const [testScore, setTestScore] = useState<number>(76);

  // Find simulated grade from currently edited boundaries
  const simulatedMatch = boundaries.find(
    (b) => testScore >= Number(b.minScore) && testScore <= Number(b.maxScore)
  ) || boundaries[boundaries.length - 1];

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
    const newId = `gb-o-${Date.now()}`;
    const newBoundary: GradeBoundary = {
      id: newId,
      grade: 'D1*',
      minScore: 85,
      maxScore: 100,
      points: 1,
      descriptor: 'Special High Distinction',
      commentTemplate: 'Outstanding performance across all continuous and summative assessments.',
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
    if (confirm('Reset O-Level grade boundaries to standard Ugandan UNEB defaults (D1 - F9)?')) {
      setBoundaries(DEFAULT_O_LEVEL_BOUNDARIES);
      updateOLevelBoundaries(DEFAULT_O_LEVEL_BOUNDARIES);
      setSaveMessage('O-Level boundaries reset to standard UNEB defaults (D1 - F9). Immediately applied to reports.');
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
    updateOLevelBoundaries(sanitized);
    // Merge back into full headteacher comments
    const otherComments = headTeacherComments.filter((c) => c.programme !== 'O_LEVEL');
    updateHeadTeacherComments([...otherComments, ...htComments]);

    setSaveMessage('O-Level grade boundaries, points (aggregates), and labels saved! Changes are immediately active on all report cards.');
    setTimeout(() => setSaveMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              Settings &bull; O Level Assessment Planning
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Administrator Mode Active</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            O Level Assessment Planning &amp; Editable Grading Scale
          </h2>
          <p className="text-xs text-slate-500">
            Administrators can edit grade boundaries, point values (aggregates), descriptors, and labels directly in this view
          </p>
        </div>

        {/* Quick Links to Marks Workspace & Report Cards */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('marks-o-level')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open O-Level Marks</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports-o-level')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <span>View Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* 1. Assessment Sets Configuration */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>O-Level Continuous &amp; Summative Assessment Sets</span>
        </h3>
        <p className="text-xs text-slate-500">
          Control maximum scores, weightings, and open/closed submission status for formative assessments and end-of-term exams
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assessmentSets.map((as) => (
            <div
              key={as.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-800 uppercase">
                    {as.code.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateAssessmentSet(as.id, { isOpen: !as.isOpen })
                    }
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase transition ${
                      as.isOpen
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {as.isOpen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{as.isOpen ? 'Open' : 'Closed'}</span>
                  </button>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-1">{as.name}</h4>
                <div className="text-[11px] text-slate-500 mt-2 space-y-1">
                  <div>
                    Max Score: <strong>{as.maxScore}</strong>
                  </div>
                  <div>
                    Weighting: <strong>{as.weightPercent}%</strong> of term result
                  </div>
                  <div>
                    Deadline: <span className="font-mono">{as.deadline || 'Ongoing'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  updateAssessmentSet(as.id, { isOpen: !as.isOpen })
                }
                className="w-full py-1 text-center rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700"
              >
                {as.isOpen ? 'Close Marks Submission' : 'Reopen for Submission'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. EDITABLE O-LEVEL GRADE BOUNDARIES, POINT VALUES & LABELS */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>O-Level Grade Boundaries, Point Values (Aggregates) &amp; Labels</span>
            </h3>
            <p className="text-xs text-slate-500">
              Directly edit the grade label, percentage thresholds, aggregate point values, and descriptors below
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Grade Tier</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Grade Settings</span>
            </button>
          </div>
        </div>

        {/* Administrator guidance notice */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Administrator Instructions:</strong> All text and number boxes in this table are live editable.
            Changing a grade label (e.g. from <em>D1</em> to <em>Distinction 1</em> or <em>A*</em>) or adjusting point values (aggregates 1 to 9) immediately cascades to O-Level marks calculations and generated report cards upon saving.
          </div>
        </div>

        {/* The Editable Grid */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2.5 w-24 text-center bg-amber-100/60 border-r border-slate-200">
                  Grade Label
                </th>
                <th className="px-3 py-2.5 w-24 text-center">Min Score (%)</th>
                <th className="px-3 py-2.5 w-24 text-center">Max Score (%)</th>
                <th className="px-3 py-2.5 w-24 text-center bg-slate-50">
                  Point / Aggregate
                </th>
                <th className="px-3 py-2.5 min-w-[160px]">Descriptor / Competency</th>
                <th className="px-3 py-2.5 min-w-[260px]">Default Teacher Comment Template</th>
                <th className="px-2 py-2.5 w-12 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {boundaries.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition">
                  {/* EDITABLE GRADE LABEL INPUT */}
                  <td className="px-3 py-2 text-center bg-amber-50/40 border-r border-slate-100">
                    <input
                      type="text"
                      value={b.grade}
                      onChange={(e) => handleBoundaryChange(b.id, 'grade', e.target.value)}
                      placeholder="e.g. D1"
                      className="w-20 px-2 py-1 text-center font-mono font-black text-xs text-slate-900 rounded-md border border-amber-400 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    />
                  </td>

                  {/* EDITABLE MIN % BOUNDARY */}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={b.minScore}
                      onChange={(e) =>
                        handleBoundaryChange(b.id, 'minScore', parseFloat(e.target.value) || 0)
                      }
                      className="w-20 px-2 py-1 text-center font-mono text-xs rounded-md border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </td>

                  {/* EDITABLE MAX % BOUNDARY */}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={b.maxScore}
                      onChange={(e) =>
                        handleBoundaryChange(b.id, 'maxScore', parseFloat(e.target.value) || 0)
                      }
                      className="w-20 px-2 py-1 text-center font-mono text-xs rounded-md border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </td>

                  {/* EDITABLE POINT / AGGREGATE VALUE */}
                  <td className="px-3 py-2 text-center bg-slate-50">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={b.points}
                      onChange={(e) =>
                        handleBoundaryChange(b.id, 'points', parseInt(e.target.value) || 0)
                      }
                      className="w-16 px-2 py-1 text-center font-mono font-extrabold text-xs rounded-md border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </td>

                  {/* EDITABLE DESCRIPTOR */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={b.descriptor}
                      onChange={(e) => handleBoundaryChange(b.id, 'descriptor', e.target.value)}
                      placeholder="e.g. Distinction 1 (Exceptional)"
                      className="w-full px-2.5 py-1 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </td>

                  {/* EDITABLE COMMENT TEMPLATE */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={b.commentTemplate}
                      onChange={(e) => handleBoundaryChange(b.id, 'commentTemplate', e.target.value)}
                      placeholder="Subject teacher comment template..."
                      className="w-full px-2.5 py-1 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </td>

                  {/* DELETE ROW */}
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteBoundary(b.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition rounded-md"
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

        {/* Live Simulator & Verification Box */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Interactive Grade Boundary Simulator
              </h4>
              <p className="text-[11px] text-slate-500">
                Test how a sample percentage score maps to your edited boundaries above
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Test Score:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={testScore}
                onChange={(e) => setTestScore(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 text-xs font-bold font-mono rounded-md border border-slate-300 bg-white text-center"
              />
              <span className="text-xs font-bold text-slate-600">%</span>
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-300">
              <span className="text-xs text-slate-500">Yields:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black font-mono text-xs border border-emerald-300">
                {simulatedMatch?.grade || '—'}
              </span>
              <span className="text-xs text-slate-700 font-mono font-bold">
                (Aggregate {simulatedMatch?.points})
              </span>
              <span className="text-xs text-slate-500 italic max-w-xs truncate hidden lg:inline">
                &mdash; {simulatedMatch?.descriptor}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Automatic Headteacher Comments for O-Level */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <span>Automatic Headteacher Comment Rules (O-Level)</span>
        </h3>
        <p className="text-xs text-slate-500">
          Comments automatically rendered on the student report card based on overall percentage average
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
            <span>Save All O-Level Planning Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
