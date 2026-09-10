import { httpGet, httpPost, httpList } from "@/lib/api";
import { ReportDTO } from "@/lib/types";
import type { ReportInput } from "@maasuraksha/shared";

export async function createReport(input: ReportInput, userId?: string) {
  return httpPost<ReportDTO>(
    "/reports",
    input,
    userId ? { params: { userId } } : undefined
  );
}

export async function listReports(params?: Record<string, unknown>) {
  return httpList<ReportDTO>("/reports", params);
}

export async function getReport(id: string) {
  return httpGet<ReportDTO>(`/reports/${id}`);
}