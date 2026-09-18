import { pregnancyAge, PREGNANCY_MILESTONES } from "@maasuraksha/shared";
import { Symptom } from "../models/Symptom";
import { symptomTriage } from "@maasuraksha/shared";
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
 pregnancy?: { _id: unknown; expectedDueDate: Date; isHighRisk: boolean; lmp?: Date; status?: string; milestoneCompletions?: {key:string}[] } | null;
 maternal?: { _id: unknown; status: string; riskLevel?: string } | null;
 gdm?: { _id: unknown; status: string; riskLevel?: string } | null;
 symptoms?: { _id: unknown; date: Date; symptoms: string[]; severity: string }[];
 appointments?: { _id: unknown; date: Date; time: string; status: string; scheduleVersion?: number }[];
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
 if (pregnancy && pregnancy.status !== 'completed') {
  const dating = pregnancy.lmp ? pregnancyAge(pregnancy.lmp,now) : undefined;
  const cycle = `${pregnancy._id}:${pregnancy.lmp?.toISOString().slice(0,10) ?? "legacy"}`;
  if (pregnancy.isHighRisk) add('pregnancy-risk','follow_up',AlertSeverity.WARNING,'Pregnancy care plan review','Your pregnancy profile records risk factors. Review your follow-up plan with your care team.',`pregnancy-risk:${cycle}`);
  const days = dating?.daysToDue ?? Math.ceil((pregnancy.expectedDueDate.getTime()-now.getTime())/86400000);
  if (days>=0 && days<=7) add('due-date','follow_up',AlertSeverity.INFO,'Estimated due date approaching','Your estimated due date is within one week. Confirm your birth and contact plan with your care team.',`due:${cycle}`);
  if (days<0) add('pregnancy-overdue','follow_up',AlertSeverity.WARNING,'Review your pregnancy dates and care plan','The estimated due date has passed. Contact your care team to review pregnancy dates and next steps. Update the profile if the pregnancy has ended.',`overdue:${cycle}`);
  if (dating && !dating.datingNeedsReview) for (const m of PREGNANCY_MILESTONES) {
   if(dating.weeks>=m.fromWeek && dating.weeks<=m.toWeek && !pregnancy.milestoneCompletions?.some(c=>c.key===m.key)) add('pregnancy-milestone','follow_up',AlertSeverity.INFO,'Pregnancy care milestone',`Review ${m.key.replace(/_/g,' ')} with your care team. This is a planning reminder; individual care schedules may differ. See Pregnancy Tracking.`,`milestone:${cycle}:${m.key}`);
  }
 }
 for (const appointment of ctx.appointments ?? []) {
  const time = new Date(`${appointment.date.toISOString().slice(0,10)}T${appointment.time}:00+05:30`);
  const remaining = time.getTime() - now.getTime();
  if (['scheduled','confirmed'].includes(appointment.status) && remaining >= 0 && remaining <= 86400000) add('appointment-reminder', 'appointment', AlertSeverity.INFO, 'Upcoming appointment', `Your appointment is on ${appointment.date.toISOString().slice(0,10)} at ${appointment.time} (India time). Check Appointments for details.`, `appointment:${appointment._id}${appointment.scheduleVersion ? `:v${appointment.scheduleVersion}` : ""}`);
 }
 for (const symptom of ctx.symptoms ?? []) {
  const age = now.getTime() - symptom.date.getTime();
  if (age < 0 || age > 86400000) continue;
  const triage = symptomTriage(symptom.symptoms, symptom.severity);
  if (triage !== "routine") add("symptom-triage", "symptom", triage === "urgent" ? AlertSeverity.URGENT : AlertSeverity.WARNING, triage === "urgent" ? "Urgent symptom assessment" : "Symptom review needed", triage === "urgent" ? "A reported symptom needs immediate medical assessment. Contact maternity services or emergency care now. Do not wait for an app response. This is not a diagnosis." : "Contact your maternity care team promptly to review your symptoms. Seek immediate care if they worsen or something feels wrong.", `symptom:${symptom._id}`);
 }
 return signals;
}
export async function refreshPatientAlerts(user: string, now = new Date()) {
 const [metric, pregnancy, maternal, gdm, appointments, symptoms] = await Promise.all([
  HealthMetric.findOne({ user }).sort({ date: -1 }), PregnancyProfile.findOne({ user }),
  MaternalRiskAssessment.findOne({ user }).sort({ createdAt: -1 }), GDMAssessment.findOne({ user }).sort({ createdAt: -1 }),
  Appointment.find({ patient: user, status: { $in: ['scheduled','confirmed'] }, date: { $gte: new Date(now.getTime()-86400000), $lte: new Date(now.getTime()+2*86400000) } }),
  Symptom.find({ user, date: { $gte: new Date(now.getTime()-86400000), $lte: now } })
 ]);
 for (const signal of evaluateAlerts({ user, metric, pregnancy, maternal, gdm, appointments, symptoms }, now)) {
  try {
   await Alert.updateOne({ user, dedupeKey: signal.key }, { $setOnInsert: { user, dedupeKey: signal.key, type: signal.type, severity: signal.severity, title: signal.title, message: signal.message, source: `rules-v1:${signal.rule}` } }, { upsert: true });
   await Alert.updateOne({user,dedupeKey:signal.key,status:'resolved',resolvedByEngine:true},{$set:{status:'pending',resolvedByEngine:false},$unset:{readAt:1}});
  } catch (error) {
   if ((error as { code?: number }).code !== 11000) throw error;
  }
 }
 // Re-read the profile so an older concurrent snapshot cannot resolve newer reminders.
 const currentPregnancy = await PregnancyProfile.findOne({user});
 const currentKeys = evaluateAlerts({user,pregnancy:currentPregnancy},now).map(s=>s.key);
 await Alert.updateMany({user,source:{$in:['rules-v1:due-date','rules-v1:pregnancy-risk','rules-v1:pregnancy-overdue','rules-v1:pregnancy-milestone']},status:{$ne:'resolved'},dedupeKey:{$nin:currentKeys}},{$set:{status:'resolved',readAt:now,resolvedByEngine:true}});
 // Read schedules again after generation. A concurrent refresh with an older
 // snapshot must never resolve a reminder belonging to a newer schedule.
 const currentBookings = await Appointment.find({ patient: user }).select('_id status scheduleVersion');
 for (const item of currentBookings) {
  const storedVersion = { $convert: { input: { $arrayElemAt: [{ $split: ["$dedupeKey", ":v"] }, 1] }, to: "int", onError: 0, onNull: 0 } };
  await Alert.updateMany({ user, source: 'rules-v1:appointment-reminder', status: { $ne: 'resolved' }, dedupeKey: { $regex: `^appointment:${item._id}(?::|$)` }, ...(['scheduled','confirmed'].includes(item.status) ? { $expr: { $lt: [storedVersion, item.scheduleVersion ?? 0] } } : {}) }, { $set: { status: 'resolved', readAt: now } });
 }

}

// Source writes already succeeded. A notification failure must not report the source as unsaved.
// The durable source is retried by the worker and by the patient's alert requests.
export async function refreshAlertsAfterWrite(user: string) {
 try { await refreshPatientAlerts(user); }
 catch (error) { console.error('Alert generation deferred for worker retry', error); }
}
