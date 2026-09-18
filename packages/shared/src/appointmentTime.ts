export const APPOINTMENT_TIME_ZONE = "Asia/Kolkata";

export function validAppointmentDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function appointmentStart(date: string | Date, time: string): Date {
  const day = typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  return new Date(`${day}T${time}:00+05:30`);
}

export function appointmentToday(now = new Date()): string {
  return new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
}
