import { httpGet, httpPost, httpPatch, httpList } from "@/lib/api";
import {
  AdminOverviewDTO,
  AuditLogDTO,
  UserDTO,
} from "@/lib/types";
import type { RegisterInput } from "@maasuraksha/shared";

export async function getAdminOverview() {
  return httpGet<AdminOverviewDTO>("/admin/overview");
}

export async function listAdminUsers(params?: Record<string, unknown>) {
  return httpList<UserDTO>("/admin/users", params);
}

export async function updateAdminUser(
  id: string,
  input: {
    role?: string;
    isActive?: boolean;
    assignedASHA?: string | null;
    assignedDoctor?: string | null;
  }
) {
  return httpPatch<UserDTO>(`/admin/users/${id}`, input);
}

export async function createAdminUser(input: RegisterInput) {
  return httpPost<UserDTO>("/admin/users", input);
}

export async function listAuditLogs(params?: Record<string, unknown>) {
  return httpList<AuditLogDTO>("/admin/audit-logs", params);
}