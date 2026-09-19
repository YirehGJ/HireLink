import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'recruiter' | 'candidate';
export type UserStatus = 'active' | 'suspended';
export type JobSeniority = 'intern' | 'junior' | 'mid' | 'senior' | 'lead';
export type JobStatus = 'draft' | 'published' | 'closed';
export type ApplicationStatus = 'applied' | 'screening' | 'assessment' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
export type InterviewType = 'phone' | 'video' | 'onsite';
export type NotificationChannel = 'email' | 'sms' | 'webpush';
export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'canceled';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  lastSignIn?: Timestamp | Date;
  organizationRef?: string; // For recruiters
}

export interface Candidate {
  id: string;
  userRef: string;
  fullName?: string;
  email?: string;
  headline: string;
  location: string;
  yearsOfExperience: number;
  available: boolean;
  skills: Skill[];
  resumeRef?: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  website: string;
  logoUrl: string;
}

export interface Skill {
  name: string;
  level: number; // 0-5
  years: number; // 0-60
  source: string;
}

export interface Job {
  id: string;
  organizationRef: string;
  title: string;
  descriptionMd: string;
  location: string;
  remoteAllowed: boolean;
  contractType: string;
  seniority: JobSeniority;
  status: JobStatus;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  searchTags: string[];
  createdAt?: Timestamp | Date;
}

export interface Application {
  id: string;
  candidateRef: string;
  jobRef: string;
  status: ApplicationStatus;
  source: string;
  cvRef: string;
  appliedAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  shortlisted?: boolean;
  recruiterNotes?: string;
}

export interface Interview {
  id: string;
  jobRef: string;
  organizationRef: string;
  candidateRef: string;
  interviewerRef: string;
  type: InterviewType;
  scheduledStart: Timestamp | Date;
  location: string;
  notes?: string;
  candidateName?: string;
  jobTitle?: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: Timestamp | Date;
}

export interface Recommendation {
  id: string;
  candidateRef: string;
  jobRef: string;
  score: number; // 0-1
  reasons: string[];
  engineVersion: string;
  createdAt: Timestamp | Date;
}
