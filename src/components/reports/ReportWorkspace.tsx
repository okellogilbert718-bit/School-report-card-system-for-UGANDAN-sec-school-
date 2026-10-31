import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Programme } from '../../types';
import { OLevelReportCard } from './OLevelReportCard';
import { ALevelReportCard } from './ALevelReportCard';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Calendar,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';

interface ReportWorkspaceProps {
  programme: Programme;
  initialLearnerId?: string;
}

export const ReportWorkspace: React.FC<ReportWorkspaceProps> = ({
  programme,
  initialLearnerId,
}) => {
  const {
    schoolProfile,
    classes,
    learners,
    terms,
    currentUser,
    setTermPublicationStatus,
  } = useApp();

  const isA = programme === 'A_LEVEL';
  const isAdmin = currentUser.role === 'admin';
  const activeTerm = terms.find((t) => t.id === schoolProfile.activeTermId) || terms[0];

  // Classes for this programme
  const progClasses = useMemo(
    () => classes.filter((c) => c.programme === programme),
    [classes, programme]
  );

  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (initialLearnerId) {
      const match = learners.find((l) => l.id === initialLearnerId);
      if (match) return match.classId;
    }
    return progClasses[progClasses.length - 1]?.id || progClasses[0]?.id || '';
  });

  const currentClass = useMemo(
    () => progClasses.find((c) => c.id === selectedClassId),
    [progClasses, selectedClassId]
  );

  const [selectedStream, setSelectedStream] = useState<string>(
    currentClass?.streams[0] || 'ALL'
  );

  // Eligible learners for this class and stream
  const eligibleLearners = useMemo(() => {
    return learners.filter(
      (l) =>
        l.programme === programme &&
        l.classId === selectedClassId &&
        (selectedStream === 'ALL' || l.stream === selectedStream) &&
        l.enrolmentStatus === 'Active'
    );
  }, [learners, programme, selectedClassId, selectedStream]);

  const [selectedLearnerId, setSelectedLearnerId] = useState<string>(() => {
    if (initialLearnerId && learners.some((l) => l.id === initialLearnerId && l.programme === programme)) {
      return initialLearnerId;
    }
    return eligibleLearners[0]?.id || '';
  });

  // Ensure selectedLearnerId is valid when filters change
  React.useEffect(() => {
    if (eligibleLearners.length > 0 && !eligibleLearners.some((l) => l.id === selectedLearnerId)) {
      setSelectedLearnerId(eligibleLearners[0].id);
    }
  }, [eligibleLearners, selectedLearnerId]);

  const currentLearner = useMemo(
    () => eligibleLearners.find((l) => l.id === selectedLearnerId) || eligibleLearners[0],
    [eligibleLearners, selectedLearnerId]
  );

  const currentIndex = eligibleLearners.findIndex((l) => l.id === currentLearner?.id);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedLearnerId(eligibleLearners[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < eligibleLearners.length - 1) {
      setSelectedLearnerId(eligibleLearners[currentIndex + 1].id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const togglePublication = () => {
    if (!isAdmin) return;
    const nextStatus = activeTerm.publicationStatus === 'published' ? 'draft' : 'published';
    setTermPublicationStatus(activeTerm.id, nextStatus);
  };

  return (
    <div className="space-y-6">
      {/* Control Toolbar (Hidden in Print) */}
      <div className="no-print space-y-4">
        {/* Header & Print Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isA
                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {isA ? 'A Level Reports (UACE)' : 'O Level Reports (UCE)'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {activeTerm.name}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Official Report Card Generation &amp; Viewer
            </h2>
            <p className="text-xs text-slate-500">
              Preview, inspect, publish, and print authentic school report cards
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isAdmin && (
              <button
                type="button"
                onClick={togglePublication}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  activeTerm.publicationStatus === 'published'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
              >
                {activeTerm.publicationStatus === 'published' ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Published to Parents</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Term is Draft (Click to Publish)</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print This Report</span>
            </button>
          </div>
        </div>

        {/* Filter & Candidate Selection Strip */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800"
            >
              {progClasses.map((c) => (
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
              Candidate Selector ({eligibleLearners.length} Registered)
            </label>
            <div className="flex items-center gap-2">
              <select
                value={currentLearner?.id || ''}
                onChange={(e) => setSelectedLearnerId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900"
              >
                {eligibleLearners.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName} &mdash; {l.lin} ({l.stream})
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={currentIndex <= 0}
                onClick={handlePrev}
                className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition"
                title="Previous Learner"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentIndex >= eligibleLearners.length - 1}
                onClick={handleNext}
                className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition"
                title="Next Learner"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Card Paper View */}
      {currentLearner ? (
        <div className="py-2">
          {isA ? (
            <ALevelReportCard learner={currentLearner} termId={activeTerm.id} />
          ) : (
            <OLevelReportCard learner={currentLearner} termId={activeTerm.id} />
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-700">No Learners Available</h3>
          <p className="text-xs text-slate-400 mt-1">
            There are no active learners enrolled in {currentClass?.name || 'this class'} ({selectedStream}).
          </p>
        </div>
      )}
    </div>
  );
};
