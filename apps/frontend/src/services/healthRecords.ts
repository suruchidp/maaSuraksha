import { httpList, httpPost, httpPatch } from "@/lib/api";
import type { HealthRecordInput } from "@maasuraksha/shared";
export interface HealthRecordDTO extends Omit<HealthRecordInput, "date"> {
  id: string;
  user: string;
  date: string;
  recordedBy: string;
  authorRole: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
export const listHealthRecords = (params: Record<string, unknown>) =>
  httpList<HealthRecordDTO>("/health-records", params);
export const createHealthRecord = (input: HealthRecordInput, userId?: string) =>
  httpPost<HealthRecordDTO>("/health-records", input, { params: { userId } });
export const updateHealthRecord = (
  id: string,
  input: Partial<HealthRecordInput> & {
    updatedAt: string;
    isArchived?: boolean;
  },
) => httpPatch<HealthRecordDTO>(`/health-records/${id}`, input);
