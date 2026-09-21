import { httpGet } from "@/lib/api";

export interface DoctorDirectoryEntry {
  id: string;
  name: string;
}

export async function listDoctors() {
  return httpGet<DoctorDirectoryEntry[]>("/users/doctors");
}