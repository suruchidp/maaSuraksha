import { Alert } from "../models/Alert";
import { HealthMetric } from "../models/HealthMetric";
import { PregnancyProfile } from "../models/PregnancyProfile";
import { MaternalRiskAssessment } from "../models/MaternalRiskAssessment";
import { GDMAssessment } from "../models/GDMAssessment";
import { Appointment } from "../models/Appointment";
import { AlertSeverity } from "@maasuraksha/shared";

export interface Signal {
 rule: string; type: string; severity: AlertSeverity; title: string; message: string; key: string;
}
export interface AlertContext {
 user: string;
 metric?: { _id: unknown; date: Date; systolicBP?: number; diastolicBP?: number } | null;
 pregnancy?: { _id: unknown; expectedDueDate: Date; isHighRisk: boolean } | null;
 maternal?: { _id: unknown; status: string; riskLevel?: string } | null;
 gdm?: { _id: unknown; status: string; riskLevel?: string } | null;
 appointments?: { _id: unknown; date: Date; time: string; status: string }[];
}
export function evaluateAlerts(ctx: AlertContext, now = new Date()): Signal[] {
 const signals: Signal[] = [];
 const add = (rule: string, type: string, severity: AlertSeverity, title: string, message: string, key: string) => signals.push({ rule, type, severity, title, message, key });
 const metric = ctx.metric;
 // NICE NG133: raised BP >=140 systolic OR >=90 diastolic; severe >=160 OR >=110.
 // Only readings from the last 24 hours produce current notifications. No diagnosis is inferred.
 if (metric && now.getTime() - metric.date.getTime() >= 0 && now.getTime() - metric.date.getTime() <= 86400000) {
  const severe = (metric.systolicBP ?? 0) >= 160 || (metric.diastolicBP ?? 0) >= 110;
  const raised = (metric.systolicBP ?? 0) >= 140 || (metric.diastolicBP ?? 0) >= 90;
  if (raised) add('blood-pressure', 'vitals', severe ? AlertSeverity.URGENT : AlertSeverity.WARNING,
   severe ? 'Urgent blood pressure review' : 'Blood pressure review needed',
   severe ? 'A recorded blood pressure is in the severe range. Seek urgent medical assessment now. This alert is not a diagnosis.' : 'A recorded blood pressure is raised. Contact your maternity care team promptly for review. This alert is not a diagnosis.',
   `bp:${severe ? 'severe' : 'raised'}:${metric.date.toISOString().slice(0,10)}`);
 }
 for (const [kind, assessment] of [['maternal', ctx.maternal], ['gdm', ctx.gdm]] as const) {
  if (assessment?.status === 'completed' && ['high','critical','medium','moderate'].includes(assessment.riskLevel ?? '')) {
   const high = ['high','critical'].includes(assessment.riskLevel!);
   add(`${kind}-risk`, 'assessment', assessment.riskLevel === 'critical' ? AlertSeverity.CRITICAL : high ? AlertSeverity.URGENT : AlertSeverity.WARNING,
    kind === 'gdm' ? 'GDM screening follow-up' : 'Maternal risk follow-up',
    `Your completed ${kind === 'gdm' ? 'GDM' : 'maternal'} assessment reports ${assessment.riskLevel} risk. ${high ? 'Contact your care team promptly.' : 'Arrange a review with your care team.'} A screening result is not a diagnosis.`,
    `${kind}:${assessment._id}:${assessment.riskLevel}`);
  }
 }
 const pregnancy = ctx.pregnancy;
 if (pregnancy?.isHighRisk) add('pregnancy-risk', 'follow_up', AlertSeverity.WARNING, 'Pregnancy care plan review', 'Your pregnancy profile records risk factors. Review your follow-up plan with your care team.', `pregnancy-risk:${pregnancy._id}`);
 if (pregnancy) {
  const days = Math.ceil((pregnancy.expectedDueDate.getTime() - now.getTime()) / 86400000);
  if (days >= 0 && days <= 7) add('due-date', 'follow_up', AlertSeverity.INFO, 'Estimated due date approaching', 'Your estimated due date is within one week. Confirm your birth and contact plan with your care team.', `due:${pregnancy.expectedDueDate.toISOString().slice(0,10)}`);
 }
 for (const appointment of ctx.appointments ?? []) {
  const time = new Date(`${appointment.date.toISOString().slice(0,10)}T${appointment.time}:00+05:30`);
  const remaining = time.getTime() - now.getTime();
  if (['scheduled','confirmed'].includes(appointment.status) && remaining >= 0 && remaining <= 86400000) add('appointment-reminder', 'appointment', AlertSeverity.INFO, 'Upcoming appointment', `Your appointment is on ${appointment.date.toISOString().slice(0,10)} at ${appointment.time} (India time). Check Appointments for details.`, `appointment:${appointment._id}`);
 }
 return signals;
}
export async function refreshPatientAlerts(user: string, now = new Date()) {
 const [metric, pregnancy, maternal, gdm, appointments, cancelled] = await Promise.all([
  HealthMetric.findOne({ user }).sort({ date: -1 }), PregnancyProfile.findOne({ user }),
  MaternalRiskAssessment.findOne({ user }).sort({ createdAt: -1 }), GDMAssessment.findOne({ user }).sort({ createdAt: -1 }),
  Appointment.find({ patient: user, status: { $in: ['scheduled','confirmed'] }, date: { $gte: new Date(now.getTime()-86400000), $lte: new Date(now.getTime()+2*86400000) } }),
  Appointment.find({ patient: user, status: 'cancelled' }).select('_id')
 ]);
 if (cancelled.length) await Alert.updateMany({ user, source: 'rules-v1:appointment-reminder', status: { $ne: 'resolved' }, dedupeKey: { $in: cancelled.map(item => 'appointment:' + item._id) } }, { $set: { status: 'resolved', readAt: now } });
 for (const signal of evaluateAlerts({ user, metric, pregnancy, maternal, gdm, appointments }, now)) {
  try {
   await Alert.updateOne({ user, dedupeKey: signal.key }, { $setOnInsert: { user, dedupeKey: signal.key, type: signal.type, severity: signal.severity, title: signal.title, message: signal.message, source: `rules-v1:${signal.rule}` } }, { upsert: true });
  } catch (error) {
   if ((error as { code?: number }).code !== 11000) throw error;
  }
 }
}

// Source writes already succeeded. A notification failure must not report the source as unsaved.
// The durable source is retried by the worker and by the patient's alert requests.
export async function refreshAlertsAfterWrite(user: string) {
 try { await refreshPatientAlerts(user); }
 catch (error) { console.error('Alert generation deferred for worker retry', error); }
}
