import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { OLevelReportCard } from './OLevelReportCard';
import { ALevelReportCard } from './ALevelReportCard';
import { Printer, ShieldAlert, Users, Layers, AlertCircle } from 'lucide-react';

export const BatchReportPrinting: React.FC = () => {
  const { schoolProfile, classes, learners, terms, currentUser } = useApp();

  const isAdmin = currentUser.role === 'admin';
  const activeTerm = terms.find((t) => t.id === schoolProfile.activeTermId) || terms[0];

  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || ''
  );

  const currentClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || classes[0],
    [classes, selectedClassId]
  );

  const [selectedStream, setSelectedStream] = useState<string>('ALL');

  // Filter learners for this class and stream
  const targetLearners = useMemo(() => {
    return learners.filter(
      (l) =>
        l.classId === selectedClassId &&
        (selectedStream === 'ALL' || l.stream === selectedStream) &&
        l.enrolmentStatus === 'Active'
    );
  }, [learners, selectedClassId, selectedStream]);

  const handlePrintAll = () => {
    window.print();
  };

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-white rounded-xl border border-slate-200 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Administrator Access Required</h3>
        <p className="text-xs text-slate-500">
          Batch report printing is restricted to school administrative accounts and the Director of Studies office.
        </p>
      </div>
    );
  }

  const isALevel = currentClass?.programme === 'A_LEVEL';

  return (
    <div className="space-y-6">
      {/* Control Toolbar (Hidden in Print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
                School Office &amp; DOS Terminal
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {activeTerm.name}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Batch Class &amp; Stream Report Card Printing
            </h2>
            <p className="text-xs text-slate-500">
              Generate sequential, page-broken official report cards for an entire stream or class in one print job
            </p>
          </div>

          <button
            type="button"
            disabled={targetLearners.length === 0}
            onClick={handlePrintAll}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-bold shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print All {targetLearners.length} Reports</span>
          </button>
        </div>

        {/* Filter Strip */}
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
              <option value="ALL">All Streams Combined</option>
              {currentClass?.streams.map((s) => (
                <option key={s} value={s}>
                  {s} Stream Only
                </option>
              ))}
            </select>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Candidates in Batch:</span>
            <span className="font-extrabold text-slate-900 font-mono text-sm">
              {targetLearners.length}
            </span>
          </div>
        </div>

        {/* Print guidance banner */}
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-700 shrink-0" />
          <span>
            <strong>Printer tip:</strong> When the browser print window opens, select <strong>Paper Size: A4</strong>, <strong>Margins: Default or None</strong>, and ensure <strong>Background graphics</strong> is enabled.
          </span>
        </div>
      </div>

      {/* Sequential Batch Reports */}
      {targetLearners.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-700">No Candidates in Batch</h3>
          <p className="text-xs text-slate-400 mt-1">
            There are no active learners registered in {currentClass?.name} ({selectedStream}).
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {targetLearners.map((learner, idx) => (
            <div
              key={learner.id}
              className={`${idx < targetLearners.length - 1 ? 'page-break-always' : ''}`}
            >
              {isALevel ? (
                <ALevelReportCard learner={learner} termId={activeTerm.id} />
              ) : (
                <OLevelReportCard learner={learner} termId={activeTerm.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
