import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Teacher } from '../../types';
import {
  UserCheck,
  Plus,
  Save,
  CheckSquare,
  Square,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  X,
} from 'lucide-react';

export const TeacherSubjectAssignment: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, subjects, classes } = useApp();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id || ''
  );

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newInitials, setNewInitials] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+256 7');

  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  const handleToggleSubject = (subId: string) => {
    if (!selectedTeacher) return;
    const current = selectedTeacher.assignedSubjectIds || [];
    const next = current.includes(subId)
      ? current.filter((id) => id !== subId)
      : [...current, subId];

    updateTeacher(selectedTeacher.id, { assignedSubjectIds: next });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleToggleClass = (classId: string) => {
    if (!selectedTeacher) return;
    const current = selectedTeacher.assignedClassIds || [];
    const next = current.includes(classId)
      ? current.filter((id) => id !== classId)
      : [...current, classId];

    updateTeacher(selectedTeacher.id, { assignedClassIds: next });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newInitials.trim()) return;

    addTeacher({
      fullName: newFullName.trim(),
      initials: newInitials.trim().toUpperCase(),
      email: newEmail.trim() || `${newInitials.toLowerCase()}@stpetersnsambya.sc.ug`,
      phone: newPhone.trim(),
      assignedSubjectIds: [],
      assignedClassIds: [],
    });

    setShowAddTeacherModal(false);
    setNewFullName('');
    setNewInitials('');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              Settings &bull; Faculty Allocation
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Teacher Subject &amp; Class Assignment
          </h2>
          <p className="text-xs text-slate-500">
            Assign curriculum subjects and classes to teachers to restrict mark entry and submission rights
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddTeacherModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Teacher</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Teacher assignments updated and saved to system!</span>
        </div>
      )}

      {/* Main Grid: Left Faculty List, Right Checkbox Grid Assignment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Teachers List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
            Teaching Faculty ({teachers.length})
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {teachers.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTeacherId(t.id)}
                className={`p-3 cursor-pointer transition flex items-center justify-between ${
                  selectedTeacher?.id === t.id
                    ? 'bg-amber-50/70 border-l-4 border-amber-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {t.fullName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Initials: <strong className="font-mono text-slate-800">{t.initials}</strong> &bull;{' '}
                    {t.assignedSubjectIds?.length || 0} Subjects
                  </div>
                </div>

                {teachers.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove teacher ${t.fullName}?`)) {
                        deleteTeacher(t.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Delete teacher"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Checkbox Grid for Selected Teacher */}
        {selectedTeacher && (
          <div className="md:col-span-2 space-y-5">
            {/* Teacher Info Card */}
            <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Editing Assignment Matrix
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedTeacher.fullName} ({selectedTeacher.initials})
                </h3>
                <p className="text-xs text-slate-300">
                  Email: {selectedTeacher.email} &bull; Tel: {selectedTeacher.phone}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {selectedTeacher.assignedSubjectIds?.length || 0}
                </span>
                <span className="text-[11px] text-slate-300 block">Subjects Assigned</span>
              </div>
            </div>

            {/* Checkbox Grid: Classes Assigned */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-amber-600" />
                <span>Class Forms &amp; Form Tutoring</span>
              </h4>
              <p className="text-xs text-slate-500">
                Classes where this teacher can enter and validate continuous assessments
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {classes.map((cls) => {
                  const isAssigned = (selectedTeacher.assignedClassIds || []).includes(cls.id);
                  return (
                    <div
                      key={cls.id}
                      onClick={() => handleToggleClass(cls.id)}
                      className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer select-none flex items-center gap-2 transition ${
                        isAssigned
                          ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {isAssigned ? (
                        <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>
                        {cls.name} ({cls.code})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checkbox Grid: Subjects Assigned */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Curriculum Subjects Assigned</span>
              </h4>
              <p className="text-xs text-slate-500">
                Check all subjects this teacher is certified and assigned to teach
              </p>

              {/* O Level Grid */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                  O Level Subjects (UCE)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subjects
                    .filter((s) => s.programme === 'O_LEVEL')
                    .map((sub) => {
                      const isAssigned = (selectedTeacher.assignedSubjectIds || []).includes(sub.id);
                      return (
                        <div
                          key={sub.id}
                          onClick={() => handleToggleSubject(sub.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer select-none flex items-center gap-2 transition ${
                            isAssigned
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {isAssigned ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="font-mono text-[11px] text-slate-500 font-bold mr-1.5">
                              {sub.code}
                            </span>
                            <span>{sub.name}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* A Level Grid */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md inline-block">
                  A Level Subjects (UACE)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subjects
                    .filter((s) => s.programme === 'A_LEVEL')
                    .map((sub) => {
                      const isAssigned = (selectedTeacher.assignedSubjectIds || []).includes(sub.id);
                      return (
                        <div
                          key={sub.id}
                          onClick={() => handleToggleSubject(sub.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer select-none flex items-center gap-2 transition ${
                            isAssigned
                              ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {isAssigned ? (
                            <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="font-mono text-[11px] text-slate-500 font-bold mr-1.5">
                              {sub.code}
                            </span>
                            <span>{sub.name}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE TEACHER MODAL */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Register New Teacher</h3>
              <button
                type="button"
                onClick={() => setShowAddTeacherModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name &amp; Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Okot David"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initials (for report cards)
                </label>
                <input
                  type="text"
                  placeholder="e.g. OD"
                  maxLength={4}
                  value={newInitials}
                  onChange={(e) => setNewInitials(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="teacher@stpetersnsambya.sc.ug"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Register Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
