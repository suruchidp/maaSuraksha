import { httpGet, httpPost, httpPatch, httpList } from "@/lib/api";
import { RecommendationDTO } from "@/lib/types";
import type { RecommendationInput } from "@maasuraksha/shared";

export async function createRecommendation(
  input: RecommendationInput,
  userId?: string
) {
  return httpPost<RecommendationDTO>(
    "/recommendations",
    input,
    userId ? { params: { userId } } : undefined
  );
}

export async function listRecommendations(params?: Record<string, unknown>) {
  return httpList<RecommendationDTO>("/recommendations", params);
}

export async function getRecommendation(id: string) {
  return httpGet<RecommendationDTO>(`/recommendations/${id}`);
}

export async function markRecommendationRead(id: string, read = true) {
  return httpPatch<RecommendationDTO>(`/recommendations/${id}/read`, { read });
}