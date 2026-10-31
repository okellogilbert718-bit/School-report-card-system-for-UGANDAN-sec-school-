import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAccount, UserRole } from '../../types';
import {
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  GraduationCap,
  Shield,
  X,
  Lock,
} from 'lucide-react';

export const UserAccountsSettings: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, teachers, learners, currentUser } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [teacherId, setTeacherId] = useState('');
  const [learnerId, setLearnerId] = useState('');
  const [title, setTitle] = useState('');

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addUser({
      name: name.trim(),
      email: email.trim(),
      role,
      teacherId: role === 'teacher' ? teacherId : undefined,
      learnerId: role === 'learner_parent' ? learnerId : undefined,
      title: title.trim() || (role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Teacher' : 'Parent / Learner'),
    });

    setShowModal(false);
    setName('');
    setEmail('');
    setTitle('');
    setSaveSuccess('User account created and role permissions configured!');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Shield className="w-3 h-3" /> Administrator
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <GraduationCap className="w-3 h-3" /> Teacher
          </span>
        );
      case 'learner_parent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Users className="w-3 h-3" /> Learner / Parent
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
              Settings &bull; Security &amp; Access Controls
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            User Accounts, Roles &amp; Security Permissions
          </h2>
          <p className="text-xs text-slate-500">
            Enforce role-based access for Administrators, Teachers, and Learners/Parents
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add User Account</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Permissions Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
            <Shield className="w-4 h-4 text-rose-700" />
            <span>Administrator Rights</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Full rights: School profile setup, academic terms, class setup, teacher &amp; learner creation, mark validation, term publishing, and batch printing.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
            <GraduationCap className="w-4 h-4 text-sky-700" />
            <span>Teacher Rights</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Restricted to assigned subjects and classes: Enter, save, and submit continuous assessments and paper scores for validation.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>Learner / Parent Rights</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Protected view: Can only view and print their own linked learner&apos;s verified published report card. Staff admin pages are strictly protected.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-3 py-3">Email Address</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Linked Profile</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const linkedTeacher = teachers.find((t) => t.id === u.teacherId);
              const linkedLearner = learners.find((l) => l.id === u.learnerId);

              return (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 leading-tight">
                      {u.name}
                      {u.id === currentUser.id && (
                        <span className="ml-2 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-xs">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">{u.title}</div>
                  </td>

                  <td className="px-3 py-3 font-mono text-slate-600">
                    {u.email}
                  </td>

                  <td className="px-3 py-3">
                    {getRoleBadge(u.role)}
                  </td>

                  <td className="px-3 py-3 text-slate-600">
                    {u.role === 'teacher' && linkedTeacher && (
                      <span className="font-semibold text-sky-900">
                        Teacher: {linkedTeacher.fullName} ({linkedTeacher.initials})
                      </span>
                    )}
                    {u.role === 'learner_parent' && linkedLearner && (
                      <span className="font-semibold text-emerald-900">
                        Learner: {linkedLearner.fullName} ({linkedLearner.lin})
                      </span>
                    )}
                    {u.role === 'admin' && (
                      <span className="text-slate-400">Head Administrator</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {users.length > 1 && u.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove user account ${u.name}?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 p-1"
                        title="Delete account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ADD USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add User Account</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Kato Godfrey"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="user@stpetersnsambya.sc.ug"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="teacher">Teacher (Subject &amp; Mark Entry)</option>
                  <option value="learner_parent">Learner / Parent (Published Report Only)</option>
                </select>
              </div>

              {role === 'teacher' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link to Teacher Record
                  </label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Select Teacher Profile...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.initials})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'learner_parent' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link to Learner Record
                  </label>
                  <select
                    value={learnerId}
                    onChange={(e) => setLearnerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Select Learner...</option>
                    {learners.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.fullName} &mdash; {l.lin}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Master"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
