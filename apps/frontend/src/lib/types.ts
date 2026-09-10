import {
  UserRole,
  Language,
  Trimester,
  RiskLevel,
  GDMRisk,
  PPDSeverity,
  MoodSentiment,
  AlertSeverity,
  AlertStatus,
  ReferralStatus,
  AppointmentStatus,
} from "@maasuraksha/shared";

/* Wire-format DTOs. The backend returns `id` (not `_id`) and ISO date
   strings on the wire; shared-package entities are used for enums/input
   schemas. */

export interface UserDTO {
  id: string;
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

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    language: Language;
  };
}

export interface PregnancyProfileDTO {
  id: string;
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

export interface HealthMetricDTO {
  id: string;
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

export interface SymptomDTO {
  id: string;
  user: string;
  date: string;
  symptoms: string[];
  severity: string;
  notes?: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type AssessmentStatus = "pending" | "completed" | "unavailable";

export interface MaternalRiskDTO {
  id: string;
  user: string;
  assessedBy: string;
  status: AssessmentStatus;
  riskLevel?: RiskLevel;
  riskScore?: number;
  riskFactors: string[];
  shapValues?: Record<string, number>;
  recommendations: string[];
  modelVersion?: string;
  inputFeatures: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  message?: string;
}

export interface GDMAssessmentDTO {
  id: string;
  user: string;
  assessedBy: string;
  status: AssessmentStatus;
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
  message?: string;
}

export interface PPDAssessmentDTO {
  id: string;
  user: string;
  assessedBy: string;
  status: AssessmentStatus;
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
  edinburghAnswersSubmitted?: number[];
  createdAt: string;
  updatedAt: string;
  message?: string;
}

export interface MoodEntryDTO {
  id: string;
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
  message?: string;
}

export interface RecommendationDTO {
  id: string;
  user: string;
  category: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high";
  isPersonalized: boolean;
  source?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DietPlanMealDTO {
  name: string;
  items: string[];
  notes?: string;
}

export interface DietPlanDTO {
  id: string;
  user: string;
  title: string;
  description: string;
  meals: DietPlanMealDTO[];
  nutritionalNotes: string;
  disclaimer: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertDTO {
  id: string;
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

export interface ReferralDTO {
  id: string;
  patient: string;
  referredBy: string;
  referredTo?: string;
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

export interface AppointmentDTO {
  id: string;
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

export interface EducationalContentDTO {
  id: string;
  title: Record<Language, string>;
  body: Record<Language, string>;
  category: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversationDTO {
  id: string;
  user: string;
  title?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageDTO {
  id: string;
  conversation: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageResult {
  userMessage: ChatMessageDTO;
  assistantMessage: ChatMessageDTO;
  requiresHumanReview: boolean;
}

export interface ReportDTO {
  id: string;
  user: string;
  type: string;
  title: string;
  data?: Record<string, unknown>;
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOverviewDTO {
  users: number;
  activeUsers: number;
  patients: number;
  ashas: number;
  doctors: number;
  pregnancyProfiles: number;
  healthMetrics: number;
  symptoms: number;
  assessments: number;
  moodEntries: number;
  pendingAlerts: number;
  pendingReferrals: number;
  appointments: number;
}

export interface AuditLogDTO {
  id: string;
  actor: { id: string; name: string; email: string; role: UserRole } | null;
  action: string;
  resource: string;
  resourceId?: string;
  createdAt: string;
  updatedAt: string;
}

/* ML service model status (surfaced by backend as pending/message). */
export type ModelStatus = "MODEL_AVAILABLE" | "MODEL_UNAVAILABLE" | "RULE_BASED";