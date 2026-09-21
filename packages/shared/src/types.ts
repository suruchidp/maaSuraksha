import type {
  DietMealPreference,
  DietRegion,
  DietGuidanceIntent,
} from "./constants";

export enum UserRole {
  PATIENT = "PATIENT",
  ASHA = "ASHA",
  DOCTOR = "DOCTOR",
  ADMIN = "ADMIN",
}

export enum Language {
  EN = "en",
  HI = "hi",
  KN = "kn",
}

export enum Trimester {
  FIRST = 1,
  SECOND = 2,
  THIRD = 3,
}

export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum AlertSeverity {
  INFO = "info",
  WARNING = "warning",
  URGENT = "urgent",
  CRITICAL = "critical",
}

export enum AlertStatus {
  PENDING = "pending",
  ACKNOWLEDGED = "acknowledged",
  RESOLVED = "resolved",
}

export enum ReferralStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  COMPLETED = "completed",
  REJECTED = "rejected",
}

export enum HomeVisitStatus {
  PENDING = "pending",
  SCHEDULED = "scheduled",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  ESCALATED = "escalated",
}

export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  MISSED = "missed",
}

export enum MoodSentiment {
  POSITIVE = "positive",
  NEUTRAL = "neutral",
  NEGATIVE = "negative",
  DISTRESSED = "distressed",
}

export enum PPDSeverity {
  NONE = "none",
  MILD = "mild",
  MODERATE = "moderate",
  SEVERE = "severe",
}

export enum GDMRisk {
  LOW = "low",
  MODERATE = "moderate",
  HIGH = "high",
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  language: Language;
  assignedASHA?: string;
  assignedDoctor?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PregnancyProfile {
  _id: string;
  user: string;
  lmp: string;
  expectedDueDate: string;
  gestationalWeek: number;
  trimester: Trimester;
  gravida?: number;
  para?: number;
  isHighRisk: boolean;
  riskFactors: string[];
  medicalHistory: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthMetric {
  _id: string;
  user: string;
  date: string;
  systolicBP?: number;
  diastolicBP?: number;
  weight?: number;
  glucose?: number;
  heartRate?: number;
  temperature?: number;
  hemoglobin?: number;
  recordedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Symptom {
  _id: string;
  user: string;
  date: string;
  symptoms: string[];
  severity: string;
  notes?: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaternalRiskAssessment {
  _id: string;
  user: string;
  assessedBy: string;
  status: "pending" | "completed" | "unavailable";
  riskLevel?: RiskLevel;
  riskScore?: number;
  riskFactors: string[];
  shapValues?: Record<string, number>;
  recommendations: string[];
  modelVersion?: string;
  inputFeatures: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface GDMAssessment {
  _id: string;
  user: string;
  assessedBy: string;
  status: "pending" | "completed" | "unavailable";
  riskLevel?: GDMRisk;
  riskScore?: number;
  fastingGlucose?: number;
  postprandialGlucose?: number;
  hba1c?: number;
  riskFactors: string[];
  shapValues?: Record<string, number>;
  recommendations: string[];
  modelVersion?: string;
  inputFeatures: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface MoodEntry {
  _id: string;
  user: string;
  journalText: string;
  status: "pending" | "analyzed" | "unavailable";
  sentiment?: MoodSentiment;
  sentimentScore?: number;
  keywords: string[];
  safetyFlag: boolean;
  safetyNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PPDAssessment {
  _id: string;
  user: string;
  assessedBy: string;
  status: "pending" | "completed" | "unavailable";
  edinburghAnswers?: number[];
  edinburghScore?: number;
  severity?: PPDSeverity;
  riskFactors: string[];
  screeningText?: string;
  modelConfidence?: number;
  nlpAnalysis?: {
    sentiment: string;
    keywords: string[];
    riskIndicators: string[];
  };
  recommendations: string[];
  modelVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  _id: string;
  user: string;
  category: string;
  title: string;
  content: string;
  priority: string;
  isPersonalized: boolean;
  source?: string;
  isRead: boolean;
  sourceType?: "SYSTEM" | "CARE_TEAM";
  titleLocalized?: Record<Language, string>;
  contentLocalized?: Record<Language, string>;
  reason?: string;
  reasonLocalized?: Record<Language, string>;
  references?: {
    assessmentId: string;
    assessmentType: "maternal" | "gdm" | "ppd";
    modelVersion?: string;
  }[];
  templateKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DietPlan {
  _id: string;
  user: string;
  title: string;
  description: string;
  meals: {
    name: string;
    items: string[];
    notes?: string;
  }[];
  nutritionalNotes: string;
  disclaimer: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DietGuidancePreferences {
  _id: string;
  user: string;
  mealPreference: DietMealPreference;
  region?: DietRegion;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DietGuidanceReference {
  assessmentId: string;
  assessmentType: "maternal" | "gdm";
  modelVersion?: string;
}

export interface DietGuidanceAttribution {
  id: string;
  title: string;
  url: string;
}

export interface DietGuidanceSection {
  key: string;
  heading: Record<Language, string>;
  body?: Record<Language, string>;
  bullets?: Record<Language, string>[];
}

export interface DietGuidance {
  _id: string;
  user: string;
  sourceType: "SYSTEM";
  templateKey: string;
  dedupeKey: string;
  intent: DietGuidanceIntent;
  contentVersion: string;
  priority: "low" | "medium" | "high";
  title: string;
  titleLocalized: Record<Language, string>;
  sections: DietGuidanceSection[];
  rationale: string;
  rationaleLocalized: Record<Language, string>;
  disclaimer: string;
  disclaimerLocalized: Record<Language, string>;
  attribution: DietGuidanceAttribution[];
  references?: DietGuidanceReference[];
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  readAt?: string;
  _id: string;
  user: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  _id: string;
  patient: string;
  referredBy: string;
  referredTo?: string;
  referredToName?: string;
  facility?: string;
  reason: string;
  notes?: string;
  status: ReferralStatus;
  history?: {
    status: ReferralStatus;
    changedBy: string;
    changedAt: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface HomeVisit {
  _id: string;
  patient: string;
  patientName?: string;
  requestedBy: string;
  reason: string;
  notes?: string;
  preferredDate: string;
  preferredTime: string;
  status: HomeVisitStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledBy?: string;
  completedAt?: string;
  completedBy?: string;
  visitNotes?: string;
  followUpNeeded?: boolean;
  measurementIds?: string[];
  referralId?: string;
  result?: Record<string, number>;
  outcome?: ReferralStatus | "none";
  visitRecordId?: string;
  lastMessage?: string;
  history?: {
    status: HomeVisitStatus;
    changedBy: string;
    changedAt: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  patient: string;
  doctor?: string;
  asha?: string;
  date: string;
  time: string;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EducationalContent {
  _id: string;
  title: Record<Language, string>;
  body: Record<Language, string>;
  category: string;
  tags: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversation {
  _id: string;
  user: string;
  title?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  _id: string;
  user: string;
  title: string;
  type: string;
  data: Record<string, unknown>;
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  user: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}
