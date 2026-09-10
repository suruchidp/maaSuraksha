import { z } from "zod";
import { UserRole, Language } from "./types";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  language: z.nativeEnum(Language).default(Language.EN),
});

export const healthMetricSchema = z.object({
  systolicBP: z.number().min(60).max(300).optional(),
  diastolicBP: z.number().min(30).max(200).optional(),
  weight: z.number().min(30).max(200).optional(),
  glucose: z.number().min(30).max(500).optional(),
  heartRate: z.number().min(40).max(200).optional(),
  temperature: z.number().min(35).max(42).optional(),
  hemoglobin: z.number().min(3).max(20).optional(),
  date: z.string().optional(),
});

export const symptomSchema = z.object({
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  severity: z.string(),
  notes: z.string().max(500).optional(),
  date: z.string().optional(),
});

export const pregnancyProfileSchema = z.object({
  lmp: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  gravida: z.number().min(0).max(20).optional(),
  para: z.number().min(0).max(20).optional(),
  medicalHistory: z.array(z.string()).optional(),
  riskFactors: z.array(z.string()).optional(),
});

export const moodEntrySchema = z.object({
  journalText: z
    .string()
    .min(1, "Journal entry cannot be empty")
    .max(2000, "Journal entry must be under 2000 characters"),
});

export const appointmentSchema = z.object({
  patient: z.string(),
  doctor: z.string().optional(),
  asha: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  type: z.string().min(1, "Appointment type is required"),
  notes: z.string().max(500).optional(),
});

export const chatMessageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, "Message cannot be empty").max(2000),
});

export const referralSchema = z.object({
  patient: z.string().min(1, "Patient is required"),
  referredTo: z.string().optional(),
  facility: z.string().max(200).optional(),
  reason: z.string().min(1, "Reason is required").max(1000),
  notes: z.string().max(1000).optional(),
});

export const maternalRiskAssessmentSchema = z.object({
  user: z.string().min(1, "User is required"),
  age: z.number().min(10).max(100),
  systolicBP: z.number().min(50).max(300),
  diastolicBP: z.number().min(20).max(200),
  bloodSugar: z.number().min(20).max(500),
  bodyTemp: z.number().min(33).max(43),
  heartRate: z.number().min(30).max(250),
  bmi: z.number().min(10).max(60),
  gestationalWeek: z.number().min(1).max(42),
  hemoglobin: z.number().min(2).max(25).optional(),
});

export const gdmAssessmentSchema = z.object({
  user: z.string().min(1, "User is required"),
  age: z.number().min(10).max(100),
  bmi: z.number().min(10).max(60),
  fastingGlucose: z.number().min(20).max(500),
  postprandialGlucose: z.number().min(20).max(700).optional(),
  hba1c: z.number().min(3).max(15).optional(),
  gestationalWeek: z.number().min(1).max(42),
  familyHistoryDiabetes: z.boolean().optional().default(false),
  previousGDM: z.boolean().optional().default(false),
});

export const ppdAssessmentSchema = z.object({
  user: z.string().min(1, "User is required"),
  edinburghAnswers: z
    .array(z.number().min(0).max(3))
    .length(10, "EPDS requires exactly 10 answers"),
  screeningText: z
    .string()
    .min(1, "Screening text cannot be empty")
    .max(5000, "Screening text must be under 5000 characters")
    .optional(),
});

export const recommendationSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  source: z.string().max(200).optional(),
});

export const dietPlanSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  meals: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        items: z.array(z.string().min(1)).min(1),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1, "At least one meal is required"),
  nutritionalNotes: z.string().min(1).max(2000),
});

export const alertSchema = z.object({
  user: z.string().min(1, "User is required"),
  type: z.string().min(1),
  severity: z.enum(["info", "warning", "urgent", "critical"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
});

export const reportSchema = z.object({
  type: z.string().min(1),
  data: z.record(z.string(), z.any()),
  title: z.string().min(1).max(200).optional(),
});

export const educationalContentSchema = z.object({
  title: z.object({
    en: z.string().min(1),
    hi: z.string().min(1),
    kn: z.string().min(1),
  }),
  body: z.object({
    en: z.string().min(1),
    hi: z.string().min(1),
    kn: z.string().min(1),
  }),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type HealthMetricInput = z.infer<typeof healthMetricSchema>;
export type SymptomInput = z.infer<typeof symptomSchema>;
export type PregnancyProfileInput = z.infer<typeof pregnancyProfileSchema>;
export type MoodEntryInput = z.infer<typeof moodEntrySchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type EducationalContentInput = z.infer<typeof educationalContentSchema>;
export type ReferralInput = z.infer<typeof referralSchema>;
export type MaternalRiskAssessmentInput = z.infer<typeof maternalRiskAssessmentSchema>;
export type GDMAssessmentInput = z.infer<typeof gdmAssessmentSchema>;
export type PPDAssessmentInput = z.infer<typeof ppdAssessmentSchema>;
export type RecommendationInput = z.infer<typeof recommendationSchema>;
export type DietPlanInput = z.infer<typeof dietPlanSchema>;
export type AlertInput = z.infer<typeof alertSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
