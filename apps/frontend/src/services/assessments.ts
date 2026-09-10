import { httpGet, httpPost, httpList } from "@/lib/api";
import {
  MaternalRiskDTO,
  GDMAssessmentDTO,
  PPDAssessmentDTO,
} from "@/lib/types";
import type {
  MaternalRiskAssessmentInput,
  GDMAssessmentInput,
  PPDAssessmentInput,
} from "@maasuraksha/shared";

export async function createMaternalRisk(input: MaternalRiskAssessmentInput) {
  return httpPost<MaternalRiskDTO>("/assessments/maternal-risk", input);
}

export async function listMaternalRisk(params?: Record<string, unknown>) {
  return httpList<MaternalRiskDTO>("/assessments/maternal-risk", params);
}

export async function latestMaternalRisk(userId: string) {
  return httpGet<MaternalRiskDTO>(`/assessments/maternal-risk/latest/${userId}`);
}

export async function createGDM(input: GDMAssessmentInput) {
  return httpPost<GDMAssessmentDTO>("/assessments/gdm", input);
}

export async function listGDM(params?: Record<string, unknown>) {
  return httpList<GDMAssessmentDTO>("/assessments/gdm", params);
}

export async function latestGDM(userId: string) {
  return httpGet<GDMAssessmentDTO>(`/assessments/gdm/latest/${userId}`);
}

export async function createPPD(input: PPDAssessmentInput) {
  return httpPost<PPDAssessmentDTO>("/assessments/ppd", input);
}

export async function listPPD(params?: Record<string, unknown>) {
  return httpList<PPDAssessmentDTO>("/assessments/ppd", params);
}

export async function latestPPD(userId: string) {
  return httpGet<PPDAssessmentDTO>(`/assessments/ppd/latest/${userId}`);
}