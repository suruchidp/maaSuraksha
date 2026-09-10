import { useTranslation } from "react-i18next";
import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";

type Status = "completed" | "analyzed" | "pending" | "unavailable";

export function ModelStatusBanner({
  status,
  message,
  modelVersion,
}: {
  status: Status;
  message?: string;
  modelVersion?: string;
}) {
  const { t } = useTranslation();

  if (status === "completed" || status === "analyzed") {
    return message ? (
      <div className="flex items-start gap-2 rounded-lg bg-accent-50 border border-accent-200 p-3 text-sm text-accent-800">
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p>{message}</p>
          {modelVersion && (
            <p className="text-xs text-accent-600 mt-0.5">
              {t("assessment.modelVersion")}: {modelVersion}
            </p>
          )}
        </div>
      </div>
    ) : null;
  }

  if (status === "pending" || status === "unavailable") {
    return (
      <div
        className="flex items-start gap-2 rounded-lg border p-3 text-sm"
        role="status"
        aria-label={t("assessment.modelUnavailable")}
      >
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium text-amber-800">
            {t("assessment.modelUnavailable")}
          </p>
          {message && <p className="text-amber-700 mt-0.5">{message}</p>}
          <p className="text-xs text-amber-600 mt-1">
            {t("assessment.honestyNote")}
          </p>
        </div>
      </div>
    );
  }

  return null;
}