import { refreshAlertsAfterWrite } from "./alertEngine";
import { isValidObjectId } from "mongoose";
import { RiskLevel, PPDSeverity } from "@maasuraksha/shared";
import { MaternalRiskAssessment } from "../models/MaternalRiskAssessment";
import { GDMAssessment } from "../models/GDMAssessment";
import { PPDAssessment } from "../models/PPDAssessment";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";
import {
  predictGDM,
  predictMaternalRisk,
  predictPPD,
} from "./mlClient";
import { refreshRecommendationsForAssessment } from "./recommendationEngine";

const UNAVAILABLE_MESSAGE =
  "Model inference is not available in this environment yet. " +
  "The assessment inputs were validated and stored, but no risk score, " +
  "classification or SHAP explanation has been computed. " +
  "The ML service did not return a real model result, so nothing was invented.";

/**
 * Maternal risk endpoint. Validates + stores inputs; requests a REAL result
 * from the ML service best-effort. Never fabricates a risk score: if the ML
 * service is unreachable or its model is unavailable, the assessment stays
 * pending with an honest message.
 */
export async function createMaternalRiskAssessment(
  actor: AuthUser,
  targetUserId: string | undefined,
  input: Record<string, unknown>
) {
  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  const assessment = await MaternalRiskAssessment.create({
    user: userId,
    assessedBy: actor.userId,
    status: "pending",
    riskFactors: [],
    recommendations: [],
    inputFeatures: {
      age: input.age,
      systolicBP: input.systolicBP,
      diastolicBP: input.diastolicBP,
      bloodSugar: input.bloodSugar,
      bodyTemp: input.bodyTemp,
      heartRate: input.heartRate,
      bmi: input.bmi,
      gestationalWeek: input.gestationalWeek,
      hemoglobin: input.hemoglobin ?? undefined,
    },
  });

  const ml = await predictMaternalRisk({
    age: input.age,
    systolic_bp: input.systolicBP,
    diastolic_bp: input.diastolicBP,
    blood_sugar: input.bloodSugar,
    body_temp: input.bodyTemp,
    heart_rate: input.heartRate,
    bmi: input.bmi,
    gestational_week: input.gestationalWeek,
    hemoglobin: input.hemoglobin ?? undefined,
  });

  if (!ml.available) {
    return { ...toMaternalRiskDto(assessment), message: UNAVAILABLE_MESSAGE };
  }

  const riskLevel = ml.riskLevel as RiskLevel;
  const highRisk = ml.prediction === "high" || riskLevel === "high" || riskLevel === "critical";
  await MaternalRiskAssessment.updateOne(
    { _id: assessment._id },
    {
      $set: {
        status: "completed",
        riskLevel,
        riskScore: ml.probability,
        riskFactors: highRisk ? ["High predicted maternal risk (model)"] : [],
        shapValues: ml.shapValues ?? {},
        modelVersion: ml.modelVersion,
      },
    }
  );

  await refreshAlertsAfterWrite(userId);
  const recommendationTitles = await refreshRecommendationsForAssessment(
    userId,
    String(assessment._id)
  );
  if (recommendationTitles.length > 0) {
    await MaternalRiskAssessment.updateOne(
      { _id: assessment._id },
      { $set: { recommendations: recommendationTitles } }
    );
  }

  const updated = await MaternalRiskAssessment.findById(assessment._id);
  return {
    ...toMaternalRiskDto(updated ?? assessment),
    message: `Assessment completed by the ML service (model ${ml.modelVersion}).`,
  };
}

export async function listMaternalRiskAssessments(
  actor: AuthUser,
  targetUserId: string | undefined,
  page: number,
  limit: number
) {
  const filter = await buildPatientFilter(actor, targetUserId);
  const total = await MaternalRiskAssessment.countDocuments(filter);
  const items = await MaternalRiskAssessment.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { items: items.map(toMaternalRiskDto), total };
}

export async function getLatestMaternalRiskAssessment(
  actor: AuthUser,
  targetUserId: string
) {
  const filter = await buildPatientFilter(actor, targetUserId);
  const item = await MaternalRiskAssessment.findOne(filter).sort({ createdAt: -1 });
  if (!item) throw ApiError.notFound("No maternal risk assessment found");
  return toMaternalRiskDto(item);
}

