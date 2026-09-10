import { httpGet, httpPost, httpList } from "@/lib/api";
import { DietPlanDTO } from "@/lib/types";
import type { DietPlanInput } from "@maasuraksha/shared";

export async function createDietPlan(input: DietPlanInput, userId?: string) {
  return httpPost<DietPlanDTO>(
    "/diet-plans",
    input,
    userId ? { params: { userId } } : undefined
  );
}

export async function listDietPlans(params?: Record<string, unknown>) {
  return httpList<DietPlanDTO>("/diet-plans", params);
}

export async function getDietPlan(id: string) {
  return httpGet<DietPlanDTO>(`/diet-plans/${id}`);
}