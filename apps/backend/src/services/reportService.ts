import { reportSchema } from "@maasuraksha/shared";
import type { ReportInput } from "@maasuraksha/shared";
import { AuthUser } from "../middleware/auth";
import { ApiError } from "../utils/ApiError";
import { Report } from "../models/Report";
import { User } from "../models/User";
import { PregnancyProfile } from "../models/PregnancyProfile";
import { HealthMetric } from "../models/HealthMetric";
import { Symptom } from "../models/Symptom";
import { MaternalRiskAssessment } from "../models/MaternalRiskAssessment";
import { GDMAssessment } from "../models/GDMAssessment";
import { PPDAssessment } from "../models/PPDAssessment";
import { Appointment } from "../models/Appointment";
import { Referral } from "../models/Referral";
import { HealthRecord } from "../models/HealthRecord";
import {
  recordPatient,
  recordListFilter,
  recordId,
  assertRecordAccess,
} from "./recordAccess";

async function bounded(
  query: PromiseLike<unknown[]>,
  count: PromiseLike<number>,
) {
  const [items, total] = await Promise.all([query, count]);
  return {
    items,
    total,
    included: items.length,
    truncated: total > items.length,
  };
}
export async function createReport(
  actor: AuthUser,
  target: string | undefined,
  input: ReportInput,
) {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success)
    throw ApiError.badRequest(parsed.error.issues[0].message);
  input = parsed.data;
  const user = await recordPatient(actor, target);
  const patient = await User.findById(user).select("name");
  const window: Record<string, Date> = {};
  if (input.fromDate)
    window.$gte = new Date(`${input.fromDate}T00:00:00+05:30`);
  if (input.toDate)
    window.$lt = new Date(
      new Date(`${input.toDate}T00:00:00+05:30`).getTime() + 86400000,
    );
  const filter = (field: string, owner = "user") => ({
    [owner]: user,
    ...(Object.keys(window).length ? { [field]: window } : {}),
  });
  // Calendar-date records are stored at UTC midnight, not as India-time instants.
  const calendarFilter = (owner = "user") => ({
    [owner]: user,
    ...(input.fromDate || input.toDate
      ? {
          date: {
            ...(input.fromDate
              ? { $gte: new Date(`${input.fromDate}T00:00:00Z`) }
              : {}),
            ...(input.toDate
              ? {
                  $lt: new Date(
                    new Date(`${input.toDate}T00:00:00Z`).getTime() + 86400000,
                  ),
                }
              : {}),
          },
        }
      : {}),
  });
  const sections: Record<string, unknown> = {};
  const comprehensive = input.type === "comprehensive";
  const tasks: Promise<void>[] = [];
  if (comprehensive || input.type === "pregnancy_summary")
    tasks.push(
      (async () => {
        sections.pregnancy = await PregnancyProfile.findOne({ user })
          .select(
            "-_id lmp expectedDueDate gravida para isHighRisk riskFactors medicalHistory",
          )
          .lean();
      })(),
    );
  if (comprehensive || input.type === "health_metrics")
    tasks.push(
      (async () => {
        const f = filter("date");
        sections.healthMetrics = await bounded(
          HealthMetric.find(f)
            .select(
              "-_id date systolicBP diastolicBP weight glucose heartRate temperature hemoglobin notes",
            )
            .sort({ date: -1, _id: -1 })
            .limit(100)
            .lean(),
          HealthMetric.countDocuments(f),
        );
      })(),
    );
  if (comprehensive || input.type === "risk_assessment")
    tasks.push(
      (async () => {
        const f = filter("createdAt");
        sections.maternalAssessments = await bounded(
          MaternalRiskAssessment.find(f)
            .select("-_id createdAt status riskLevel riskScore")
            .sort({ createdAt: -1, _id: -1 })
            .limit(100)
            .lean(),
          MaternalRiskAssessment.countDocuments(f),
        );
      })(),
    );
  if (comprehensive || input.type === "gdm_assessment")
    tasks.push(
      (async () => {
        const f = filter("createdAt");
        sections.gdmAssessments = await bounded(
          GDMAssessment.find(f)
            .select("-_id createdAt status riskLevel riskScore")
            .sort({ createdAt: -1, _id: -1 })
            .limit(100)
            .lean(),
          GDMAssessment.countDocuments(f),
        );
      })(),
    );
  if (comprehensive || input.type === "ppd_assessment")
    tasks.push(
      (async () => {
        const f = filter("createdAt");
        sections.ppdAssessments = await bounded(
          PPDAssessment.find(f)
            .select("-_id createdAt status severity edinburghScore")
            .sort({ createdAt: -1, _id: -1 })
            .limit(100)
            .lean(),
          PPDAssessment.countDocuments(f),
        );
      })(),
    );
  if (comprehensive) {
    tasks.push(
      (async () => {
        const f = filter("date");
        sections.symptoms = await bounded(
          Symptom.find(f)
            .select(
              "-_id date symptoms severity onset durationHours frequency notes",
            )
            .sort({ date: -1, _id: -1 })
            .limit(100)
            .lean(),
          Symptom.countDocuments(f),
        );
      })(),
    );
    tasks.push(
      (async () => {
        const f = calendarFilter("patient");
        sections.appointments = await bounded(
          Appointment.find(f)
            .select("-_id date time type status notes cancelledReason")
            .sort({ date: -1, time: -1, _id: -1 })
            .limit(100)
            .lean(),
          Appointment.countDocuments(f),
        );
      })(),
    );
    tasks.push(
      (async () => {
        const f = filter("createdAt", "patient");
        sections.referrals = await bounded(
          Referral.find(f)
            .select("-_id createdAt facility reason notes status")
            .sort({ createdAt: -1, _id: -1 })
            .limit(100)
            .lean(),
          Referral.countDocuments(f),
        );
      })(),
    );
    tasks.push(
      (async () => {
        const f = { ...calendarFilter(), isArchived: false };
        sections.healthRecords = await bounded(
          HealthRecord.find(f)
            .select(
              "-_id category title date provider details authorRole updatedAt",
            )
            .sort({ date: -1, _id: -1 })
            .limit(100)
            .lean(),
          HealthRecord.countDocuments(f),
        );
      })(),
    );
  }
  await Promise.all(tasks);
  const report = await Report.create({
    user,
    type: input.type,
    title: input.title ?? `Health report - ${input.type.replace(/_/g, " ")}`,
    generatedBy: actor.userId,
    data: {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      patient: { name: patient!.name },
      range: {
        fromDate: input.fromDate ?? null,
        toDate: input.toDate ?? null,
        timeZone: "Asia/Kolkata",
      },
      sections,
    },
  });
  return dto(report);
}
export async function listReports(
  actor: AuthUser,
  target: string | undefined,
  page: number,
  limit: number,
  type?: string,
) {
  if (type && !reportSchema.safeParse({ type }).success)
    throw ApiError.badRequest("Invalid report type");
  const filter = await recordListFilter(actor, target);
  if (type) filter.type = type;
  const total = await Report.countDocuments(filter);
  const items = await Report.find(filter)
    .select("-data")
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { items: items.map(dto), total };
}
export async function getReport(actor: AuthUser, id: string) {
  recordId(id);
  const r = await Report.findById(id);
  if (!r) throw ApiError.notFound("Report not found");
  await assertRecordAccess(actor, r.user.toString());
  return dto(r);
}
function dto(r: InstanceType<typeof Report>) {
  return {
    id: r._id,
    user: r.user,
    type: r.type,
    title: r.title,
    data: r.data,
    generatedBy: r.generatedBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
