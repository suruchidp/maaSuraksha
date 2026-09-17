import { httpGet, httpPatch } from "@/lib/api";
import type {
  DietGuidanceDTO,
  DietGuidancePreferencesDTO,
} from "@/lib/types";
import type {
  DietMealPreference,
  DietRegion,
  DietGuidancePreferencesInput,
} from "@maasuraksha/shared";

export interface DietGuidanceResponse {
  guidance: DietGuidanceDTO[];
  preferences: DietGuidancePreferencesDTO | null;
}

export async function getDietGuidance(userId?: string) {
  return httpGet<DietGuidanceResponse>(
    "/diet-guidance",
    userId ? { userId } : undefined
  );
}

export async function getDietGuidancePreferences(userId?: string) {
  return httpGet<DietGuidancePreferencesDTO | null>(
    "/diet-guidance/preferences",
    userId ? { userId } : undefined
  );
}

export async function updateDietGuidancePreferences(
  input: Pick<DietGuidancePreferencesInput, "mealPreference" | "region">
) {
  return httpPatch<DietGuidancePreferencesDTO>(
    "/diet-guidance/preferences",
    input as never
  );
}

export interface DietPreferenceOption {
  value: DietMealPreference;
  labelKey: string;
}

export interface DietRegionOption {
  value: DietRegion;
  labelKey: string;
}

export const DIET_PREFERENCE_OPTIONS: DietPreferenceOption[] = [
  { value: "vegetarian", labelKey: "diet.preferenceLabel.vegetarian" },
  { value: "eggitarian", labelKey: "diet.preferenceLabel.eggitarian" },
  { value: "non_vegetarian", labelKey: "diet.preferenceLabel.non_vegetarian" },
];

export const DIET_REGION_OPTIONS: DietRegionOption[] = [
  { value: "north", labelKey: "diet.regionLabel.north" },
  { value: "south", labelKey: "diet.regionLabel.south" },
  { value: "east", labelKey: "diet.regionLabel.east" },
  { value: "west", labelKey: "diet.regionLabel.west" },
  { value: "other", labelKey: "diet.regionLabel.other" },
];