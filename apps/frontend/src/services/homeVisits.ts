import { httpList, httpPost, httpPatch } from "@/lib/api";
import { HomeVisitDTO } from "@/lib/types";

export interface HomeVisitRequestInput {
  patient: string;
  reason: string;
  preferredDate: string;
  preferredTime: string;
}

export interface HomeVisitActionInput {
  visitId: string;
  scheduledDate?: string;
  scheduledTime?: string;
  visitNotes?: string;
  followUpNeeded?: boolean;
  cancelledReason?: string;
  reason?: string;
}

export async function requestHomeVisit(input: HomeVisitRequestInput) {
  return httpPost<HomeVisitDTO>("/home-visits", input);
}

export async function listHomeVisits(params?: Record<string, unknown>) {
  return httpList<HomeVisitDTO>("/home-visits", params);
}

export async function scheduleHomeVisit(input: HomeVisitActionInput) {
  return httpPatch<HomeVisitDTO>(`/home-visits/${input.visitId}/schedule`, {
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    visitNotes: input.visitNotes,
  });
}

export async function completeHomeVisit(input: HomeVisitActionInput) {
  return httpPatch<HomeVisitDTO>(`/home-visits/${input.visitId}/complete`, {
    visitNotes: input.visitNotes,
    followUpNeeded: input.followUpNeeded,
  });
}

export async function cancelHomeVisit(input: HomeVisitActionInput) {
  return httpPatch<HomeVisitDTO>(`/home-visits/${input.visitId}/cancel`, {
    cancelledReason: input.cancelledReason,
  });
}

export async function escalateHomeVisit(input: HomeVisitActionInput) {
  return httpPatch<HomeVisitDTO>(`/home-visits/${input.visitId}/escalate`, {
    reason: input.reason,
  });
}