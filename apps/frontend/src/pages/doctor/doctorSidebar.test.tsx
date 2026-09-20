import { describe, expect, it } from "vitest";
import { ASHA_NAV_ITEMS, DOCTOR_NAV_ITEMS } from "@/components/layout/AppLayout";

describe("Doctor navigation", () => {
  it("contains the required doctor sidebar items in order", () => {
    expect(ASHA_NAV_ITEMS).toBeDefined();
    expect(DOCTOR_NAV_ITEMS.map((item) => item.labelKey)).toEqual([
      "nav.dashboard",
      "nav.patients",
      "nav.highRisk",
      "nav.appointments",
      "nav.reports",
      "nav.profile",
    ]);
  });

  it("includes the expected doctor routes for all sidebar entries", () => {
    expect(DOCTOR_NAV_ITEMS.map((item) => item.to)).toEqual([
      "/doctor/dashboard",
      "/doctor/patients",
      "/doctor/high-risk",
      "/doctor/appointments",
      "/doctor/reports",
      "/doctor/profile",
    ]);
  });
});

describe("ASHA navigation", () => {
  it("contains the required ASHA sidebar items in order", () => {
    expect(ASHA_NAV_ITEMS.map((item) => item.labelKey)).toEqual([
      "nav.dashboard",
      "nav.assignedWomen",
      "nav.followUps",
      "nav.referrals",
      "nav.profile",
    ]);
  });

  it("includes the expected ASHA routes for all sidebar entries", () => {
    expect(ASHA_NAV_ITEMS.map((item) => item.to)).toEqual([
      "/asha/dashboard",
      "/asha/patients",
      "/asha/follow-ups",
      "/asha/referrals",
      "/asha/profile",
    ]);
  });
});