import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Learner, Programme } from '../../types';
import { X, Upload, Trash2, User, AlertCircle } from 'lucide-react';

interface LearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  learnerToEdit?: Learner | null;
}

export const LearnerModal: React.FC<LearnerModalProps> = ({
  isOpen,
  onClose,
  learnerToEdit,
}) => {
  const { classes, subjects, addLearner, updateLearner, deleteLearner } = useApp();

  const [fullName, setFullName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [lin, setLin] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('2008-01-01');
  const [programme, setProgramme] = useState<Programme>('O_LEVEL');
  const [classId, setClassId] = useState('');
  const [stream, setStream] = useState('');
  const [section, setSection] = useState('Muteesa House');
  const [enrolmentStatus, setEnrolmentStatus] = useState<Learner['enrolmentStatus']>('Active');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [aLevelCombination, setALevelCombination] = useState('');
  const [daysPresent, setDaysPresent] = useState(75);
  const [totalDays, setTotalDays] = useState(78);
  const [conduct, setConduct] = useState('Exemplary and courteous');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  // Filter classes by selected programme
  const filteredClasses = classes.filter((c) => c.programme === programme);
  const currentClass = classes.find((c) => c.id === classId);

  useEffect(() => {
    if (learnerToEdit) {
      setFullName(learnerToEdit.fullName);
      setAdmissionNo(learnerToEdit.admissionNo);
      setLin(learnerToEdit.lin);
      setGender(learnerToEdit.gender);
      setDob(learnerToEdit.dob);
      setProgramme(learnerToEdit.programme);
      setClassId(learnerToEdit.classId);
      setStream(learnerToEdit.stream);
      setSection(learnerToEdit.section || 'Muteesa House');
      setEnrolmentStatus(learnerToEdit.enrolmentStatus);
      setParentName(learnerToEdit.parentName || '');
      setParentPhone(learnerToEdit.parentPhone || '');
      setParentEmail(learnerToEdit.parentEmail || '');
      setPhotoUrl(learnerToEdit.photoUrl || '');
      setALevelCombination(learnerToEdit.aLevelCombination || '');
      setDaysPresent(learnerToEdit.daysPresent || 75);
      setTotalDays(learnerToEdit.totalDays || 78);
      setConduct(learnerToEdit.conduct || 'Exemplary and courteous');
    } else {
      // New learner defaults
      setFullName('');
      setAdmissionNo(`STP/2026/${Math.floor(100 + Math.random() * 900)}`);
      setLin(`LIN-${Math.floor(100000 + Math.random() * 900000)}`);
      setGender('Male');
      setDob('2008-01-01');
      setProgramme('O_LEVEL');
      const firstClass = classes.find((c) => c.programme === 'O_LEVEL') || classes[0];
      setClassId(firstClass ? firstClass.id : '');
      setStream(firstClass?.streams[0] || 'Blue');
      setSection('Muteesa House');
      setEnrolmentStatus('Active');
      setParentName('');
      setParentPhone('+256 7');
      setParentEmail('');
      setPhotoUrl('');
      setALevelCombination('PCM/ICT');
      setDaysPresent(75);
      setTotalDays(78);
      setConduct('Exemplary and courteous');
    }
    setShowDeleteConfirm(false);
    setError('');
  }, [learnerToEdit, isOpen, classes]);

  // Adjust class selection when programme changes
  const handleProgrammeChange = (newProg: Programme) => {
    setProgramme(newProg);
    const validClass = classes.find((c) => c.programme === newProg);
    if (validClass) {
      setClassId(validClass.id);
      setStream(validClass.streams[0] || 'Blue');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Learner full name is required.');
      return;
    }
    if (!classId) {
      setError('Please select an academic class.');
      return;
    }

    // Default subject allocation: all compulsory subjects of the programme
    let allocatedSubjectIds: string[] = learnerToEdit ? learnerToEdit.allocatedSubjectIds : [];
    if (allocatedSubjectIds.length === 0) {
      allocatedSubjectIds = subjects
        .filter((s) => s.programme === programme && s.isCompulsory)
        .map((s) => s.id);
    }

    const payload = {
      fullName: fullName.trim(),
      admissionNo: admissionNo.trim(),
      lin: lin.trim(),
      gender,
      dob,
      programme,
      classId,
      stream: stream || (currentClass?.streams[0] || 'Blue'),
      section: section.trim() || 'Muteesa House',
      enrolmentStatus,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail.trim(),
      photoUrl,
      aLevelCombination: programme === 'A_LEVEL' ? aLevelCombination.trim() : undefined,
      allocatedSubjectIds,
      daysPresent: Number(daysPresent) || 0,
      totalDays: Number(totalDays) || 78,
      conduct: conduct.trim() || 'Well-behaved',
    };

    if (learnerToEdit) {
      updateLearner(learnerToEdit.id, payload);
    } else {
      addLearner(payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (learnerToEdit) {
      deleteLearner(learnerToEdit.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold">
              {learnerToEdit ? `Edit Learner: ${learnerToEdit.fullName}` : 'Register New Learner'}
            </h3>
            <p className="text-xs text-slate-300">
              National UNEB LIN &amp; Ugandan Secondary School Record
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo & Basic Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="relative group shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Learner"
                  className="w-24 h-24 rounded-full object-cover border-2 border-amber-500 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-200 text-slate-600 flex flex-col items-center justify-center font-bold text-xs border-2 border-dashed border-slate-400">
                  <User className="w-8 h-8 text-slate-400 mb-1" />
                  <span>Initials</span>
                </div>
              )}
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 text-xs"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Learner Photo (Optional - for Official Report Card)
              </label>
              <p className="text-[11px] text-slate-500 mb-2.5">
                PNG or JPEG passport photo (up to 2MB). If blank, student initials are used.
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-xs transition">
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                <span>Browse Photo...</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Primary Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Okello Gilbert"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Learner Identification No (LIN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={lin}
                onChange={(e) => setLin(e.target.value)}
                placeholder="e.g. LIN-042891"
                required
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admission No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                placeholder="e.g. STP/2023/042"
                required
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Academic Placement */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-4">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              Academic Placement &amp; Enrolment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Programme <span className="text-rose-500">*</span>
                </label>
                <select
                  value={programme}
                  onChange={(e) => handleProgrammeChange(e.target.value as Programme)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="O_LEVEL">O Level (S.1 - S.4)</option>
                  <option value="A_LEVEL">A Level (S.5 - S.6)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class <span className="text-rose-500">*</span>
                </label>
                <select
                  value={classId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setClassId(cid);
                    const sel = classes.find((c) => c.id === cid);
                    if (sel && sel.streams.length > 0) {
                      setStream(sel.streams[0]);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  {filteredClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stream <span className="text-rose-500">*</span>
                </label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  {currentClass?.streams.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )) || <option value="Default">Default</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section / House
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. Muteesa House"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enrolment Status
                </label>
                <select
                  value={enrolmentStatus}
                  onChange={(e) =>
                    setEnrolmentStatus(e.target.value as Learner['enrolmentStatus'])
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              {programme === 'A_LEVEL' && (
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    A-Level Subject Combination
                  </label>
                  <input
                    type="text"
                    value={aLevelCombination}
                    onChange={(e) => setALevelCombination(e.target.value)}
                    placeholder="e.g. PCM/ICT or BCM/Sub-Math or HEG/Div"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Parent & Attendance Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent / Guardian Name
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. M/s Mary Okello"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent Contact Phone
              </label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+256 7..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent Email
              </label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Days Present in Term
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={daysPresent}
                onChange={(e) => setDaysPresent(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total School Days in Term
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Conduct &amp; Discipline Remark
              </label>
              <input
                type="text"
                value={conduct}
                onChange={(e) => setConduct(e.target.value)}
                placeholder="e.g. Exemplary, Highly Respectful"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Delete Action (if editing existing learner) */}
          {learnerToEdit && (
            <div className="pt-4 border-t border-slate-200">
              {showDeleteConfirm ? (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-900">
                    Are you sure? This learner and their term marks will be permanently removed.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition"
                    >
                      Yes, Delete Learner
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete this learner record</span>
                </button>
              )}
            </div>
          )}

          {/* Footer controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
            >
              {learnerToEdit ? 'Save Learner Changes' : 'Register Learner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
