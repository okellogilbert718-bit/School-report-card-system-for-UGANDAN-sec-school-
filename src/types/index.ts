/**
 * Types for School Academic Management System (O-Level & A-Level)
 */

export type UserRole = 'admin' | 'teacher' | 'learner_parent';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teacherId?: string;
  learnerId?: string;
  title?: string;
}

export type Programme = 'O_LEVEL' | 'A_LEVEL';

export interface SchoolProfile {
  name: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string; // Base64 or image URL
  headTeacherName: string;
  headTeacherTitle: string;
  academicYear: string;
  activeTermId: string;
  nextTermBegins: string;
  feesBalanceNote: string;
  showClassPosition: boolean;
}

export interface AcademicClass {
  id: string;
  name: string; // e.g. "Senior 1"
  code: string; // e.g. "S.1"
  programme: Programme;
  streams: string[];
}

export interface AcademicTerm {
  id: string;
  name: string; // e.g. "Term 1 2026"
  year: string;
  termNumber: 1 | 2 | 3;
  startDate: string;
  endDate: string;
  publicationStatus: 'draft' | 'published';
  isCurrent: boolean;
}

export interface SubjectPaperConfig {
  paperNumber: number; // 1, 2, 3, 4
  label: string; // e.g. "P510/1 (Mechanics)"
  active: boolean;
  maxScore: number;
}

export interface Subject {
  id: string;
  code: string; // e.g. "553" or "P510"
  name: string;
  programme: Programme;
  isCompulsory: boolean;
  category: 'sciences' | 'arts' | 'languages' | 'vocational' | 'subsidiary';
  papers?: SubjectPaperConfig[]; // For A-Level (Papers 1 - 4)
}

export interface Teacher {
  id: string;
  fullName: string;
  initials: string;
  email: string;
  phone: string;
  assignedSubjectIds: string[];
  assignedClassIds: string[];
}

export interface Learner {
  id: string;
  admissionNo: string;
  lin: string; // Learner Identification Number
  fullName: string;
  gender: 'Male' | 'Female';
  dob: string;
  programme: Programme;
  classId: string;
  stream: string;
  section: string; // House or section
  enrolmentStatus: 'Active' | 'Inactive' | 'Transferred' | 'Suspended';
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  photoUrl?: string;
  aLevelCombination?: string; // e.g. "PCM/ICT"
  allocatedSubjectIds: string[];
  daysPresent: number;
  totalDays: number;
  conduct: string;
}

export type MarkStatus = 'draft' | 'submitted' | 'validated' | 'published';

export interface OLevelMark {
  id: string;
  termId: string;
  learnerId: string;
  subjectId: string;
  a1_score3: number; // Assessment 1 /3
  a1_score20: number; // Assessment 1 /20
  a2_score3: number; // Assessment 2 /3
  a2_score20: number; // Assessment 2 /20
  a3_eot: number; // Assessment 3 (End of Term) /80 or /100
  weightedAverage: number;
  totalScore: number;
  grade: string; // D1, D2, C3, C4, C5, C6, P7, P8, F9
  subjectComment: string;
  teacherInitials: string;
  status: MarkStatus;
  updatedAt: string;
}

export interface ALevelMark {
  id: string;
  termId: string;
  learnerId: string;
  subjectId: string;
  paperScores: { [paperNumber: number]: number }; // e.g. { 1: 74, 2: 68, 3: 80 }
  averageScore: number; // live computed average of active papers
  grade: string; // A, B, C, D, E, O, F or Sub pass P, F
  points: number; // 6, 5, 4, 3, 2, 1, 0
  subjectComment: string;
  teacherInitials: string;
  status: MarkStatus;
  updatedAt: string;
}

export interface GradeBoundary {
  id: string;
  grade: string;
  minScore: number;
  maxScore: number;
  points: number; // For A-level (6 for A, 5 for B, etc.) or Aggregate for O-level (1 for D1, etc.)
  descriptor: string;
  commentTemplate: string;
}

export interface HeadTeacherCommentRule {
  id: string;
  programme: Programme;
  minAverage: number;
  maxAverage: number;
  comment: string;
}

export interface AssessmentSet {
  id: string;
  code: 'a1' | 'a2' | 'a3';
  name: string;
  programme: Programme | 'BOTH';
  maxScore: number;
  weightPercent: number;
  isOpen: boolean;
  deadline?: string;
}
