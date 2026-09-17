import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight, FileText } from "lucide-react";
import { Language } from "@maasuraksha/shared";
import { useMaternalRiskHistory, useGDMHistory, usePPDHistory } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AssessmentStatusBadge } from "@/components/status/StatusLabels";
import type { MaternalRiskDTO, GDMAssessmentDTO, PPDAssessmentDTO } from "@/lib/types";

type AnyAssessment = MaternalRiskDTO | GDMAssessmentDTO | PPDAssessmentDTO;
type Kind = "maternal" | "gdm" | "ppd";

export function RecentAssessments({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();

  const maternal = useMaternalRiskHistory(userId, 3);
  const gdm = useGDMHistory(userId, 3);
  const ppd = usePPDHistory(userId, 3);

  const loading = maternal.isLoading || gdm.isLoading || ppd.isLoading;

  const recent: Array<{ kind: Kind; assessment: AnyAssessment }> = [];
  (maternal.data?.items ?? []).forEach((a) => recent.push({ kind: "maternal", assessment: a }));
  (gdm.data?.items ?? []).forEach((a) => recent.push({ kind: "gdm", assessment: a }));
  (ppd.data?.items ?? []).forEach((a) => recent.push({ kind: "ppd", assessment: a }));

  recent.sort(
    (a, b) =>
      new Date(b.assessment.createdAt).getTime() -
      new Date(a.assessment.createdAt).getTime()
  );
  const shown = recent.slice(0, 5);

  return (
    <Card
      title={t("patient.dashboard.recentAssessments")}
      action={
        <Link
          to="/patient/assessments"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
        >
          {t("patient.dashboard.viewAllAssessments")}
          <ChevronRight className="w-4 h-4" />
        </Link>
      }
      className="h-full"
    >
      {loading ? null : shown.length === 0 ? (
        <EmptyState
          compact
          icon={<FileText className="w-6 h-6 text-primary-400" aria-hidden />}
          title={t("patient.dashboard.recentAssessmentsEmpty")}
          description={t("patient.dashboard.recentAssessmentsEmptyDesc")}
        />
      ) : (
        <ul className="space-y-0">
          {shown.map(({ kind, assessment }) => (
            <AssessmentRow key={assessment.id} kind={kind} assessment={assessment} lang={lang} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function AssessmentRow({
  kind,
  assessment,
  lang,
}: {
  kind: Kind;
  assessment: AnyAssessment;
  lang: Language;
}) {
  const { t } = useTranslation();
  const kindLabel = t(`assessments.${kind}.title`);
  const status = assessment.status;

  let detail: React.ReactNode = null;
  if (status === "completed") {
    if (kind === "ppd" && "edinburghScore" in assessment && typeof assessment.edinburghScore === "number") {
      detail = `${t("assessments.ppd.epdsScore")}: ${assessment.edinburghScore}`;
    } else if ("riskLevel" in assessment && assessment.riskLevel) {
      const label = t(`assessments.risk.${assessment.riskLevel}`, { defaultValue: assessment.riskLevel });
      const score =
        "riskScore" in assessment && typeof assessment.riskScore === "number"
          ? ` Â· ${Math.round(assessment.riskScore * 100)}%`
          : "";
      detail = `${label}${score}`;
    }
  }

  return (
    <li className="py-3 flex items-center gap-3 border-b border-rose-100/60 last:border-0">
      <span className="w-9 h-9 rounded-xl bg-lavender-100/80 text-lavender-700 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">{kindLabel}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatDate(assessment.createdAt, lang)}
          {detail ? ` Â· ${detail}` : ""}
        </p>
      </div>
      <AssessmentStatusBadge status={status} />
    </li>
  );
}