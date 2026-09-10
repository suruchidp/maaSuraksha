import { httpGet, httpPost, httpList } from "@/lib/api";
import { PregnancyProfileDTO } from "@/lib/types";
import type { PregnancyProfileInput } from "@maasuraksha/shared";

export async function getPregnancy(userId?: string) {
  return httpGet<PregnancyProfileDTO>(
    "/pregnancy",
    userId ? { userId } : undefined
  );
}

export async function upsertPregnancy(
  input: PregnancyProfileInput,
  userId?: string
) {
  return httpPost<PregnancyProfileDTO>(
    "/pregnancy",
    input,
    userId ? { params: { userId } } : undefined
  );
}

export async function listPregnancies(params: Record<string, unknown>) {
  return httpList<PregnancyProfileDTO>("/pregnancy", params);
}