import { httpGet, httpPost, httpList } from "@/lib/api";
import { SymptomDTO } from "@/lib/types";
import type { SymptomInput } from "@maasuraksha/shared";
import type { ListParams } from "@/lib/listParams";

export async function listSymptoms(params?: ListParams) {
  return httpList<SymptomDTO>("/symptoms", params as Record<string, unknown>);
}

export async function createSymptom(input: SymptomInput, userId?: string) {
  return httpPost<SymptomDTO>(
    "/symptoms",
    input,
    userId ? { params: { userId } } : undefined
  );
}

export async function getSymptom(id: string) {
  return httpGet<SymptomDTO>(`/symptoms/${id}`);
}