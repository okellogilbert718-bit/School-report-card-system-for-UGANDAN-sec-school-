/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { LearnerList } from './components/learners/LearnerList';
import { OLevelMarksEntry } from './components/marks/OLevelMarksEntry';
import { ALevelMarksEntry } from './components/marks/ALevelMarksEntry';
import { ReportWorkspace } from './components/reports/ReportWorkspace';
import { BatchReportPrinting } from './components/reports/BatchReportPrinting';
import { ClassMarksheet } from './components/reports/ClassMarksheet';
import { OLevelReportCard } from './components/reports/OLevelReportCard';
import { ALevelReportCard } from './components/reports/ALevelReportCard';
import { SchoolSettings } from './components/settings/SchoolSettings';
import { AcademicStructureSettings } from './components/settings/AcademicStructureSettings';
import { TeacherSubjectAssignment } from './components/settings/TeacherSubjectAssignment';
import { StudentSubjectAllocation } from './components/settings/StudentSubjectAllocation';
import { OLevelAssessmentPlanning } from './components/settings/OLevelAssessmentPlanning';
import { ALevelAssessmentPlanning } from './components/settings/ALevelAssessmentPlanning';
import { UserAccountsSettings } from './components/settings/UserAccountsSettings';
import { Programme } from './types';
import { ShieldAlert, ArrowLeft, FileCheck } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, learners, terms, schoolProfile } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLearnerForReport, setSelectedLearnerForReport] = useState<string | null>(null);

  // Sync document title dynamically with school name in settings
  React.useEffect(() => {
    if (schoolProfile?.name) {
      document.title = `${schoolProfile.name} - Academic Management System`;
    }
  }, [schoolProfile?.name]);

  const activeTerm = terms.find((t) => t.id === schoolProfile.activeTermId) || terms[0];
  const isParentOrLearner = currentUser.role === 'learner_parent';
  const isTeacher = currentUser.role === 'teacher';
  const isAdmin = currentUser.role === 'admin';

  // Role security guard: Learner/Parent can only view dashboard and their own published report
  const isProtectedAdminPage = activeTab.startsWith('settings-') || activeTab === 'reports-batch';
  const isStaffOnlyPage = activeTab === 'learners' || activeTab.startsWith('marks-');

  const handleViewReportFromList = (learnerId: string, prog: Programme) => {
    setSelectedLearnerForReport(learnerId);
    setActiveTab(prog === 'O_LEVEL' ? 'reports-o-level' : 'reports-a-level');
  };

  // Find linked learner for parent/learner role
  const linkedLearner = isParentOrLearner
    ? learners.find((l) => l.id === currentUser.learnerId) || learners[0]
    : null;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Security Guard Check for Parents/Learners */}
          {isParentOrLearner && (isProtectedAdminPage || isStaffOnlyPage) ? (
            <div className="p-8 max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4 my-8">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Staff Page Protected
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                As a registered learner/parent account, you only have authorization to view your linked student&apos;s verified published report card. Staff administration and mark entry pages are protected.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Student Dashboard</span>
              </button>
            </div>
          ) : isTeacher && isProtectedAdminPage ? (
            <div className="p-8 max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4 my-8">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Administrator Privileges Required
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                System configuration, terms publication, and user accounts management are restricted to school administrators and the Director of Studies.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          ) : (
            <>
              {/* Dashboard */}
              {activeTab === 'dashboard' && (
                <Dashboard
                  setActiveTab={setActiveTab}
                  setSelectedLearnerId={setSelectedLearnerForReport}
                />
              )}

              {/* Learners Register */}
              {activeTab === 'learners' && (
                <LearnerList
                  onViewReport={handleViewReportFromList}
                  onAllocateSubjects={() => setActiveTab('settings-student-allocation')}
                />
              )}

              {/* O Level Marks Entry */}
              {activeTab === 'marks-o-level' && <OLevelMarksEntry />}

              {/* A Level Marks Entry */}
              {activeTab === 'marks-a-level' && <ALevelMarksEntry />}

              {/* O Level Reports */}
              {activeTab === 'reports-o-level' && (
                <ReportWorkspace
                  programme="O_LEVEL"
                  initialLearnerId={selectedLearnerForReport || undefined}
                />
              )}

              {/* A Level Reports */}
              {activeTab === 'reports-a-level' && (
                <ReportWorkspace
                  programme="A_LEVEL"
                  initialLearnerId={selectedLearnerForReport || undefined}
                />
              )}

              {/* Class Marksheets */}
              {activeTab === 'marksheets' && <ClassMarksheet />}

              {/* Batch Printing */}
              {activeTab === 'reports-batch' && <BatchReportPrinting />}

              {/* Learner/Parent Dedicated Report View */}
              {activeTab === 'learner-report' && linkedLearner && (
                <div className="space-y-4">
                  <div className="no-print flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {linkedLearner.fullName}&apos;s Official Report Card
                      </h2>
                      <p className="text-xs text-slate-500">
                        {activeTerm.name} &bull;{' '}
                        {linkedLearner.programme === 'O_LEVEL' ? 'O-Level Curriculum' : 'A-Level UACE'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Print Official Report</span>
                    </button>
                  </div>

                  {linkedLearner.programme === 'A_LEVEL' ? (
                    <ALevelReportCard learner={linkedLearner} termId={activeTerm.id} />
                  ) : (
                    <OLevelReportCard learner={linkedLearner} termId={activeTerm.id} />
                  )}
                </div>
              )}

              {/* Settings Submenu Dedicated Pages */}
              {activeTab === 'settings-school' && <SchoolSettings />}

              {activeTab === 'settings-academic' && <AcademicStructureSettings />}

              {activeTab === 'settings-teacher-subjects' && <TeacherSubjectAssignment />}

              {activeTab === 'settings-student-allocation' && <StudentSubjectAllocation />}

              {activeTab === 'settings-o-level-planning' && (
                <OLevelAssessmentPlanning setActiveTab={setActiveTab} />
              )}

              {activeTab === 'settings-a-level-planning' && (
                <ALevelAssessmentPlanning setActiveTab={setActiveTab} />
              )}

              {activeTab === 'settings-users' && <UserAccountsSettings />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
