import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Badge, BadgeColor } from "@/components/ui/Badge";
import { riskColor } from "@/lib/mlUtils";

export function AssessmentResult({
  title,
  status,
  riskLevel,
  riskScore,
  recommendations,
  shapChart,
  message,
  modelVersion,
  screening,
  children,
}: {
  title: string;
  status: "completed" | "pending" | "unavailable";
  riskLevel?: string;
  riskScore?: number;
  recommendations?: string[];
  shapChart?: ReactNode;
  message?: string;
  modelVersion?: string;
  /** GDM-style screening presentation: a primary "Screening Positive/Negative"
   *  headline with the actual model score and the configured screening
   *  threshold, keeping the score framed as a decision-support flag rather
   *  than a diagnosis. `threshold` is optional and only set when the served
   *  model version matched the metadata the threshold was read from. */
  screening?: {
    positive: boolean;
    score: number;
    threshold?: number;
  };
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const color: BadgeColor = status === "completed" ? riskColor(riskLevel) : "gray";

  const screeningScorePct = screening ? Math.round(screening.score * 100) : null;
  const screeningThresholdPct =
    screening && screening.threshold !== undefined
      ? Math.round(screening.threshold * 100)
      : null;

  return (
    <Card title={title}>
      {status === "completed" && screening && (
        <div
          className={`rounded-lg border p-3 mb-3 ${
            screening.positive ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
          }`}
        >
          <p
            className={`text-base font-semibold ${
              screening.positive ? "text-red-700" : "text-green-700"
            }`}
          >
            {t(screening.positive ? "assessment.screeningPositive" : "assessment.screeningNegative")}
          </p>
          {screeningScorePct !== null && (
            <p className="text-sm text-gray-700 mt-1">
              {t("assessment.screeningScore")}: <strong>{screeningScorePct}%</strong>
            </p>
          )}
          {screeningThresholdPct !== null && (
            <>
              <p className="text-sm text-gray-700">
                {t("assessment.screeningThreshold")}: <strong>{screeningThresholdPct}%</strong>
              </p>
              <p className="text-sm text-gray-600">
                {t(screening.positive ? "assessment.screeningAbove" : "assessment.screeningBelow")}
              </p>
            </>
          )}
          <p className="text-xs text-gray-500 mt-2 italic">
            {t("assessment.screeningDisclaimer")}
          </p>
        </div>
      )}

      {!screening && riskLevel !== undefined && riskLevel !== null && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-600">{t("assessment.riskLevel")}:</span>
          <Badge color={color}>{riskLevel}</Badge>
          {riskScore !== undefined && riskScore !== null && (
            <span className="text-xs text-gray-500">
              ({Math.round((riskScore ?? 0) * 100)}%)
            </span>
          )}
        </div>
      )}

      {status === "pending" && message && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 mb-3">
          {message}
        </div>
      )}

      {status === "unavailable" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 mb-3">
          {message ?? t("assessment.serviceUnavailable")}
        </div>
      )}

      {modelVersion && (
        <p className="text-xs text-gray-400 mb-2">
          {t("assessment.modelVersion")}: {modelVersion}
        </p>
      )}

      {children}

      {shapChart}

      {recommendations && recommendations.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            {t("assessment.recommendations")}
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 italic">
        {t("assessment.disclaimer")}
      </p>
    </Card>
  );
}