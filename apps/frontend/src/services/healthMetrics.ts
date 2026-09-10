import { httpGet, httpPost, httpList } from "@/lib/api";
import { HealthMetricDTO } from "@/lib/types";
import type { HealthMetricInput } from "@maasuraksha/shared";
import type { ListParams } from "@/lib/listParams";

export async function listHealthMetrics(params?: ListParams) {
  return httpList<HealthMetricDTO>("/health-metrics", params as Record<string, unknown>);
}

export async function createHealthMetric(input: HealthMetricInput, userId?: string) {
  return httpPost<HealthMetricDTO>(
    "/health-metrics",
    input,
    userId ? { params: { userId } } : undefined
  );
}

export async function getHealthMetric(id: string) {
  return httpGet<HealthMetricDTO>(`/health-metrics/${id}`);
}