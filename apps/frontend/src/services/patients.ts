import { httpList } from "@/lib/api";
import { UserDTO } from "@/lib/types";

export async function listAccessiblePatients(
  params?: Record<string, unknown>
) {
  return httpList<UserDTO>("/patients", params);
}