import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolLogo } from '../common/SchoolLogo';
import {
  LayoutDashboard,
  Users,
  PenTool,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Award,
  Calendar,
  Layers,
  UserCheck,
  CheckSquare,
  Sliders,
  ShieldCheck,
  Printer,
  FileText,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const { schoolProfile, currentUser } = useApp();
  const [reportsOpen, setReportsOpen] = useState(
    activeTab.startsWith('reports-') || activeTab === 'marksheets'
  );
  const [settingsOpen, setSettingsOpen] = useState(
    activeTab.startsWith('settings-')
  );

  React.useEffect(() => {
    if (activeTab.startsWith('settings-')) {
      setSettingsOpen(true);
    }
    if (activeTab.startsWith('reports-') || activeTab === 'marksheets') {
      setReportsOpen(true);
    }
  }, [activeTab]);

  const isParentOrLearner = currentUser.role === 'learner_parent';
  const isAdmin = currentUser.role === 'admin';
  const isTeacher = currentUser.role === 'teacher';

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar container - scrollable on shorter screens */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 shrink-0">
          <SchoolLogo url={schoolProfile.logoUrl} name={schoolProfile.name} size="md" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white truncate leading-tight">
              {schoolProfile.name}
            </h2>
            <p className="text-[11px] text-amber-400 font-medium tracking-wide truncate">
              {schoolProfile.motto || 'Academic Management Portal'}
            </p>
          </div>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </button>

          {/* If Learner / Parent: show restricted clean options */}
          {isParentOrLearner ? (
            <div className="pt-2">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Academic Records
              </div>
              <button
                type="button"
                onClick={() => handleNavClick('learner-report')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'learner-report'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>My Published Report Card</span>
              </button>
            </div>
          ) : (
            /* Staff Options (Admin & Teachers) */
            <>
              {/* Learners Register */}
              <button
                type="button"
                onClick={() => handleNavClick('learners')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'learners'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Learners Register</span>
              </button>

              {/* Split Marks Entry Navigation: O Level & A Level Links */}
              <div className="pt-2 pb-1">
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center justify-between">
                  <span>Marks Entry</span>
                  <PenTool className="w-3 h-3 text-amber-400/70" />
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNavClick('marks-o-level')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === 'marks-o-level'
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>O Level Marks</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick('marks-a-level')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === 'marks-a-level'
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Award className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>A Level Marks</span>
                  </button>
                </div>
              </div>

              {/* Reports Dropdown with separate O Level, A Level, and Batch Printing */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setReportsOpen(!reportsOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab.startsWith('reports-')
                      ? 'bg-slate-800 text-amber-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-4 h-4 shrink-0" />
                    <span>Reports &amp; Broadsheets</span>
                  </div>
                  {reportsOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {reportsOpen && (
                  <div className="pl-6 pr-1 py-1 space-y-1 mt-1 border-l-2 border-slate-700 ml-4">
                    <button
                      type="button"
                      onClick={() => handleNavClick('reports-o-level')}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                        activeTab === 'reports-o-level'
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>O Level Reports</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('reports-a-level')}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                        activeTab === 'reports-a-level'
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>A Level Reports</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('marksheets')}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                        activeTab === 'marksheets'
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Class Marksheets</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('reports-batch')}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                        activeTab === 'reports-batch'
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Batch Printing</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Settings Dropdown with dedicated pages */}
              {isAdmin && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab.startsWith('settings-')
                        ? 'bg-slate-800 text-amber-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 shrink-0" />
                      <span>Settings &amp; Config</span>
                    </div>
                    {settingsOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {settingsOpen && (
                    <div className="pl-6 pr-1 py-1 space-y-1 mt-1 border-l-2 border-slate-700 ml-4">
                      <button
                        type="button"
                        onClick={() => handleNavClick('settings-school')}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                          activeTab === 'settings-school'
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5 text-amber-300" />
                        <span>School Settings</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick('settings-academic')}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                          activeTab === 'settings-academic'
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-sky-300" />
                        <span>Academic Structure &amp; Terms</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick('settings-teacher-subjects')}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                          activeTab === 'settings-teacher-subjects'
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Teacher Subject Assignment</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick('settings-student-allocation')}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                          activeTab === 'settings-student-allocation'
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-teal-300" />
                        <span>Student Subject Allocation</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick('settings-o-level-planning')}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                          activeTab === 'settings-o-level-planning'
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-300" />
                        <span>O Level Assessment Planning</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick('settings-a-level-planning')}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                          activeTab === 'settings-a-level-planning'
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-rose-300" />
                        <span>A Level Assessment Planning</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick('settings-users')}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                          activeTab === 'settings-users'
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                        <span>User Accounts &amp; Roles</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">UNEB / UACE Standard</span>
            <span className="px-1.5 py-0.5 rounded-xs bg-slate-800 text-amber-300 text-[10px]">
              v2.6
            </span>
          </div>
          <p className="mt-1 text-slate-500 text-[10px]">
            New Lower Secondary &amp; Principal A-Level
          </p>
        </div>
      </aside>
    </>
  );
};
