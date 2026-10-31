import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserAccount,
  SchoolProfile,
  AcademicClass,
  AcademicTerm,
  Subject,
  Teacher,
  Learner,
  OLevelMark,
  ALevelMark,
  GradeBoundary,
  HeadTeacherCommentRule,
  AssessmentSet,
  SubjectPaperConfig,
} from '../types';
import {
  DEFAULT_USERS,
  DEFAULT_SCHOOL_PROFILE,
  DEFAULT_CLASSES,
  DEFAULT_TERMS,
  DEFAULT_ASSESSMENT_SETS,
  DEFAULT_SUBJECTS,
  DEFAULT_TEACHERS,
  DEFAULT_LEARNERS,
  DEFAULT_O_LEVEL_MARKS,
  DEFAULT_A_LEVEL_MARKS,
  DEFAULT_O_LEVEL_BOUNDARIES,
  DEFAULT_A_LEVEL_BOUNDARIES,
  DEFAULT_HEADTEACHER_COMMENTS,
} from '../data/mockData';
import {
  calculateOLevelScore,
  calculateALevelSubjectScore,
} from '../utils/academicCalculations';

interface AppContextType {
  currentUser: UserAccount;
  users: UserAccount[];
  switchUser: (userId: string) => void;
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (id: string, user: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;

  schoolProfile: SchoolProfile;
  updateSchoolProfile: (profile: Partial<SchoolProfile>) => void;

  classes: AcademicClass[];
  addClass: (cls: Omit<AcademicClass, 'id'>) => void;
  updateClass: (id: string, cls: Partial<AcademicClass>) => void;
  deleteClass: (id: string) => void;

  terms: AcademicTerm[];
  addTerm: (term: Omit<AcademicTerm, 'id'>) => void;
  updateTerm: (id: string, term: Partial<AcademicTerm>) => void;
  setCurrentTerm: (termId: string) => void;
  setTermPublicationStatus: (termId: string, status: 'draft' | 'published') => void;

  subjects: Subject[];
  addSubject: (sub: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, sub: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  updateSubjectPapers: (subjectId: string, papers: SubjectPaperConfig[]) => void;
  toggleSubjectPaper: (subjectId: string, paperNumber: number, active: boolean) => void;

  teachers: Teacher[];
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  learners: Learner[];
  addLearner: (learner: Omit<Learner, 'id'>) => string;
  updateLearner: (id: string, learner: Partial<Learner>) => void;
  deleteLearner: (id: string) => void;
  batchAddLearners: (learners: Omit<Learner, 'id'>[]) => number;

  oLevelMarks: OLevelMark[];
  saveOLevelMark: (mark: Omit<OLevelMark, 'id' | 'updatedAt'> & { id?: string }) => void;
  batchSaveOLevelMarks: (marks: (Omit<OLevelMark, 'id' | 'updatedAt'> & { id?: string })[]) => void;

  aLevelMarks: ALevelMark[];
  saveALevelMark: (mark: Omit<ALevelMark, 'id' | 'updatedAt'> & { id?: string }) => void;
  batchSaveALevelMarks: (marks: (Omit<ALevelMark, 'id' | 'updatedAt'> & { id?: string })[]) => void;

  assessmentSets: AssessmentSet[];
  updateAssessmentSet: (id: string, update: Partial<AssessmentSet>) => void;

  oLevelBoundaries: GradeBoundary[];
  updateOLevelBoundaries: (boundaries: GradeBoundary[]) => void;

  aLevelBoundaries: GradeBoundary[];
  updateALevelBoundaries: (boundaries: GradeBoundary[]) => void;

  headTeacherComments: HeadTeacherCommentRule[];
  updateHeadTeacherComments: (comments: HeadTeacherCommentRule[]) => void;

  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`ug_edutrack_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error loading ${key} from localStorage`, err);
    return defaultValue;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`ug_edutrack_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage`, err);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserAccount[]>(() => loadStorage('users', DEFAULT_USERS));
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const savedId = localStorage.getItem('ug_edutrack_currentUserId');
    const matched = users.find((u) => u.id === savedId);
    return matched || users[0];
  });

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() =>
    loadStorage('schoolProfile', DEFAULT_SCHOOL_PROFILE)
  );

  const [classes, setClasses] = useState<AcademicClass[]>(() => loadStorage('classes', DEFAULT_CLASSES));
  const [terms, setTerms] = useState<AcademicTerm[]>(() => loadStorage('terms', DEFAULT_TERMS));
  const [subjects, setSubjects] = useState<Subject[]>(() => loadStorage('subjects', DEFAULT_SUBJECTS));
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadStorage('teachers', DEFAULT_TEACHERS));
  const [learners, setLearners] = useState<Learner[]>(() => loadStorage('learners', DEFAULT_LEARNERS));
  const [oLevelMarks, setOLevelMarks] = useState<OLevelMark[]>(() =>
    loadStorage('oLevelMarks', DEFAULT_O_LEVEL_MARKS)
  );
  const [aLevelMarks, setALevelMarks] = useState<ALevelMark[]>(() =>
    loadStorage('aLevelMarks', DEFAULT_A_LEVEL_MARKS)
  );
  const [assessmentSets, setAssessmentSets] = useState<AssessmentSet[]>(() =>
    loadStorage('assessmentSets', DEFAULT_ASSESSMENT_SETS)
  );
  const [oLevelBoundaries, setOLevelBoundaries] = useState<GradeBoundary[]>(() =>
    loadStorage('oLevelBoundaries', DEFAULT_O_LEVEL_BOUNDARIES)
  );
  const [aLevelBoundaries, setALevelBoundaries] = useState<GradeBoundary[]>(() =>
    loadStorage('aLevelBoundaries', DEFAULT_A_LEVEL_BOUNDARIES)
  );
  const [headTeacherComments, setHeadTeacherComments] = useState<HeadTeacherCommentRule[]>(() =>
    loadStorage('headTeacherComments', DEFAULT_HEADTEACHER_COMMENTS)
  );

  // Sync state changes to localStorage
  useEffect(() => saveStorage('users', users), [users]);
  useEffect(() => saveStorage('schoolProfile', schoolProfile), [schoolProfile]);
  useEffect(() => saveStorage('classes', classes), [classes]);
  useEffect(() => saveStorage('terms', terms), [terms]);
  useEffect(() => saveStorage('subjects', subjects), [subjects]);
  useEffect(() => saveStorage('teachers', teachers), [teachers]);
  useEffect(() => saveStorage('learners', learners), [learners]);
  useEffect(() => saveStorage('oLevelMarks', oLevelMarks), [oLevelMarks]);
  useEffect(() => saveStorage('aLevelMarks', aLevelMarks), [aLevelMarks]);
  useEffect(() => saveStorage('assessmentSets', assessmentSets), [assessmentSets]);
  useEffect(() => saveStorage('oLevelBoundaries', oLevelBoundaries), [oLevelBoundaries]);
  useEffect(() => saveStorage('aLevelBoundaries', aLevelBoundaries), [aLevelBoundaries]);
  useEffect(() => saveStorage('headTeacherComments', headTeacherComments), [headTeacherComments]);

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('ug_edutrack_currentUserId', userId);
    }
  };

  const addUser = (newUser: Omit<UserAccount, 'id'>) => {
    const created: UserAccount = { ...newUser, id: `usr-${Date.now()}` };
    setUsers((prev) => [...prev, created]);
  };

  const updateUser = (id: string, update: Partial<UserAccount>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...update } : u))
    );
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...update }));
    }
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const updateSchoolProfile = (profile: Partial<SchoolProfile>) => {
    setSchoolProfile((prev) => ({ ...prev, ...profile }));
  };

  const addClass = (newCls: Omit<AcademicClass, 'id'>) => {
    const created: AcademicClass = { ...newCls, id: `cls-${Date.now()}` };
    setClasses((prev) => [...prev, created]);
  };

  const updateClass = (id: string, cls: Partial<AcademicClass>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...cls } : c)));
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  const addTerm = (newTerm: Omit<AcademicTerm, 'id'>) => {
    const created: AcademicTerm = { ...newTerm, id: `term-${Date.now()}` };
    setTerms((prev) => [...prev, created]);
  };

  const updateTerm = (id: string, term: Partial<AcademicTerm>) => {
    setTerms((prev) => prev.map((t) => (t.id === id ? { ...t, ...term } : t)));
  };

  const setCurrentTerm = (termId: string) => {
    setTerms((prev) =>
      prev.map((t) => ({ ...t, isCurrent: t.id === termId }))
    );
    setSchoolProfile((prev) => ({ ...prev, activeTermId: termId }));
  };

  const setTermPublicationStatus = (termId: string, status: 'draft' | 'published') => {
    setTerms((prev) =>
      prev.map((t) => (t.id === termId ? { ...t, publicationStatus: status } : t))
    );
  };

  const addSubject = (newSub: Omit<Subject, 'id'>) => {
    const created: Subject = {
      ...newSub,
      id: `sub-${Date.now()}`,
      papers:
        newSub.programme === 'A_LEVEL'
          ? [
              { paperNumber: 1, label: 'Paper 1', active: true, maxScore: 100 },
              { paperNumber: 2, label: 'Paper 2', active: true, maxScore: 100 },
              { paperNumber: 3, label: 'Paper 3', active: false, maxScore: 100 },
              { paperNumber: 4, label: 'Paper 4', active: false, maxScore: 100 },
            ]
          : undefined,
    };
    setSubjects((prev) => [...prev, created]);
  };

  const updateSubject = (id: string, sub: Partial<Subject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...sub } : s)));
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSubjectPapers = (subjectId: string, papers: SubjectPaperConfig[]) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, papers } : s))
    );
  };

  const toggleSubjectPaper = (subjectId: string, paperNumber: number, active: boolean) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        const currentPapers = s.papers || [
          { paperNumber: 1, label: 'Paper 1', active: true, maxScore: 100 },
          { paperNumber: 2, label: 'Paper 2', active: true, maxScore: 100 },
          { paperNumber: 3, label: 'Paper 3', active: false, maxScore: 100 },
          { paperNumber: 4, label: 'Paper 4', active: false, maxScore: 100 },
        ];
        const updatedPapers = currentPapers.map((p) =>
          p.paperNumber === paperNumber ? { ...p, active } : p
        );
        return { ...s, papers: updatedPapers };
      })
    );
  };

  const addTeacher = (newTeacher: Omit<Teacher, 'id'>) => {
    const created: Teacher = { ...newTeacher, id: `tch-${Date.now()}` };
    setTeachers((prev) => [...prev, created]);
  };

  const updateTeacher = (id: string, teacher: Partial<Teacher>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...teacher } : t)));
  };

  const deleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  const addLearner = (newLearner: Omit<Learner, 'id'>): string => {
    const id = `lrn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const created: Learner = { ...newLearner, id };
    setLearners((prev) => [created, ...prev]);
    return id;
  };

  const updateLearner = (id: string, learner: Partial<Learner>) => {
    setLearners((prev) => prev.map((l) => (l.id === id ? { ...l, ...learner } : l)));
  };

  const deleteLearner = (id: string) => {
    setLearners((prev) => prev.filter((l) => l.id !== id));
    // Clean up marks associated with learner
    setOLevelMarks((prev) => prev.filter((m) => m.learnerId !== id));
    setALevelMarks((prev) => prev.filter((m) => m.learnerId !== id));
  };

  const batchAddLearners = (newLearners: Omit<Learner, 'id'>[]): number => {
    const createdList: Learner[] = newLearners.map((item, idx) => ({
      ...item,
      id: `lrn-${Date.now()}-${idx}`,
    }));
    setLearners((prev) => [...createdList, ...prev]);
    return createdList.length;
  };

  const saveOLevelMark = (mark: Omit<OLevelMark, 'id' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString().split('T')[0];
    setOLevelMarks((prev) => {
      const existingIdx = prev.findIndex(
        (m) =>
          (mark.id && m.id === mark.id) ||
          (m.termId === mark.termId && m.learnerId === mark.learnerId && m.subjectId === mark.subjectId)
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...mark,
          updatedAt: now,
        };
        return updated;
      } else {
        const newRecord: OLevelMark = {
          ...mark,
          id: mark.id || `om-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          updatedAt: now,
        };
        return [...prev, newRecord];
      }
    });
  };

  const batchSaveOLevelMarks = (marks: (Omit<OLevelMark, 'id' | 'updatedAt'> & { id?: string })[]) => {
    const now = new Date().toISOString().split('T')[0];
    setOLevelMarks((prev) => {
      const copy = [...prev];
      marks.forEach((mark) => {
        const existingIdx = copy.findIndex(
          (m) =>
            (mark.id && m.id === mark.id) ||
            (m.termId === mark.termId && m.learnerId === mark.learnerId && m.subjectId === mark.subjectId)
        );
        if (existingIdx >= 0) {
          copy[existingIdx] = {
            ...copy[existingIdx],
            ...mark,
            updatedAt: now,
          };
        } else {
          copy.push({
            ...mark,
            id: mark.id || `om-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            updatedAt: now,
          });
        }
      });
      return copy;
    });
  };

  const saveALevelMark = (mark: Omit<ALevelMark, 'id' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString().split('T')[0];
    setALevelMarks((prev) => {
      const existingIdx = prev.findIndex(
        (m) =>
          (mark.id && m.id === mark.id) ||
          (m.termId === mark.termId && m.learnerId === mark.learnerId && m.subjectId === mark.subjectId)
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...mark,
          updatedAt: now,
        };
        return updated;
      } else {
        const newRecord: ALevelMark = {
          ...mark,
          id: mark.id || `am-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          updatedAt: now,
        };
        return [...prev, newRecord];
      }
    });
  };

  const batchSaveALevelMarks = (marks: (Omit<ALevelMark, 'id' | 'updatedAt'> & { id?: string })[]) => {
    const now = new Date().toISOString().split('T')[0];
    setALevelMarks((prev) => {
      const copy = [...prev];
      marks.forEach((mark) => {
        const existingIdx = copy.findIndex(
          (m) =>
            (mark.id && m.id === mark.id) ||
            (m.termId === mark.termId && m.learnerId === mark.learnerId && m.subjectId === mark.subjectId)
        );
        if (existingIdx >= 0) {
          copy[existingIdx] = {
            ...copy[existingIdx],
            ...mark,
            updatedAt: now,
          };
        } else {
          copy.push({
            ...mark,
            id: mark.id || `am-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            updatedAt: now,
          });
        }
      });
      return copy;
    });
  };

  const updateAssessmentSet = (id: string, update: Partial<AssessmentSet>) => {
    setAssessmentSets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...update } : a))
    );
  };

  const updateOLevelBoundaries = (boundaries: GradeBoundary[]) => {
    setOLevelBoundaries(boundaries);
    // Automatically re-evaluate and sync all O-Level marks with new boundaries
    setOLevelMarks((prev) =>
      prev.map((m) => {
        const calc = calculateOLevelScore(
          m.a1_score3,
          m.a1_score20,
          m.a2_score3,
          m.a2_score20,
          m.a3_eot,
          boundaries,
          m.weightedAverage
        );
        return {
          ...m,
          grade: calc.grade,
          totalScore: calc.totalScore,
          weightedAverage: calc.weightedAverage,
        };
      })
    );
  };

  const updateALevelBoundaries = (boundaries: GradeBoundary[]) => {
    setALevelBoundaries(boundaries);
    // Automatically re-evaluate and sync all A-Level marks with new boundaries
    setALevelMarks((prev) =>
      prev.map((m) => {
        const sub = subjects.find((s) => s.id === m.subjectId);
        if (!sub) return m;
        const calc = calculateALevelSubjectScore(
          sub,
          m.paperScores || {},
          boundaries,
          m.averageScore
        );
        return {
          ...m,
          grade: calc.grade,
          points: calc.points,
          averageScore: calc.averageScore,
        };
      })
    );
  };

  const updateHeadTeacherComments = (comments: HeadTeacherCommentRule[]) => {
    setHeadTeacherComments(comments);
  };

  const resetToDefaults = () => {
    setUsers(DEFAULT_USERS);
    setCurrentUser(DEFAULT_USERS[0]);
    setSchoolProfile(DEFAULT_SCHOOL_PROFILE);
    setClasses(DEFAULT_CLASSES);
    setTerms(DEFAULT_TERMS);
    setSubjects(DEFAULT_SUBJECTS);
    setTeachers(DEFAULT_TEACHERS);
    setLearners(DEFAULT_LEARNERS);
    setOLevelMarks(DEFAULT_O_LEVEL_MARKS);
    setALevelMarks(DEFAULT_A_LEVEL_MARKS);
    setAssessmentSets(DEFAULT_ASSESSMENT_SETS);
    setOLevelBoundaries(DEFAULT_O_LEVEL_BOUNDARIES);
    setALevelBoundaries(DEFAULT_A_LEVEL_BOUNDARIES);
    setHeadTeacherComments(DEFAULT_HEADTEACHER_COMMENTS);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        schoolProfile,
        updateSchoolProfile,
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
        updateSubjectPapers,
        toggleSubjectPaper,
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        learners,
        addLearner,
        updateLearner,
        deleteLearner,
        batchAddLearners,
        oLevelMarks,
        saveOLevelMark,
        batchSaveOLevelMarks,
        aLevelMarks,
        saveALevelMark,
        batchSaveALevelMarks,
        assessmentSets,
        updateAssessmentSet,
        oLevelBoundaries,
        updateOLevelBoundaries,
        aLevelBoundaries,
        updateALevelBoundaries,
        headTeacherComments,
        updateHeadTeacherComments,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
