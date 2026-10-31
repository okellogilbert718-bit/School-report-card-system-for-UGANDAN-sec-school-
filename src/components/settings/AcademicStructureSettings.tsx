import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AcademicClass, AcademicTerm, Subject, Programme } from '../../types';
import {
  Calendar,
  Layers,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Edit2,
  Save,
  X,
} from 'lucide-react';

export const AcademicStructureSettings: React.FC = () => {
  const {
    classes,
    addClass,
    updateClass,
    deleteClass,
    terms,
    addTerm,
    updateTerm,
    setCurrentTerm,
    setTermPublicationStatus,
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
  } = useApp();

  // Term creation form state
  const [showTermModal, setShowTermModal] = useState(false);
  const [newTermName, setNewTermName] = useState('Term 1 2027');
  const [newTermYear, setNewTermYear] = useState('2027');
  const [newTermNum, setNewTermNum] = useState<1 | 2 | 3>(1);
  const [newTermStart, setNewTermStart] = useState('2027-02-01');
  const [newTermEnd, setNewTermEnd] = useState('2027-05-02');

  // Class creation form state
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassProg, setNewClassProg] = useState<Programme>('O_LEVEL');
  const [newClassStreams, setNewClassStreams] = useState('Blue, Green, Red');

  // Subject creation form state
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubProg, setNewSubProg] = useState<Programme>('O_LEVEL');
  const [newSubCat, setNewSubCat] = useState<Subject['category']>('sciences');
  const [newSubCompulsory, setNewSubCompulsory] = useState(true);

  const [activeTab, setActiveTab] = useState<'terms' | 'classes' | 'subjects'>('terms');

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    addTerm({
      name: newTermName.trim(),
      year: newTermYear.trim(),
      termNumber: newTermNum,
      startDate: newTermStart,
      endDate: newTermEnd,
      publicationStatus: 'draft',
      isCurrent: false,
    });
    setShowTermModal(false);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassCode.trim()) return;
    const streamsList = newClassStreams
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    addClass({
      name: newClassName.trim(),
      code: newClassCode.trim(),
      programme: newClassProg,
      streams: streamsList.length > 0 ? streamsList : ['Stream 1'],
    });
    setShowClassModal(false);
    setNewClassName('');
    setNewClassCode('');
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim()) return;

    addSubject({
      code: newSubCode.trim(),
      name: newSubName.trim(),
      programme: newSubProg,
      category: newSubCat,
      isCompulsory: newSubCompulsory,
    });
    setShowSubjectModal(false);
    setNewSubCode('');
    setNewSubName('');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
            System Settings &bull; Academic Structure
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-1">
          Academic Terms, Classes &amp; Curriculum Subjects
        </h2>
        <p className="text-xs text-slate-500">
          Manage academic terms and publication status, senior classes and streams, and subject catalogues
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'terms'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Academic Terms &amp; Publication Status</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'classes'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Classes &amp; Streams ({classes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'subjects'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subject Catalogue ({subjects.length})</span>
        </button>
      </div>

      {/* TAB 1: ACADEMIC TERMS & PUBLICATION */}
      {activeTab === 'terms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Terms Management</h3>
              <p className="text-xs text-slate-500">
                Set active current term and toggle parent report card publication status
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTermModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Term</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Term Name</th>
                  <th className="px-3 py-3">Academic Year</th>
                  <th className="px-3 py-3">Duration (Dates)</th>
                  <th className="px-3 py-3">Active Term</th>
                  <th className="px-3 py-3">Publication Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {terms.map((term) => (
                  <tr key={term.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {term.name}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600">
                      {term.year}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {term.startDate} &mdash; {term.endDate}
                    </td>
                    <td className="px-3 py-3">
                      {term.isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Active Current Term
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCurrentTerm(term.id)}
                          className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline"
                        >
                          Set as Current
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setTermPublicationStatus(
                            term.id,
                            term.publicationStatus === 'published' ? 'draft' : 'published'
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition ${
                          term.publicationStatus === 'published'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {term.publicationStatus === 'published' ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Published (Visible to Parents)</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Draft (Staff Only)</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setTermPublicationStatus(
                            term.id,
                            term.publicationStatus === 'published' ? 'draft' : 'published'
                          )
                        }
                        className="text-xs text-slate-600 hover:text-slate-900 underline"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGED CLASSES & STREAMS */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Managed Classes &amp; Streams</h3>
              <p className="text-xs text-slate-500">
                O-Level (S.1 - S.4) and A-Level (S.5 - S.6) senior forms
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowClassModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cls.programme === 'A_LEVEL'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {cls.programme === 'A_LEVEL' ? 'A-Level (UACE)' : 'O-Level (UCE)'}
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900">
                      {cls.code}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">{cls.name}</h4>
                  <div className="mt-2">
                    <span className="text-[11px] font-semibold text-slate-500 block">Streams:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {cls.streams.map((st) => (
                        <span
                          key={st}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-sm text-xs font-medium"
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Class ID: {cls.id}</span>
                  {classes.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete class ${cls.name}?`)) {
                          deleteClass(cls.id);
                        }
                      }}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECT CATALOGUE */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Curriculum Subject Catalogue</h3>
              <p className="text-xs text-slate-500">
                Compulsory and optional subjects, codes, categories, and paper configurations
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSubjectModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Subject</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-3 py-3">Subject Name</th>
                  <th className="px-3 py-3">Programme</th>
                  <th className="px-3 py-3">Classification</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Papers</th>
                  <th className="px-4 py-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {sub.code}
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-900">
                      {sub.name}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.programme === 'A_LEVEL'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {sub.programme === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {sub.isCompulsory ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                          Compulsory
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]">
                          Optional / Elective
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 capitalize text-slate-600">
                      {sub.category}
                    </td>
                    <td className="px-3 py-3 text-slate-500 font-mono text-[11px]">
                      {sub.programme === 'A_LEVEL'
                        ? `${sub.papers?.filter((p) => p.active).length || 2} Papers active`
                        : 'Summative & CA'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove ${sub.name} from subject catalogue?`)) {
                            deleteSubject(sub.id);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 p-1"
                        title="Delete subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE TERM MODAL */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Create Academic Term</h3>
              <button
                type="button"
                onClick={() => setShowTermModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTerm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Term Name
                </label>
                <input
                  type="text"
                  value={newTermName}
                  onChange={(e) => setNewTermName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    value={newTermYear}
                    onChange={(e) => setNewTermYear(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Term Number
                  </label>
                  <select
                    value={newTermNum}
                    onChange={(e) => setNewTermNum(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newTermStart}
                    onChange={(e) => setNewTermStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newTermEnd}
                    onChange={(e) => setNewTermEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Create Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Academic Class</h3>
              <button
                type="button"
                onClick={() => setShowClassModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior 3"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. S.3"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Programme
                  </label>
                  <select
                    value={newClassProg}
                    onChange={(e) => setNewClassProg(e.target.value as Programme)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  >
                    <option value="O_LEVEL">O Level (S.1 - S.4)</option>
                    <option value="A_LEVEL">A Level (S.5 - S.6)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Streams (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blue, Green, Red, Gold"
                  value={newClassStreams}
                  onChange={(e) => setNewClassStreams(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUBJECT MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Curriculum Subject</h3>
              <button
                type="button"
                onClick={() => setShowSubjectModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 553"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Biology"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Programme
                  </label>
                  <select
                    value={newSubProg}
                    onChange={(e) => setNewSubProg(e.target.value as Programme)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  >
                    <option value="O_LEVEL">O Level</option>
                    <option value="A_LEVEL">A Level</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newSubCat}
                    onChange={(e) => setNewSubCat(e.target.value as Subject['category'])}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  >
                    <option value="sciences">Sciences</option>
                    <option value="arts">Arts / Humanities</option>
                    <option value="languages">Languages</option>
                    <option value="vocational">Vocational / ICT</option>
                    <option value="subsidiary">Subsidiary</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="subCompulsory"
                  checked={newSubCompulsory}
                  onChange={(e) => setNewSubCompulsory(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-300 text-amber-600"
                />
                <label htmlFor="subCompulsory" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Compulsory Subject for this Programme
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
