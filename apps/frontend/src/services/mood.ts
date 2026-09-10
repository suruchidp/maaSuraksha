import { httpGet, httpPost, httpList } from "@/lib/api";
import { MoodEntryDTO } from "@/lib/types";
import type { MoodEntryInput } from "@maasuraksha/shared";

export async function createMoodEntry(input: MoodEntryInput, userId?: string) {
  return httpPost<MoodEntryDTO>(
    "/mood",
    input,
    userId ? { params: { userId } } : undefined
  );
}

export async function listMoodEntries(params?: Record<string, unknown>) {
  return httpList<MoodEntryDTO>("/mood", params);
}

export async function getMoodEntry(id: string) {
  return httpGet<MoodEntryDTO>(`/mood/${id}`);
}