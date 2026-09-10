import { z } from "zod";
import { UserRole, Language } from "@maasuraksha/shared";
import type { TFunction } from "i18next";

/* i18n-aware Zod schemas that mirror the shared-package constraints.
   Schemas are built by a factory taking the i18n `t` function so validation
   messages are localized. */

export type SchemaMessages = TFunction;

export function buildSchemas(t: SchemaMessages) {
  const email = z.string().email(t("validation.invalidEmail"));
  const required = (message?: string) =>
    z.string().min(1, message ?? t("validation.required"));
  const num = (label: string, min: number, max: number) => {
    const fieldLabel = t(`fields.${label}`, { defaultValue: label });
    return z.coerce
      .number()
      .min(min, t("validation.rangeMin", { field: fieldLabel, value: min }))
      .max(max, t("validation.rangeMax", { field: fieldLabel, value: max }))
      .refine((v) => !isNaN(v), t("validation.invalidNumber"));
  };

  return {
    login: z.object({
      email,
      password: z.string().min(6, t("validation.minLength", { n: 6 })),
    }),

    register: z.object({
      name: required().min(2, t("validation.minLength", { n: 2 })).max(100),
      email,
      password: z
        .string()
        .min(8, t("validation.minLength", { n: 8 }))
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          t("validation.passwordStrength")
        ),
      role: z.nativeEnum(UserRole),
      phone: z.string().optional(),
      language: z.nativeEnum(Language).default(Language.EN),
    }),

    pregnancyProfile: z.object({
      lmp: z
        .string()
        .min(1, t("validation.required"))
        .refine((val) => !isNaN(Date.parse(val)), t("validation.invalidDate")),
      gravida: z.coerce.number().min(0).max(20).optional(),
      para: z.coerce.number().min(0).max(20).optional(),
      medicalHistory: z.array(z.string()).optional(),
      riskFactors: z.array(z.string()).optional(),
    }),

    healthMetric: z.object({
      systolicBP: num("bp.systolic", 60, 300).optional(),
      diastolicBP: num("bp.diastolic", 30, 200).optional(),
      weight: num("health.weight", 30, 200).optional(),
      glucose: num("health.glucose", 30, 500).optional(),
      heartRate: num("health.heartRate", 40, 200).optional(),
      temperature: num("health.temperature", 35, 42).optional(),
      hemoglobin: num("health.hemoglobin", 3, 20).optional(),
      date: z.string().optional(),
    }),

    symptom: z.object({
      symptoms: z
        .array(z.string())
        .min(1, t("validation.atLeastOneSymptom")),
      severity: z
        .string()
        .min(1, t("validation.required"))
        .refine((v) => ["mild", "moderate", "severe", "critical"].includes(v)),
      notes: z.string().max(500, t("validation.maxLength", { n: 500 })).optional(),
      date: z.string().optional(),
    }),

    moodEntry: z.object({
      journalText: z
        .string()
        .min(1, t("validation.required"))
        .max(2000, t("validation.maxLength", { n: 2000 })),
    }),

    maternalRisk: z.object({
      user: z.string().min(1, t("validation.required")),
      age: num("maternal.age", 10, 100),
      systolicBP: num("bp.systolic", 50, 300),
      diastolicBP: num("bp.diastolic", 20, 200),
      bloodSugar: num("health.glucose", 20, 500),
      bodyTemp: num("health.temperature", 33, 43),
      heartRate: num("health.heartRate", 30, 250),
      bmi: num("maternal.bmi", 10, 60),
      gestationalWeek: num("pregnancy.week", 1, 42),
      hemoglobin: num("health.hemoglobin", 2, 25).optional(),
    }),

    gdm: z.object({
      user: z.string().min(1, t("validation.required")),
      age: num("maternal.age", 10, 100),
      bmi: num("maternal.bmi", 10, 60),
      fastingGlucose: num("health.fastingGlucose", 20, 500),
      postprandialGlucose: num("health.postprandialGlucose", 20, 700).optional(),
      hba1c: num("health.hba1c", 3, 15).optional(),
      gestationalWeek: num("pregnancy.week", 1, 42),
      familyHistoryDiabetes: z.boolean().optional().default(false),
      previousGDM: z.boolean().optional().default(false),
    }),

    ppd: z.object({
      user: z.string().min(1, t("validation.required")),
      edinburghAnswers: z
        .array(z.coerce.number().min(0).max(3))
        .length(10, t("validation.epdsExact")),
      screeningText: z
        .string()
        .max(5000, t("validation.maxLength", { n: 5000 }))
        .optional(),
    }),

    chatMessage: z.object({
      conversationId: z.string().optional(),
      message: z
        .string()
        .min(1, t("validation.required"))
        .max(2000, t("validation.maxLength", { n: 2000 })),
    }),

    appointment: z.object({
      patient: z.string().min(1, t("validation.required")),
      doctor: z.string().optional(),
      asha: z.string().optional(),
      date: z
        .string()
        .min(1, t("validation.required"))
        .refine((val) => !isNaN(Date.parse(val)), t("validation.invalidDate")),
      time: z
        .string()
        .regex(/^\d{2}:\d{2}$/, t("validation.invalidTime")),
      type: required(t("validation.appointmentTypeRequired")),
      notes: z
        .string()
        .max(500, t("validation.maxLength", { n: 500 }))
        .optional(),
    }),

    referral: z.object({
      patient: z.string().min(1, t("validation.required")),
      referredTo: z.string().optional(),
      facility: z
        .string()
        .max(200, t("validation.maxLength", { n: 200 }))
        .optional(),
      reason: required().max(1000, t("validation.maxLength", { n: 1000 })),
      notes: z
        .string()
        .max(1000, t("validation.maxLength", { n: 1000 }))
        .optional(),
    }),

    recommendation: z.object({
      category: required(),
      title: required().max(200, t("validation.maxLength", { n: 200 })),
      content: required().max(2000, t("validation.maxLength", { n: 2000 })),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      source: z.string().max(200).optional(),
    }),

    alert: z.object({
      type: required(),
      severity: z.enum(["info", "warning", "urgent", "critical"]),
      title: required().max(200, t("validation.maxLength", { n: 200 })),
      message: required().max(2000, t("validation.maxLength", { n: 2000 })),
    }),

    dietPlan: z.object({
      title: required().max(200, t("validation.maxLength", { n: 200 })),
      description: required().max(1000, t("validation.maxLength", { n: 1000 })),
      meals: z
        .array(
          z.object({
            name: required().max(200),
            items: z.array(z.string().min(1, t("validation.required"))).min(1),
            notes: z.string().max(500).optional(),
          })
        )
        .min(1, t("validation.atLeastOneMeal")),
      nutritionalNotes: required().max(
        2000,
        t("validation.maxLength", { n: 2000 })
      ),
    }),

    educationContent: z.object({
      title: z.object({
        en: required().min(1),
        hi: required().min(1),
        kn: required().min(1),
      }),
      body: z.object({
        en: required().min(1),
        hi: required().min(1),
        kn: required().min(1),
      }),
      category: required(),
      tags: z.array(z.string()).optional(),
    }),
  };
}

export type LocalizedSchemas = ReturnType<typeof buildSchemas>;