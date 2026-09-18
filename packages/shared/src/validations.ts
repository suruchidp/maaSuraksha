import { validAppointmentDate } from "./appointmentTime";
import { z } from "zod";
import { UserRole, Language } from "./types";
import {
  EDUCATIONAL_CATEGORIES,
  RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_PRIORITIES,
  DIET_MEAL_PREFERENCES,
  DIET_REGIONS,
} from "./constants";

/** Returns true when a YYYY-MM-DD (or ISO) date string falls after the current
    local calendar date. Non-date strings and invalid calendar dates return
    false so they keep their existing validation behavior. */
export function isFutureCalendarDate(value: string, now: Date = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const input = new Date(year, month - 1, day);
  if (
    input.getFullYear() !== year ||
    input.getMonth() !== month - 1 ||
    input.getDate() !== day
  ) {
    return false;
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return input.getTime() > today.getTime();
}

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
  date: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isFutureCalendarDate(val),
      "Metric date cannot be in the future"
    ),
});

export const symptomSchema = z.object({
 symptoms: z.array(z.string().trim().min(1).max(100)).min(1).max(30),
 severity: z.enum(["mild", "moderate", "severe", "critical"]),
 notes: z.string().trim().max(500).optional(),
 date: z.string().refine(v => !isNaN(Date.parse(v)) && Date.parse(v) <= Date.now(), "Invalid or future date").optional(),
 onset: z.string().refine(v => !isNaN(Date.parse(v)) && Date.parse(v) <= Date.now(), "Invalid or future onset").optional(),
 durationHours: z.number().min(0).max(8760).optional(),
 frequency: z.enum(["once", "occasional", "daily", "constant"]).optional(),
}).refine(v => !v.onset || !v.date || Date.parse(v.onset) <= Date.parse(v.date), { message: "Onset must precede the recorded date", path: ["onset"] });

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
  patient: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid patient ID"),
  doctor: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
  asha: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
  date: z.string().refine((val) => validAppointmentDate(val), "Invalid date"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format"),
  type: z.string().trim().min(1, "Appointment type is required").max(100),
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

// Maternal risk inputs use APPLICATION / EXTERNAL units: bloodSugar in mg/dL
// and bodyTemp in degrees Celsius. The ML service converts these to the
// saved UCI model's INTERNAL units (mmol/L and °F) once at the model-input
// boundary (see apps/ml-service/app/ml/unit_conversion.py and
// docs/MATERNAL_RISK_UNIT_CONVERSION.md). No additional conversion happens here.
export const maternalRiskAssessmentSchema = z.object({
  user: z.string().min(1, "User is required"),
  age: z.number().min(10).max(100),
  systolicBP: z.number().min(50).max(300),
  diastolicBP: z.number().min(20).max(200),
  bloodSugar: z.number().min(20).max(500), // mg/dL (external)
  bodyTemp: z.number().min(33).max(43), // °C (external)
  heartRate: z.number().min(30).max(250),
  bmi: z.number().min(10).max(60),
  gestationalWeek: z.number().min(1).max(42),
  hemoglobin: z.number().min(2).max(25).optional(),
});

export const gdmAssessmentSchema = z.object({
  user: z.string().min(1, "User is required"),
  // Stage 1 early risk assessment inputs (available before glucose testing).
  age: z.number().min(10).max(100),
  bmi: z.number().min(10).max(60).optional(),
  hdl: z.number().min(5).max(150).optional(),
  pregnancyCount: z.number().min(1).max(10),
  previousPregnancyGestation: z.number().min(0).max(10),
  familyHistory: z.boolean().optional().default(false),
  unexplainedPrenatalLoss: z.boolean().optional().default(false),
  largeChildOrBirthDefect: z.boolean().optional().default(false),
  pcos: z.boolean().optional().default(false),
  systolicBP: z.number().min(50).max(300).optional(),
  diastolicBP: z.number().min(20).max(200),
  hemoglobin: z.number().min(2).max(25).optional(),
  sedentaryLifestyle: z.boolean().optional().default(false),
  // Stage 2 clinical glucose measurements: stored for record-keeping and
  // clinical review, but NEVER sent to the early-risk model.
  fastingGlucose: z.number().min(20).max(500).optional(),
  postprandialGlucose: z.number().min(20).max(700).optional(),
  hba1c: z.number().min(3).max(15).optional(),
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
  category: z.enum(RECOMMENDATION_CATEGORIES),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  priority: z.enum(RECOMMENDATION_PRIORITIES).default("medium"),
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

export const dietGuidancePreferencesSchema = z.object({
  mealPreference: z.enum(DIET_MEAL_PREFERENCES),
  region: z.enum(DIET_REGIONS).optional(),
});

export const alertSchema = z.object({
  user: z.string().min(1, "User is required"),
  type: z.string().min(1),
  severity: z.enum(["info", "warning", "urgent", "critical"]),
  title: z.string().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  source: z.string().max(100).optional(),
});

export const reportSchema = z.object({
 type: z.enum(["pregnancy_summary", "health_metrics", "risk_assessment", "gdm_assessment", "ppd_assessment", "comprehensive"]),
 title: z.string().trim().min(1).max(200).optional(),
 fromDate: z.string().refine(validAppointmentDate, "Invalid date").optional(),
 toDate: z.string().refine(validAppointmentDate, "Invalid date").optional(),
}).strict().refine(v => !v.fromDate || !v.toDate || v.fromDate <= v.toDate, { message: "Start date must precede end date", path: ["fromDate"] });

export const healthRecordSchema = z.object({
 category: z.enum(["lab_result", "ultrasound", "prescription", "discharge", "visit", "other"]),
 title: z.string().trim().min(1).max(200),
 date: z.string().refine(v => validAppointmentDate(v) && v <= new Date(Date.now()+330*60000).toISOString().slice(0,10), "Invalid or future date"),
 provider: z.string().trim().max(200).optional(),
 details: z.string().trim().min(1).max(10000),
}).strict();

export const educationalContentSchema = z.object({
  title: z.object({ en: z.string().trim().min(1).max(200), hi: z.string().trim().min(1).max(200), kn: z.string().trim().min(1).max(200) }),
  body: z.object({ en: z.string().trim().min(1).max(12000), hi: z.string().trim().min(1).max(12000), kn: z.string().trim().min(1).max(12000) }),
  category: z.enum(EDUCATIONAL_CATEGORIES),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  isActive: z.boolean().optional(),
  sources: z.array(z.object({ title: z.string().trim().min(1).max(200), url: z.string().url().refine(value => value.startsWith('https://'), 'Use an HTTPS source link') })).max(10).optional(),
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
export type DietGuidancePreferencesInput = z.infer<typeof dietGuidancePreferencesSchema>;
export type AlertInput = z.infer<typeof alertSchema>;
export type ReportInput = z.infer<typeof reportSchema>;

export type HealthRecordInput = z.infer<typeof healthRecordSchema>;
