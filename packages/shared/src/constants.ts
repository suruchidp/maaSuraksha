export const API_PREFIX = "/api/v1" as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

export const RISK_FACTORS = {
  maternal: [
    "age_under_18",
    "age_over_35",
    "bmi_under_18",
    "bmi_over_30",
    "previous_c_section",
    "previous_miscarriage",
    "gestational_diabetes",
    "preeclampsia_history",
    "hypertension",
    "anemia",
    "multiple_pregnancy",
  ],
  gdm: [
    "family_history_diabetes",
    "previous_gdm",
    "bmi_over_30",
    "age_over_35",
    "pcos",
    "ethnicity_high_risk",
    "previous_large_baby",
  ],
  ppd: [
    "previous_depression",
    "family_history_depression",
    "stressful_life_events",
    "lack_of_support",
    "complicated_pregnancy",
    "difficult_delivery",
    "premature_birth",
    "infant_health_problems",
  ],
} as const;

export const COMMON_SYMPTOMS = [
  "headache",
  "blurred_vision",
  "swelling",
  "abdominal_pain",
  "vaginal_bleeding",
  "reduced_fetal_movement",
  "fever",
  "nausea",
  "vomiting",
  "dizziness",
  "shortness_of_breath",
  "chest_pain",
  "leg_cramps",
  "backache",
  "insomnia",
  "fatigue",
  "mood_swings",
  "urinary_issues",
  "constipation",
  "heartburn",
  "fluid_leaking", "fainting", "self_harm_thoughts", "fever_38",
  "extreme_face_hand_swelling", "persistent_severe_headache", "persistent_severe_belly_pain",
  "unable_to_keep_fluids", "painful_swollen_leg",
] as const;

export const EDUCATIONAL_CATEGORIES = [
  "pregnancy",
  "nutrition",
  "exercise",
  "mental_health",
  "labor_delivery",
  "postpartum",
  "breastfeeding",
  "baby_care",
  "warning_signs",
] as const;

export const RECOMMENDATION_CATEGORIES = [
  "nutrition",
  "exercise",
  "rest",
  "medical",
  "mental_health",
  "general",
  "warning",
] as const;

export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];

export const RECOMMENDATION_PRIORITIES = ["low", "medium", "high"] as const;

export type RecommendationPriority = (typeof RECOMMENDATION_PRIORITIES)[number];

export const DIET_MEAL_PREFERENCES = [
  "vegetarian",
  "eggitarian",
  "non_vegetarian",
] as const;

export type DietMealPreference = (typeof DIET_MEAL_PREFERENCES)[number];

export const DIET_REGIONS = [
  "north",
  "south",
  "east",
  "west",
  "other",
] as const;

export type DietRegion = (typeof DIET_REGIONS)[number];

/** Intents emitted by the diet guidance engine (one persisted record per intent). */
export const DIET_GUIDANCE_INTENTS = [
  "stage",
  "stage-missing",
  "high-risk",
  "gdm",
  "metrics",
  "symptom",
  "meals",
] as const;

export type DietGuidanceIntent = (typeof DIET_GUIDANCE_INTENTS)[number];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
