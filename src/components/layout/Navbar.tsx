import React from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolLogo } from '../common/SchoolLogo';
import {
  Shield,
  GraduationCap,
  Users,
  ChevronDown,
  Menu,
  X,
  FileCheck,
  Calendar,
} from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
}) => {
  const { schoolProfile, currentUser, users, switchUser, terms } = useApp();

  const currentTerm = terms.find((t) => t.id === schoolProfile.activeTermId) || terms[0];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <Shield className="w-3 h-3" /> Administrator
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <GraduationCap className="w-3 h-3" /> Teacher
          </span>
        );
      case 'learner_parent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Users className="w-3 h-3" /> Learner / Parent
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs no-print">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & School Branding */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <SchoolLogo url={schoolProfile.logoUrl} name={schoolProfile.name} size="sm" />
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-xs md:max-w-md lg:max-w-xl">
                {schoolProfile.name}
              </h1>
              <p className="text-xs text-slate-500 italic truncate max-w-xs md:max-w-md">
                &ldquo;{schoolProfile.motto}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right: Term Info & User Role Switcher */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Term Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-medium">{currentTerm?.name || 'Term 2 2026'}</span>
            <span className="text-slate-300">|</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                currentTerm?.publicationStatus === 'published'
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              <FileCheck className="w-3 h-3" />
              {currentTerm?.publicationStatus === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>

          {/* Quick User Switcher */}
          <div className="relative group">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition">
              <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold uppercase">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[140px]">
                  {currentUser.name}
                </div>
                <div className="mt-0.5">{getRoleBadge(currentUser.role)}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>

            {/* Switch User Dropdown */}
            <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 hidden group-hover:block hover:block z-50">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  Switch Active Role (Testing)
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      switchUser(u.id);
                      if (u.role === 'learner_parent') {
                        setActiveTab('dashboard');
                      }
                    }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-slate-50 transition text-xs ${
                      u.id === currentUser.id ? 'bg-amber-50/70 font-semibold' : ''
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {u.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-slate-900 truncate">{u.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{u.title || u.email}</div>
                      <div className="mt-0.5">{getRoleBadge(u.role)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
