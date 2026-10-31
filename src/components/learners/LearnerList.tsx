import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Learner, Programme } from '../../types';
import { LearnerModal } from './LearnerModal';
import { BatchLearnerImportModal } from './BatchLearnerImportModal';
import {
  Search,
  Plus,
  Upload,
  Filter,
  FileText,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface LearnerListProps {
  onViewReport: (learnerId: string, programme: Programme) => void;
  onAllocateSubjects?: (learnerId: string) => void;
}

export const LearnerList: React.FC<LearnerListProps> = ({
  onViewReport,
  onAllocateSubjects,
}) => {
  const { learners, classes, deleteLearner } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStream, setSelectedStream] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLearner, setEditingLearner] = useState<Learner | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  // Filtered classes based on selected programme
  const availableClasses = useMemo(() => {
    if (selectedProgramme === 'ALL') return classes;
    return classes.filter((c) => c.programme === selectedProgramme);
  }, [classes, selectedProgramme]);

  // Available streams based on selected class
  const availableStreams = useMemo(() => {
    if (selectedClassId === 'ALL') {
      const allStreams = new Set<string>();
      availableClasses.forEach((c) => c.streams.forEach((s) => allStreams.add(s)));
      return Array.from(allStreams);
    }
    const matched = classes.find((c) => c.id === selectedClassId);
    return matched ? matched.streams : [];
  }, [selectedClassId, availableClasses, classes]);

  // Filter learners
  const filteredLearners = useMemo(() => {
    return learners.filter((learner) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        learner.fullName.toLowerCase().includes(q) ||
        learner.lin.toLowerCase().includes(q) ||
        learner.admissionNo.toLowerCase().includes(q) ||
        (learner.section && learner.section.toLowerCase().includes(q));

      // Programme
      const matchProg =
        selectedProgramme === 'ALL' || learner.programme === selectedProgramme;

      // Class
      const matchClass =
        selectedClassId === 'ALL' || learner.classId === selectedClassId;

      // Stream
      const matchStream =
        selectedStream === 'ALL' || learner.stream === selectedStream;

      // Status
      const matchStatus =
        selectedStatus === 'ALL' || learner.enrolmentStatus === selectedStatus;

      return matchSearch && matchProg && matchClass && matchStream && matchStatus;
    });
  }, [learners, searchQuery, selectedProgramme, selectedClassId, selectedStream, selectedStatus]);

  const handleEdit = (learner: Learner) => {
    setEditingLearner(learner);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingLearner(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Learners Register</h2>
          <p className="text-xs text-slate-500">
            Search, register, and manage Ugandan secondary learners across O-Level and A-Level
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setBatchModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Upload className="w-3.5 h-3.5 text-amber-600" />
            <span>Batch CSV Import</span>
          </button>
          <button
            type="button"
            onClick={handleAddNew}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register Learner</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, LIN, admission no, house..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Programme Filter */}
          <div>
            <select
              value={selectedProgramme}
              onChange={(e) => {
                setSelectedProgramme(e.target.value);
                setSelectedClassId('ALL');
                setSelectedStream('ALL');
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-700"
            >
              <option value="ALL">All Programmes</option>
              <option value="O_LEVEL">O Level (S.1 - S.4)</option>
              <option value="A_LEVEL">A Level (S.5 - S.6)</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStream('ALL');
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-700"
            >
              <option value="ALL">All Classes</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Stream Filter */}
          <div>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-700"
            >
              <option value="ALL">All Streams</option>
              {availableStreams.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second row status & count */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span>Enrolment State:</span>
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
              {['ALL', 'Active', 'Inactive', 'Transferred'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    selectedStatus === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="font-semibold text-slate-700">
            Showing {filteredLearners.length} of {learners.length} registered learners
          </div>
        </div>
      </div>

      {/* Learners Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Learner</th>
                <th className="px-3 py-3">LIN &amp; Admission</th>
                <th className="px-3 py-3">Programme</th>
                <th className="px-3 py-3">Class &amp; Stream</th>
                <th className="px-3 py-3">House / Section</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Subjects</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-slate-600">No learners found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Adjust your search criteria or register a new learner.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner) => {
                  const learnerClass = classes.find((c) => c.id === learner.classId);
                  const isA = learner.programme === 'A_LEVEL';

                  return (
                    <tr key={learner.id} className="hover:bg-slate-50/80 transition">
                      {/* Photo & Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {learner.photoUrl ? (
                            <img
                              src={learner.photoUrl}
                              alt={learner.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-amber-400 shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase border border-slate-300 shrink-0">
                              {learner.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 hover:text-amber-600 transition block truncate">
                              {learner.fullName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {learner.gender} &bull; Parent: {learner.parentName || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* LIN & Admission */}
                      <td className="px-3 py-3">
                        <div className="font-mono font-semibold text-slate-800">
                          {learner.lin}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {learner.admissionNo}
                        </div>
                      </td>

                      {/* Programme Badge */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isA
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isA ? 'A Level (UACE)' : 'O Level (UCE)'}
                        </span>
                        {isA && learner.aLevelCombination && (
                          <div className="text-[10px] font-bold text-slate-600 mt-0.5">
                            {learner.aLevelCombination}
                          </div>
                        )}
                      </td>

                      {/* Class & Stream */}
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-900">
                          {learnerClass?.code || 'S.4'}
                        </span>
                        <span className="text-slate-500 ml-1">({learner.stream})</span>
                      </td>

                      {/* Section */}
                      <td className="px-3 py-3 text-slate-600">
                        {learner.section || 'General'}
                      </td>

                      {/* Enrolment Status */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            learner.enrolmentStatus === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : learner.enrolmentStatus === 'Transferred'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {learner.enrolmentStatus}
                        </span>
                      </td>

                      {/* Subjects Count */}
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {learner.allocatedSubjectIds?.length || 0} Subs
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewReport(learner.id, learner.programme)}
                            className="p-1.5 rounded-md text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition"
                            title="View Official Report Card"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(learner)}
                            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Edit Learner Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <LearnerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        learnerToEdit={editingLearner}
      />

      {/* Batch Import Modal */}
      <BatchLearnerImportModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
      />
    </div>
  );
};
