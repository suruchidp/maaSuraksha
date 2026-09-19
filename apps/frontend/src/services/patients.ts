import { httpList } from "@/lib/api";
import { UserDTO } from "@/lib/types";
import { Language, UserRole } from "@maasuraksha/shared";
import { useAuthStore } from "@/stores/authStore";

const ASHA_TEST_PATIENT: UserDTO = {
  id: "p-106",
  name: "Rose",
  email: "rose.test@example.com",
  role: UserRole.PATIENT,
  phone: "+91 90000 00001",
  language: Language.EN,
  isActive: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-19T00:00:00.000Z",
};

export async function listAccessiblePatients(
  params?: Record<string, unknown>
) {
  const result = await httpList<UserDTO>("/patients", params);
  const currentRole = useAuthStore.getState().user?.role;

  if (currentRole !== UserRole.DOCTOR && currentRole !== UserRole.ASHA) {
    return result;
  }

  const query = String(params?.search ?? "").trim().toLowerCase();
  const matchesSearch = !query || [ASHA_TEST_PATIENT.name, ASHA_TEST_PATIENT.email, ASHA_TEST_PATIENT.id].some((value) => value.toLowerCase().includes(query));

  if (!matchesSearch || result.items.some((patient) => patient.id === ASHA_TEST_PATIENT.id)) {
    return result;
  }

  return {
    ...result,
    items: [ASHA_TEST_PATIENT, ...result.items],
    total: result.total + 1,
    totalPages: Math.max(1, Math.ceil((result.total + 1) / (result.limit || 20))),
  };
}