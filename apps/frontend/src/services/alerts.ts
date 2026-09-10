import { httpGet, httpPost, httpPatch, httpList } from "@/lib/api";
import { AlertDTO } from "@/lib/types";
import type { AlertInput, AlertStatus } from "@maasuraksha/shared";

export async function createAlert(
  input: Omit<AlertInput, "user"> & { user: string },
  params?: Record<string, unknown>
) {
  return httpPost<AlertDTO>("/alerts", input, params);
}

export async function listAlerts(params?: Record<string, unknown>) {
  return httpList<AlertDTO>("/alerts", params);
}

export async function getAlert(id: string) {
  return httpGet<AlertDTO>(`/alerts/${id}`);
}

export async function updateAlertStatus(id: string, status: AlertStatus) {
  return httpPatch<AlertDTO>(`/alerts/${id}/status`, { status });
}