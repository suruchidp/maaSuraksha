import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";

import { getPregnancy, upsertPregnancy } from "@/services/pregnancy";
import { listHealthMetrics, createHealthMetric } from "@/services/healthMetrics";
import { listSymptoms, createSymptom } from "@/services/symptoms";
import {
  createMaternalRisk,
  listMaternalRisk,
  latestMaternalRisk,
  createGDM,
  listGDM,
  latestGDM,
  createPPD,
  listPPD,
} from "@/services/assessments";
import { createMoodEntry, listMoodEntries } from "@/services/mood";
import {
  createRecommendation,
  listRecommendations,
  markRecommendationRead,
} from "@/services/recommendations";
import { createDietPlan, listDietPlans } from "@/services/dietPlans";
import { createAlert, listAlerts, updateAlertStatus } from "@/services/alerts";
import { createReferral, listReferrals, updateReferralStatus } from "@/services/referrals";
import { createAppointment, listAppointments, updateAppointmentStatus } from "@/services/appointments";
import { listEducation } from "@/services/education";
import {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
} from "@/services/chat";
import { createReport, listReports } from "@/services/reports";
import {
  getAdminOverview,
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  listAuditLogs,
} from "@/services/admin";

export const qk = {
  pregnancy: (userId?: string) => ["pregnancy", userId ?? "self"],
  metrics: (userId?: string) => ["metrics", userId ?? "self"],
  symptoms: (userId?: string) => ["symptoms", userId ?? "self"],
  maternal: (userId?: string) => ["maternal", userId ?? "self"],
  gdm: (userId?: string) => ["gdm", userId ?? "self"],
  ppd: (userId?: string) => ["ppd", userId ?? "self"],
  mood: (userId?: string) => ["mood", userId ?? "self"],
  recommendations: (userId?: string) => ["recommendations", userId ?? "self"],
  diet: (userId?: string) => ["diet", userId ?? "self"],
  alerts: (userId?: string) => ["alerts", userId ?? "self"],
  referrals: ["referrals"],
  appointments: (patientId?: string) => ["appointments", patientId ?? "all"],
  education: (params?: Record<string, unknown>) => ["education", params ?? {}],
  reports: ["reports"],
  patients: (search?: string) => ["patients", search ?? ""],
  conversations: ["chat", "conversations"],
  messages: (id: string) => ["chat", "messages", id],
  users: (params?: Record<string, unknown>) => ["admin", "users", params ?? {}],
  auditLogs: ["admin", "audit-logs"],
  overview: ["admin", "overview"],
};

export function usePatientContext() {
  const user = useAuthStore((s) => s.user);
  return user?.role === "PATIENT" ? (user.id ?? null) : null;
}

/* ---- Pregnancy ---- */
export function usePregnancy(targetUserId?: string) {
  const selfId = usePatientContext();
  const userId = targetUserId ?? selfId ?? undefined;
  return useQuery({
    queryKey: qk.pregnancy(userId),
    queryFn: () => getPregnancy(userId),
    retry: (count, error: unknown) => {
      // 404 = no profile yet
      const status = (error as { response?: { status?: number } })?.response?.status;
      return !(status === 404) && count < 1;
    },
  });
}

export function useUpsertPregnancy() {
  const qc = useQueryClient();
  const selfId = usePatientContext();
  return useMutation({
    mutationFn: ({ input, userId }: { input: unknown; userId?: string }) =>
      upsertPregnancy(input as never, userId ?? selfId ?? undefined),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: qk.pregnancy(vars.userId ?? selfId ?? undefined) });
    },
  });
}

/* ---- Health metrics ---- */
export function useHealthMetrics(targetUserId?: string, limit = 100) {
  const selfId = usePatientContext();
  const userId = targetUserId ?? selfId ?? undefined;
  return useQuery({
    queryKey: qk.metrics(userId),
    queryFn: () => listHealthMetrics({ page: 1, limit, userId }),
  });
}

