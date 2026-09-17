import { httpGet, httpPost, httpPatch, httpList } from "@/lib/api";
import { EducationalContentDTO } from "@/lib/types";
import type { EducationalContentInput } from "@maasuraksha/shared";

export async function listEducation(params?: Record<string, unknown>) {
  const { manage, ...query } = params ?? {};
  return httpList<EducationalContentDTO>(manage ? "/education/manage" : "/education", query);
}

export async function getEducation(id: string, lang?: string) {
  return httpGet<EducationalContentDTO>(
    `/education/${id}`,
    lang ? { lang } : undefined
  );
}

export async function createEducationContent(input: EducationalContentInput) {
  return httpPost<EducationalContentDTO>("/education", input);
}

export async function updateEducationContent(
  id: string,
  input: Partial<EducationalContentInput> & { isActive?: boolean }
) {
  return httpPatch<EducationalContentDTO>(`/education/${id}`, input);
}