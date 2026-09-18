import { Trimester } from "./types";
import { validAppointmentDate, appointmentToday } from "./appointmentTime";
const DAY = 86400000;
/** Calendar dates, not elapsed local-time hours. Gestational weeks are completed weeks. */
export function pregnancyAge(
  lmp: Date | string,
  now = new Date(),
  endedOn?: Date | string | null,
) {
  const start = (lmp instanceof Date ? lmp.toISOString() : lmp).slice(0, 10);
  const today = endedOn
    ? (endedOn instanceof Date ? endedOn.toISOString() : endedOn).slice(0, 10)
    : appointmentToday(now);
  if (!validAppointmentDate(start) || !validAppointmentDate(today))
    throw new Error("Invalid pregnancy date");
  const elapsedDays = Math.max(
    0,
    Math.floor((Date.parse(today) - Date.parse(start)) / DAY),
  );
  const weeks = Math.floor(elapsedDays / 7),
    days = elapsedDays % 7;
  const dueDate = new Date(Date.parse(start) + 280 * DAY)
    .toISOString()
    .slice(0, 10);
  const daysToDue = Math.floor((Date.parse(dueDate) - Date.parse(today)) / DAY);
  return {
    weeks,
    days,
    elapsedDays,
    dueDate,
    daysToDue,
    trimester:
      weeks < 14
        ? Trimester.FIRST
        : weeks < 28
          ? Trimester.SECOND
          : Trimester.THIRD,
    datingNeedsReview:
      elapsedDays > 294 || Date.parse(start) > Date.parse(today),
    asOf: today,
  };
}
export const PREGNANCY_MILESTONES = [
  {
    key: "antenatal_visit",
    fromWeek: 0,
    toWeek: 13,
    source: "https://www.acog.org/womens-health/faqs/prenatal-care",
  },
  {
    key: "anatomy_scan",
    fromWeek: 18,
    toWeek: 22,
    source: "https://www.acog.org/womens-health/faqs/ultrasound-exams",
  },
  {
    key: "gdm_screening",
    fromWeek: 24,
    toWeek: 28,
    source: "https://www.cdc.gov/diabetes/about/gestational-diabetes.html",
  },
  {
    key: "birth_plan",
    fromWeek: 28,
    toWeek: 39,
    source:
      "https://www.acog.org/womens-health/faqs/a-partners-guide-to-pregnancy",
  },
] as const;