export function useCreateHealthMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, userId }: { input: unknown; userId?: string }) =>
      createHealthMetric(input as never, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.metrics("self") });
      void qc.invalidateQueries({ queryKey: qk.metrics(undefined) });
    },
  });
}

/* ---- Symptoms ---- */
export function useSymptoms(targetUserId?: string, limit = 50) {
  const selfId = usePatientContext();
  const userId = targetUserId ?? selfId ?? undefined;
  return useQuery({
    queryKey: qk.symptoms(userId),
    queryFn: () => listSymptoms({ page: 1, limit, userId }),
  });
}

export function useCreateSymptom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, userId }: { input: unknown; userId?: string }) =>
      createSymptom(input as never, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.symptoms(undefined) });
    },
  });
}

/* ---- Assessments ---- */
export function useMaternalRiskHistory(targetUserId?: string, limit = 20) {
  const userId = targetUserId;
  return useQuery({
    queryKey: qk.maternal(userId ?? "self"),
    queryFn: () => listMaternalRisk({ page: 1, limit, userId }),
    enabled: Boolean(userId),
  });
}

export function useLatestMaternalRisk(userId?: string) {
  return useQuery({
    queryKey: ["maternal", "latest", userId],
    queryFn: () => latestMaternalRisk(userId!),
    enabled: Boolean(userId),
    retry: (count, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      return !(status === 404) && count < 1;
    },
  });
}

export function useCreateMaternalRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createMaternalRisk(input as never),
    onSuccess: (result, vars) => {
      const userId = (vars as { user?: string })?.user;
      void qc.invalidateQueries({ queryKey: qk.maternal(userId ?? "self") });
    },
  });
}

export function useGDMHistory(targetUserId?: string, limit = 20) {
  const userId = targetUserId;
  return useQuery({
    queryKey: qk.gdm(userId ?? "self"),
    queryFn: () => listGDM({ page: 1, limit, userId }),
    enabled: Boolean(userId),
  });
}

export function useLatestGDM(userId?: string) {
  return useQuery({
    queryKey: ["gdm", "latest", userId],
    queryFn: () => latestGDM(userId!),
    enabled: Boolean(userId),
    retry: (count, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      return !(status === 404) && count < 1;
    },
  });
}

export function useCreateGDM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createGDM(input as never),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: qk.gdm((vars as { user?: string })?.user ?? "self") });
    },
  });
}

export function usePPDHistory(targetUserId?: string, limit = 20) {
  const userId = targetUserId;
  return useQuery({
    queryKey: qk.ppd(userId ?? "self"),
    queryFn: () => listPPD({ page: 1, limit, userId }),
    enabled: Boolean(userId),
  });
}

export function useCreatePPD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createPPD(input as never),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: qk.ppd((vars as { user?: string })?.user ?? "self") });
    },
  });
}

/* ---- Mood ---- */
export function useMoodEntries(targetUserId?: string, limit = 50) {
  const selfId = usePatientContext();
  const userId = targetUserId ?? selfId ?? undefined;
  return useQuery({
    queryKey: qk.mood(userId),
    queryFn: () => listMoodEntries({ page: 1, limit, userId }),
  });
}

export function useCreateMoodEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, userId }: { input: unknown; userId?: string }) =>
      createMoodEntry(input as never, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.mood(undefined) });
    },
  });
}

/* ---- Recommendations ---- */
export function useRecommendations(targetUserId?: string, limit = 50) {
  const selfId = usePatientContext();
  const userId = targetUserId ?? selfId ?? undefined;
  return useQuery({
    queryKey: qk.recommendations(userId),
    queryFn: () => listRecommendations({ page: 1, limit, userId }),
  });
}

export function useCreateRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, userId }: { input: unknown; userId: string }) =>
      createRecommendation(input as never, userId),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: qk.recommendations(vars.userId) });
    },
  });
}

