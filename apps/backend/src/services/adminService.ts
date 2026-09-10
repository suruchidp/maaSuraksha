import { AuditLog } from "../models/AuditLog";
import { User } from "../models/User";
import { PregnancyProfile } from "../models/PregnancyProfile";
import { HealthMetric } from "../models/HealthMetric";
import { Symptom } from "../models/Symptom";
import { MaternalRiskAssessment } from "../models/MaternalRiskAssessment";
import { MoodEntry } from "../models/MoodEntry";
import { Alert } from "../models/Alert";
import { Referral } from "../models/Referral";
import { Appointment } from "../models/Appointment";
import { ApiError } from "../utils/ApiError";
import { UserRole } from "@maasuraksha/shared";

export async function getSystemOverview(role: UserRole) {
  if (role !== UserRole.ADMIN) {
    throw ApiError.forbidden();
  }

  const [
    users,
    activeUsers,
    patients,
    ashas,
    doctors,
    pregnancyProfiles,
    healthMetrics,
    symptoms,
    assessments,
    moodEntries,
    pendingAlerts,
    pendingReferrals,
    appointments,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: UserRole.PATIENT }),
    User.countDocuments({ role: UserRole.ASHA }),
    User.countDocuments({ role: UserRole.DOCTOR }),
    PregnancyProfile.countDocuments(),
    HealthMetric.countDocuments(),
    Symptom.countDocuments(),
    MaternalRiskAssessment.countDocuments(),
    MoodEntry.countDocuments(),
    Alert.countDocuments({ status: "pending" }),
    Referral.countDocuments({ status: "pending" }),
    Appointment.countDocuments(),
  ]);

  return {
    users,
    activeUsers,
    patients,
    ashas,
    doctors,
    pregnancyProfiles,
    healthMetrics,
    symptoms,
    assessments,
    moodEntries,
    pendingAlerts,
    pendingReferrals,
    appointments,
  };
}

export async function listAuditLogs(
  role: UserRole,
  page: number,
  limit: number
) {
  if (role !== UserRole.ADMIN) {
    throw ApiError.forbidden();
  }

  const total = await AuditLog.countDocuments();
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "name email role");

  return {
    items: logs.map((log) => {
      const actor = log.user as unknown as
        | { _id: unknown; name: string; email: string; role: string }
        | null
        | undefined;
      return {
        id: (log as unknown as { _id: unknown })._id,
        actor: actor
          ? {
              id: actor._id,
              name: actor.name,
              email: actor.email,
              role: actor.role,
            }
          : null,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        createdAt: log.createdAt,
      };
    }),
    total,
  };
}