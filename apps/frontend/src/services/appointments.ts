import { httpGet, httpPost, httpPatch, httpList } from "@/lib/api";
import { AppointmentDTO } from "@/lib/types";
import type { AppointmentInput, AppointmentStatus } from "@maasuraksha/shared";

export async function createAppointment(input: AppointmentInput) {
  return httpPost<AppointmentDTO>("/appointments", input);
}

export async function listAppointments(params?: Record<string, unknown>) {
  return httpList<AppointmentDTO>("/appointments", params);
}

export async function getAppointment(id: string) {
  return httpGet<AppointmentDTO>(`/appointments/${id}`);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  cancelledReason?: string
) {
  return httpPatch<AppointmentDTO>(`/appointments/${id}/status`, {
    status,
    cancelledReason,
  });
}