export function useMarkRecommendationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read?: boolean }) =>
      markRecommendationRead(id, read),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}

/* ---- Diet plans ---- */
export function useDietPlans(targetUserId?: string, limit = 20) {
  const selfId = usePatientContext();
  const userId = targetUserId ?? selfId ?? undefined;
  return useQuery({
    queryKey: qk.diet(userId),
    queryFn: () => listDietPlans({ page: 1, limit, userId }),
  });
}

export function useCreateDietPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, userId }: { input: unknown; userId: string }) =>
      createDietPlan(input as never, userId),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: qk.diet(vars.userId) });
    },
  });
}

/* ---- Alerts ---- */
export function useAlerts(targetUserId?: string, limit = 50) {
  const selfId = usePatientContext();
  const userId = targetUserId ?? selfId ?? undefined;
  return useQuery({
    queryKey: qk.alerts(userId),
    queryFn: () => listAlerts({ page: 1, limit, userId }),
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createAlert(input as never),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: qk.alerts((vars as { user?: string })?.user) });
    },
  });
}

export function useUpdateAlertStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAlertStatus(id, status as never),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

/* ---- Referrals ---- */
export function useReferrals(patientId?: string, limit = 50) {
  return useQuery({
    queryKey: ["referrals", patientId ?? "all"],
    queryFn: () => listReferrals({ page: 1, limit, patientId }),
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createReferral(input as never),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}

export function useUpdateReferralStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      updateReferralStatus(id, status as never, note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}

/* ---- Appointments ---- */
export function useAppointments(patientId?: string, limit = 50) {
  return useQuery({
    queryKey: qk.appointments(patientId),
    queryFn: () => listAppointments({ page: 1, limit, patientId }),
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createAppointment(input as never),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      updateAppointmentStatus(id, status as never, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

/* ---- Education ---- */
export function useEducation(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.education(params),
    queryFn: () => listEducation(params),
  });
}

/* ---- Patients (ASHA/DOCTOR/ADMIN) ---- */
export function usePatients(search?: string, limit = 100) {
  return useQuery({
    queryKey: qk.patients(search),
    queryFn: () => import("@/services/patients").then((m) => m.listAccessiblePatients({ limit, search })),
  });
}

/* ---- Chat ---- */
export function useConversations() {
  return useQuery({
    queryKey: qk.conversations,
    queryFn: () => listConversations({ page: 1, limit: 100 }),
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: qk.messages(conversationId),
    queryFn: () => listMessages(conversationId, { page: 1, limit: 200 }),
    enabled: Boolean(conversationId),
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => createConversation(title),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.conversations }),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => sendMessage(conversationId, message),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.messages(conversationId) }),
  });
}

/* ---- Reports ---- */
export function useReports(limit = 50) {
  return useQuery({
    queryKey: qk.reports,
    queryFn: () => listReports({ page: 1, limit }),
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, userId }: { input: unknown; userId: string }) =>
      createReport(input as never, userId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.reports }),
  });
}

/* ---- Admin ---- */
export function useAdminOverview() {
  return useQuery({ queryKey: qk.overview, queryFn: getAdminOverview });
}

export function useAdminUsers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.users(params),
    queryFn: () => listAdminUsers({ page: 1, limit: 100, ...params }),
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createAdminUser(input as never),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: unknown }) =>
      updateAdminUser(id, patch as never),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useAuditLogs(limit = 100) {
  return useQuery({
    queryKey: qk.auditLogs,
    queryFn: () => listAuditLogs({ page: 1, limit }),
  });
}

/* ---- Education admin mutations ---- */
export function useCreateEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      import("@/services/education").then((m) => m.createEducationContent(input as never)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["education"] }),
  });
}

export function useUpdateEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: unknown }) =>
      import("@/services/education").then((m) => m.updateEducationContent(id, patch as never)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["education"] }),
  });
}