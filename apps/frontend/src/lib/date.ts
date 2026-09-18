import { Language } from "@maasuraksha/shared";

const LOCALE_MAP: Record<Language, string> = {
  [Language.EN]: "en-IN",
  [Language.HI]: "hi-IN",
  [Language.KN]: "kn-IN",
};

export function localeFor(language: Language): string {
  return LOCALE_MAP[language] ?? LOCALE_MAP.en;
}

export function formatDate(
  date: string | Date | undefined | null,
  language: Language = Language.EN
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(localeFor(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(
  date: string | Date | undefined | null,
  language: Language = Language.EN
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(localeFor(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function toLocalInputDate(date?: string | Date | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/** A stored calendar date must not shift with the browser's timezone. */
export function formatCalendarDate(date: string, language: Language = Language.EN): string {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat(localeFor(language), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
}
