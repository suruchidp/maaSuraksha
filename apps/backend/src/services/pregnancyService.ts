import { MaternalRiskAssessment } from "../models/MaternalRiskAssessment";
import { GDMAssessment } from "../models/GDMAssessment";
import { Symptom } from "../models/Symptom";
import { Appointment } from "../models/Appointment";
import { Alert } from "../models/Alert";
import { appointmentToday, appointmentStart } from "@maasuraksha/shared";
import {
  pregnancyAge,
  pregnancyProfileSchema,
  PREGNANCY_MILESTONES,
  type PregnancyProfileInput,
  Trimester,
} from "@maasuraksha/shared";
import { refreshAlertsAfterWrite } from "./alertEngine";
import { PregnancyProfile } from "../models/PregnancyProfile";
import { HealthMetric } from "../models/HealthMetric";
import { ApiError } from "../utils/ApiError";
import { AuthUser } from "../middleware/auth";
import { recordPatient } from "./recordAccess";
export function calculateDueDate(lmp: Date) {
  return new Date(pregnancyAge(lmp).dueDate);
}
export function calculateGestationalWeek(lmp: Date, now = new Date()) {
  return pregnancyAge(lmp, now).weeks;
}
export function calculateTrimester(weeks: number): Trimester {
  return weeks < 14
    ? Trimester.FIRST
    : weeks < 28
      ? Trimester.SECOND
      : Trimester.THIRD;
}
export async function createOrUpdatePregnancyProfile(
  actor: AuthUser,
  target: string | undefined,
  input: PregnancyProfileInput,
) {
  const parsed = pregnancyProfileSchema.safeParse(input);
  if (!parsed.success)
    throw ApiError.badRequest(parsed.error.issues[0].message);
  input = parsed.data;
  const user = await recordPatient(actor, target);
  const existing = await PregnancyProfile.findOne({ user });
  const gravida = input.gravida ?? existing?.gravida ?? 1,
    para = input.para ?? existing?.para ?? 0;
  if (para >= gravida)
    throw ApiError.badRequest(
      "Previous births must be fewer than total pregnancies",
    );
  const age = pregnancyAge(input.lmp);
  const riskFactors = input.riskFactors ?? existing?.riskFactors ?? [];
  const status = input.status ?? existing?.status ?? "active";
  const endedOn =
    status === "completed"
      ? input.endedOn
        ? new Date(input.endedOn)
        : existing?.endedOn
      : null;
  if (
    status === "completed" &&
    (!endedOn || endedOn.toISOString().slice(0, 10) < input.lmp)
  )
    throw ApiError.badRequest("A valid end date is required");
  const data = {
    user,
    lmp: new Date(input.lmp),
    expectedDueDate: new Date(age.dueDate),
    gestationalWeek: Math.min(42, age.weeks),
    trimester: age.trimester,
    gravida,
    para,
    riskFactors,
    medicalHistory: input.medicalHistory ?? existing?.medicalHistory ?? [],
    isHighRisk: riskFactors.length > 0,
    status,
    endedOn,
    ...(existing && existing.lmp.toISOString().slice(0, 10) !== input.lmp
      ? { milestoneCompletions: [] }
      : {}),
  };
  let profile;
  if (existing) {
    profile = await PregnancyProfile.findOneAndUpdate(
      {
        _id: existing._id,
        updatedAt: input.updatedAt
          ? new Date(input.updatedAt)
          : existing.updatedAt,
      },
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!profile)
      throw ApiError.conflict("Profile changed; refresh and try again");
  } else {
    if (input.updatedAt)
      throw ApiError.conflict("Profile changed; refresh and try again");
    try {
      profile = await PregnancyProfile.create(data);
    } catch (e) {
      if ((e as { code?: number }).code === 11000)
        throw ApiError.conflict(
          "Profile already created; refresh and try again",
        );
      throw e;
    }
  }
  await refreshAlertsAfterWrite(user);
  return toDto(profile);
}
export async function getPregnancyProfile(
  actor: AuthUser,
  target: string | undefined,
) {
  const user = await recordPatient(actor, target);
  const profile = await PregnancyProfile.findOne({ user });
  if (!profile) throw ApiError.notFound("Pregnancy profile not found");
  return toDto(profile);
}
export async function listPregnancyProfiles(userIds: string[]) {
  return (
    await PregnancyProfile.find({ user: { $in: userIds } }).sort({
      createdAt: -1,
    })
  ).map(toDto);
}
export function toDto(p: InstanceType<typeof PregnancyProfile>) {
  const age = pregnancyAge(
    p.lmp,
    new Date(),
    p.status === "completed" ? p.endedOn : undefined,
  );
  return {
    id: p._id,
    user: p.user,
    lmp: p.lmp,
    expectedDueDate: new Date(age.dueDate),
    gestationalWeek: age.weeks,
    gestationalDays: age.days,
    trimester: age.trimester,
    daysToDue: age.daysToDue,
    datingNeedsReview: age.datingNeedsReview,
    asOf: age.asOf,
    gravida: p.gravida,
    para: p.para,
    isHighRisk: p.isHighRisk,
    riskFactors: p.riskFactors,
    medicalHistory: p.medicalHistory,
    status: p.status ?? "active",
    endedOn: p.endedOn,
    milestoneCompletions: p.milestoneCompletions,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
interface TrackingSnapshot {
  profile: ReturnType<typeof toDto>;
  milestones: {
    key: string;
    fromWeek: number;
    toWeek: number;
    source: string;
    date: string;
    state: string;
    completion?: {
      key: string;
      completedAt: Date;
      completedBy: import("mongoose").Types.ObjectId;
    };
  }[];
  metrics: {
    items: {
      id: string;
      user: string;
      createdAt: Date;
      date: Date;
      systolicBP?: number;
      diastolicBP?: number;
      weight?: number;
      glucose?: number;
      heartRate?: number;
      temperature?: number;
      hemoglobin?: number;
    }[];
    total: number;
    included: number;
    truncated: boolean;
  };
  context: {
    maternal: {
      status: string;
      riskLevel?: string;
      riskScore?: number;
      createdAt: Date;
    } | null;
    gdm: {
      status: string;
      riskLevel?: string;
      riskScore?: number;
      createdAt: Date;
    } | null;
    latestSymptom: { date: Date; symptoms: string[]; severity: string } | null;
    nextAppointments: {
      date: Date;
      time: string;
      type: string;
      status: string;
    }[];
    pendingAlerts: number;
  };
}
export async function getPregnancyTracking(
  actor: AuthUser,
  target: string | undefined,
): Promise<TrackingSnapshot> {
  const profile = await getPregnancyProfile(actor, target);
  const user = profile.user.toString();
  const start = new Date(
    profile.lmp.toISOString().slice(0, 10) + "T00:00:00+05:30",
  );
  const end = profile.endedOn
    ? new Date(
        profile.endedOn.toISOString().slice(0, 10) + "T23:59:59.999+05:30",
      )
    : new Date();
  const filter = { user, date: { $gte: start, $lte: end } };
  const [metrics, total] = await Promise.all([
    HealthMetric.find(filter)
      .select(
        "_id user createdAt date systolicBP diastolicBP weight glucose heartRate temperature hemoglobin",
      )
      .sort({ date: -1, _id: -1 })
      .limit(100)
      .lean(),
    HealthMetric.countDocuments(filter),
  ]);
  const milestones = PREGNANCY_MILESTONES.map((m) => {
    const completion = profile.milestoneCompletions?.find(
      (c) => c.key === m.key,
    );
    return {
      ...m,
      date: new Date(profile.lmp.getTime() + m.fromWeek * 7 * 86400000)
        .toISOString()
        .slice(0, 10),
      state: completion
        ? "recorded"
        : profile.status === "completed"
          ? "closed"
          : profile.gestationalWeek < m.fromWeek
            ? "upcoming"
            : profile.gestationalWeek <= m.toWeek
              ? "current"
              : "window_passed",
      completion,
    };
  });
  const assessed = { user, createdAt: { $gte: start, $lte: end } };
  const [maternal, gdm, latestSymptom, bookings, pendingAlerts] =
    await Promise.all([
      MaternalRiskAssessment.findOne(assessed)
        .select("-_id createdAt status riskLevel riskScore")
        .sort({ createdAt: -1, _id: -1 })
        .lean(),
      GDMAssessment.findOne(assessed)
        .select("-_id createdAt status riskLevel riskScore")
        .sort({ createdAt: -1, _id: -1 })
        .lean(),
      Symptom.findOne(filter)
        .select("-_id date symptoms severity")
        .sort({ date: -1, _id: -1 })
        .lean(),
      Appointment.find({
        patient: user,
        status: { $in: ["scheduled", "confirmed"] },
        date: { $gte: new Date(appointmentToday()) },
      })
        .select("-_id date time type status")
        .sort({ date: 1, time: 1, _id: 1 })
        .limit(10)
        .lean(),
      Alert.countDocuments({ user, status: { $ne: "resolved" } }),
    ]);
  const nextAppointments = bookings
    .filter((a) => appointmentStart(a.date, a.time).getTime() >= Date.now())
    .slice(0, 3);
  return {
    profile,
    milestones,
    context: { maternal, gdm, latestSymptom, nextAppointments, pendingAlerts },
    metrics: {
      items: metrics
        .reverse()
        .map(({ _id, ...m }) => ({
          ...m,
          id: _id.toString(),
          user: m.user.toString(),
        })),
      total,
      included: metrics.length,
      truncated: total > metrics.length,
    },
  };
}
export async function updatePregnancyMilestone(
  actor: AuthUser,
  target: string | undefined,
  key: string,
  completed: boolean,
  updatedAt: string,
) {
  if (!PREGNANCY_MILESTONES.some((m) => m.key === key))
    throw ApiError.badRequest("Unknown milestone");
  const user = await recordPatient(actor, target);
  const p = await PregnancyProfile.findOne({ user });
  if (!p) throw ApiError.notFound("Pregnancy profile not found");
  if (p.status === "completed")
    throw ApiError.conflict("Pregnancy is completed");
  const completions = p.milestoneCompletions.filter((c) => c.key !== key);
  if (completed)
    completions.push({
      key,
      completedAt: new Date(),
      completedBy: actor.userId as unknown as import("mongoose").Types.ObjectId,
    });
  const changed = await PregnancyProfile.findOneAndUpdate(
    { _id: p._id, updatedAt: new Date(updatedAt) },
    { $set: { milestoneCompletions: completions } },
    { new: true, runValidators: true },
  );
  if (!changed)
    throw ApiError.conflict("Profile changed; refresh and try again");
  await refreshAlertsAfterWrite(user);
  return toDto(changed);
}