export async function createGDMAssessment(
  actor: AuthUser,
  targetUserId: string | undefined,
  input: Record<string, unknown>
) {
  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  const assessment = await GDMAssessment.create({
    user: userId,
    assessedBy: actor.userId,
    status: "pending",
    // Stage 2 clinical glucose measurements — stored for record-keeping and
    // clinical review, never sent to the early-risk model.
    fastingGlucose: input.fastingGlucose,
    postprandialGlucose: input.postprandialGlucose,
    hba1c: input.hba1c,
    riskFactors: [],
    recommendations: [],
    inputFeatures: {
      age: input.age,
      bmi: input.bmi,
      hdl: input.hdl,
      pregnancyCount: input.pregnancyCount,
      previousPregnancyGestation: input.previousPregnancyGestation,
      familyHistory: input.familyHistory ?? false,
      unexplainedPrenatalLoss: input.unexplainedPrenatalLoss ?? false,
      largeChildOrBirthDefect: input.largeChildOrBirthDefect ?? false,
      pcos: input.pcos ?? false,
      systolicBP: input.systolicBP,
      diastolicBP: input.diastolicBP,
      hemoglobin: input.hemoglobin,
      sedentaryLifestyle: input.sedentaryLifestyle ?? false,
    },
  });

  const ml = await predictGDM({
    age: input.age,
    bmi: input.bmi,
    hdl: input.hdl,
    pregnancy_count: input.pregnancyCount,
    previous_pregnancy_gestation: input.previousPregnancyGestation,
    family_history: input.familyHistory ?? false,
    unexplained_prenatal_loss: input.unexplainedPrenatalLoss ?? false,
    large_child_or_birth_defect: input.largeChildOrBirthDefect ?? false,
    pcos: input.pcos ?? false,
    systolic_bp: input.systolicBP,
    diastolic_bp: input.diastolicBP,
    hemoglobin: input.hemoglobin,
    sedentary_lifestyle: input.sedentaryLifestyle ?? false,
  });

  if (!ml.available) {
    return { ...toGDMDto(assessment), message: UNAVAILABLE_MESSAGE };
  }

  const riskLevel = ml.riskLevel as RiskLevel;
  await GDMAssessment.updateOne(
    { _id: assessment._id },
    {
      $set: {
        status: "completed",
        riskLevel,
        riskScore: ml.probability,
        riskFactors:
          ml.prediction === "positive"
            ? ["Positive GDM risk screening (model)"]
            : [],
        shapValues: ml.shapValues ?? {},
        modelVersion: ml.modelVersion,
      },
    }
  );

  await refreshAlertsAfterWrite(userId);
  const recommendationTitles = await refreshRecommendationsForAssessment(
    userId,
    String(assessment._id)
  );
  if (recommendationTitles.length > 0) {
    await GDMAssessment.updateOne(
      { _id: assessment._id },
      { $set: { recommendations: recommendationTitles } }
    );
  }

  const updated = await GDMAssessment.findById(assessment._id);
  return {
    ...toGDMDto(updated ?? assessment),
    message: `GDM risk assessment completed by the ML service (model ${ml.modelVersion}). This is a risk estimate for screening, not a clinical diagnosis.`,
  };
}

export async function listGDMAssessments(
  actor: AuthUser,
  targetUserId: string | undefined,
  page: number,
  limit: number
) {
  const filter = await buildPatientFilter(actor, targetUserId);
  const total = await GDMAssessment.countDocuments(filter);
  const items = await GDMAssessment.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { items: items.map(toGDMDto), total };
}

export async function getLatestGDMAssessment(actor: AuthUser, targetUserId: string) {
  const filter = await buildPatientFilter(actor, targetUserId);
  const item = await GDMAssessment.findOne(filter).sort({ createdAt: -1 });
  if (!item) throw ApiError.notFound("No GDM assessment found");
  return toGDMDto(item);
}

export async function createPPDAssessment(
  actor: AuthUser,
  targetUserId: string | undefined,
  input: { edinburghAnswers?: number[]; screeningText?: string }
) {
  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  // EPDS score is the direct sum of the 10 answered items (each 0..3). It is
  // derived from the submitted answers, not invented by a model, so it is
  // stored even when ML severity classification is unavailable.
  const edinburghScore =
    input.edinburghAnswers && input.edinburghAnswers.length === 10
      ? input.edinburghAnswers.reduce((sum, n) => sum + Number(n), 0)
      : undefined;

  const assessment = await PPDAssessment.create({
    user: userId,
    assessedBy: actor.userId,
    status: "pending",
    riskFactors: [],
    recommendations: [],
    edinburghAnswers: input.edinburghAnswers,
    edinburghScore,
    screeningText: input.screeningText,
  });

  if (input.screeningText) {
    const ml = await predictPPD(input.screeningText, "en");
    if (ml.available) {
      // The PPD classifier is a binary screen (positive_screen | negative_screen).
      // Translate it deterministically into the shared PPDSeverity enum instead of
      // storing the ML "risk_level" verbatim (high | low), which is not a valid
      // member of PPDSeverity. A positive screen plus an EPDS score >= 13 is the
      // classic "probable depression" band; anything lower is moderate triage.
      const severity: PPDSeverity =
        ml.prediction === "positive_screen"
          ? (edinburghScore ?? 0) >= 13
            ? PPDSeverity.SEVERE
            : PPDSeverity.MODERATE
          : PPDSeverity.NONE;
      await PPDAssessment.updateOne(
        { _id: assessment._id },
        {
          $set: {
            status: "completed",
            severity,
            modelConfidence: ml.probability,
            modelVersion: ml.modelVersion,
            nlpAnalysis: {
              sentiment: ml.prediction,
              keywords: [],
              riskIndicators: [],
            },
          },
        }
      );

      await refreshAlertsAfterWrite(userId);
  const recommendationTitles = await refreshRecommendationsForAssessment(
        userId,
        String(assessment._id)
      );
      if (recommendationTitles.length > 0) {
        await PPDAssessment.updateOne(
          { _id: assessment._id },
          { $set: { recommendations: recommendationTitles } }
        );
      }

      const updated = await PPDAssessment.findById(assessment._id);
      return {
        ...toPPDDto(updated ?? assessment),
        message: `PPD screening completed by the ML service (model ${ml.modelVersion}).`,
      };
    }
  }

  return {
    ...toPPDDto(assessment),
    message: UNAVAILABLE_MESSAGE,
  };
}

