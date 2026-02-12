export enum TriageLevel {
  RED = 'RED',         // High Risk / Immediate ER
  ORANGE = 'ORANGE',   // Intermediate / Urgent
  GREEN = 'GREEN'      // Stable / Non-urgent
}

export enum PatientStatus {
  REGISTERED = 'REGISTERED', // Initial registration completed
  TRIAGE = 'TRIAGE',
  PHYSICIAN_QUEUE = 'PHYSICIAN_QUEUE',
  ER_QUEUE = 'ER_QUEUE',
  ADMITTED = 'ADMITTED',
  DISCHARGED = 'DISCHARGED',
  STABILIZED_HOME = 'STABILIZED_HOME'
}

export interface Vitals {
  bp: string;
  hr: string;
  temp: string;
  spo2: string;
}

export type Sex = 'MALE' | 'FEMALE';

export type Specialty = 'INTERNAL_MEDICINE' | 'SURGERY' | 'OBS_GYN' | 'PEDIATRICS';

export interface PathwayStep {
  status: PatientStatus;
  description: string;
  timestamp: number;
  actor: string;
}

export interface Patient {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  queueNumber?: string;
  email?: string;
  address?: string;
  age: number;
  sex: Sex;
  isPregnant: boolean;
  specialty: Specialty;
  medicalHistory?: string; 
  familyHistory?: string;
  medications?: string;
  surgeries?: string;
  chiefComplaint: string;
  vitals: Vitals;
  triageLevel: TriageLevel | null;
  aiJustification?: string;
  aiSummary?: string;
  screeningQuestions?: { question: string; answer: string }[];
  status: PatientStatus;
  timestamp: number;
  referralSource?: 'NURSE' | 'PHYSICIAN' | 'DIRECT' | 'REGISTRATION';
  physicianNotes?: string;
  erNotes?: string;
  pathway: PathwayStep[];
  followUpVisit?: boolean;
  followUpDays?: number;
  followUpSetAt?: number;
}

export type PlatformType = 'REGISTRATION' | 'NURSE' | 'PHYSICIAN' | 'ER' | 'HISTORY' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: PlatformType;
}