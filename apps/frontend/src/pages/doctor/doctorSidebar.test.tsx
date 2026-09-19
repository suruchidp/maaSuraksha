import { describe, expect, it } from "vitest";
import { DOCTOR_NAV_ITEMS } from "@/components/layout/AppLayout";

describe("Doctor navigation", () => {
  it("contains all 16 required doctor sidebar items in order", () => {
    const labels = DOCTOR_NAV_ITEMS.map((item) => item.labelKey);

    expect(labels).toEqual([
      "nav.dashboard",
      "nav.patients",
      "nav.appointments",
      "nav.highRisk",
      "nav.assessments",
      "nav.vitals",
      "nav.investigations",
      "nav.carePlans",
      "nav.referrals",
      "nav.ashaCoordination",
      "nav.deliveryPlanning",
      "nav.followUps",
      "nav.notifications",
      "nav.healthEducation",
      "nav.reportsAnalytics",
      "nav.profileSettings",
    ]);
  });

  it("includes the expected doctor routes for all sidebar entries", () => {
    expect(DOCTOR_NAV_ITEMS.map((item) => item.to)).toEqual([
      "/doctor/dashboard",
      "/doctor/patients",
      "/doctor/appointments",
      "/doctor/high-risk",
      "/doctor/assessments",
      "/doctor/vitals",
      "/doctor/investigations",
      "/doctor/care-plans",
      "/doctor/referrals",
      "/doctor/asha",
      "/doctor/delivery",
      "/doctor/follow-ups",
      "/doctor/notifications",
      "/doctor/education",
      "/doctor/reports",
      "/doctor/profile",
    ]);
  });
});