export async function listPPDAssessments(
  actor: AuthUser,
  targetUserId: string | undefined,
  page: number,
  limit: number
) {
  const filter = await buildPatientFilter(actor, targetUserId);
  const total = await PPDAssessment.countDocuments(filter);
  const items = await PPDAssessment.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { items: items.map(toPPDDto), total };
}

export async function getLatestPPDAssessment(actor: AuthUser, targetUserId: string) {
  const filter = await buildPatientFilter(actor, targetUserId);
  const item = await PPDAssessment.findOne(filter).sort({ createdAt: -1 });
  if (!item) throw ApiError.notFound("No PPD assessment found");
  return toPPDDto(item);
}

async function buildPatientFilter(actor: AuthUser, targetUserId: string | undefined) {
  const allowed = await getAccessiblePatientIds(actor);
  if (targetUserId) {
    if (actor.role !== "ADMIN" && !allowed.has(targetUserId)) {
      throw ApiError.forbidden("You do not have access to this patient's data");
    }
    return { user: targetUserId };
  }
  if (actor.role === "ADMIN") return {};
  return { user: { $in: Array.from(allowed) } };
}

function resolveTargetPatient(
  actor: AuthUser,
  targetUserId: string | undefined,
  allowed: Set<string>
): string {
  if (actor.role === "ADMIN") {
    if (!targetUserId) throw ApiError.badRequest("userId is required");
    validateId(targetUserId);
    return targetUserId;
  }
  if (targetUserId) {
    if (!allowed.has(targetUserId)) {
      throw ApiError.forbidden("You do not have access to this patient's data");
    }
    return targetUserId;
  }
  if (actor.role === "PATIENT") return actor.userId;
  throw ApiError.badRequest("userId is required for caregiver role");
}

function validateId(id: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid id format");
}

function toMaternalRiskDto(a: InstanceType<typeof MaternalRiskAssessment>) {
  return {
    id: a._id,
    user: a.user,
    assessedBy: a.assessedBy,
    status: a.status,
    riskLevel: a.riskLevel,
    riskScore: a.riskScore,
    riskFactors: a.riskFactors,
    shapValues: a.shapValues,
    recommendations: a.recommendations,
    modelVersion: a.modelVersion,
    inputFeatures: a.inputFeatures,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function toGDMDto(a: InstanceType<typeof GDMAssessment>) {
  return {
    id: a._id,
    user: a.user,
    assessedBy: a.assessedBy,
    status: a.status,
    riskLevel: a.riskLevel,
    riskScore: a.riskScore,
    fastingGlucose: a.fastingGlucose,
    postprandialGlucose: a.postprandialGlucose,
    hba1c: a.hba1c,
    riskFactors: a.riskFactors,
    shapValues: a.shapValues,
    recommendations: a.recommendations,
    modelVersion: a.modelVersion,
    inputFeatures: a.inputFeatures,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function toPPDDto(a: InstanceType<typeof PPDAssessment>) {
  return {
    id: a._id,
    user: a.user,
    assessedBy: a.assessedBy,
    status: a.status,
    edinburghAnswers: a.edinburghAnswers,
    edinburghScore: a.edinburghScore,
    severity: a.severity,
    riskFactors: a.riskFactors,
    screeningText: a.screeningText,
    modelConfidence: a.modelConfidence,
    nlpAnalysis: a.nlpAnalysis,
    recommendations: a.recommendations,
    modelVersion: a.modelVersion,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}