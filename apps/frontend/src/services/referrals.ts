import { httpGet, httpPost, httpPatch, httpList } from "@/lib/api";
import { ReferralDTO } from "@/lib/types";
import type { ReferralInput, ReferralStatus } from "@maasuraksha/shared";

export async function createReferral(input: ReferralInput) {
  return httpPost<ReferralDTO>("/referrals", input);
}

export async function listReferrals(params?: Record<string, unknown>) {
  return httpList<ReferralDTO>("/referrals", params);
}

export async function getReferral(id: string) {
  return httpGet<ReferralDTO>(`/referrals/${id}`);
}

export async function updateReferralStatus(
  id: string,
  status: ReferralStatus,
  note?: string
) {
  return httpPatch<ReferralDTO>(`/referrals/${id}/status`, { status, note });
}