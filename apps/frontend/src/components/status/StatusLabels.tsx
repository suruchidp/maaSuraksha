import { useTranslation } from "react-i18next";
import { Badge, BadgeColor } from "@/components/ui/Badge";

function useStatusBadge(prefix: string) {
  const { t } = useTranslation();
  const label = (value?: string | null) =>
    value ? t(`${prefix}.${value}`, { defaultValue: value }) : "—";
  let color: BadgeColor = "gray";
  return { t, label, color };
}

/* Risk level: low / medium / moderate / high / critical */
export function RiskLabel({ level }: { level?: string | null }) {
  const { label, color: _c } = useStatusBadge("status.risk");
  return <>{label(level)}</>;
}

export function RiskBadge({ level }: { level?: string | null }) {
  const { t } = useTranslation();
  if (!level) return <Badge>{t("common.notAvailable")}</Badge>;
  const color: BadgeColor =
    level === "low"
      ? "green"
      : level === "medium" || level === "moderate"
      ? "amber"
      : "red";
  return <Badge color={color}>{t(`status.risk.${level}`, { defaultValue: level })}</Badge>;
}

/* Alert severity: info / warning / urgent / critical */
export function SeverityBadge({ severity }: { severity?: string | null }) {
  const { t } = useTranslation();
  if (!severity) return <Badge>{t("common.notAvailable")}</Badge>;
  const color: BadgeColor =
    severity === "info"
      ? "blue"
      : severity === "warning"
      ? "amber"
      : "red";
  return (
    <Badge color={color}>{t(`status.severity.${severity}`, { defaultValue: severity })}</Badge>
  );
}

/* Generic assessment status: pending / completed / unavailable */
export function AssessmentStatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation();
  if (!status) return null;
  const color: BadgeColor = status === "completed" ? "green" : status === "pending" ? "amber" : "red";
  return <Badge color={color}>{t(`status.assessment.${status}`, { defaultValue: status })}</Badge>;
}

/* Mood sentiment */
export function SentimentBadge({ sentiment }: { sentiment?: string | null }) {
  const { t } = useTranslation();
  if (!sentiment) return <Badge>{t("common.notAvailable")}</Badge>;
  const color: BadgeColor = sentiment === "positive" ? "green" : sentiment === "neutral" ? "gray" : "amber";
  return (
    <Badge color={color}>
      {t(`status.sentiment.${sentiment}`, { defaultValue: sentiment })}
    </Badge>
  );
}

/* PPD severity: none / mild / moderate / severe */
export function PPDSeverityBadge({ severity }: { severity?: string | null }) {
  const { t } = useTranslation();
  if (!severity) return <Badge>{t("common.notAvailable")}</Badge>;
  const color: BadgeColor =
    severity === "none" ? "green" : severity === "mild" ? "blue" : severity === "moderate" ? "amber" : "red";
  return (
    <Badge color={color}>{t(`status.ppd.${severity}`, { defaultValue: severity })}</Badge>
  );
}

/* Appointment status */
export function AppointmentStatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation();
  if (!status) return null;
  const color: BadgeColor =
    status === "completed"
      ? "green"
      : status === "confirmed"
      ? "blue"
      : status === "cancelled" || status === "missed"
      ? "red"
      : "amber";
  return <Badge color={color}>{t(`status.appointment.${status}`, { defaultValue: status })}</Badge>;
}

/* Referral status */
export function ReferralStatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation();
  if (!status) return null;
  const color: BadgeColor =
    status === "completed"
      ? "green"
      : status === "accepted"
      ? "blue"
      : status === "rejected"
      ? "red"
      : "amber";
  return <Badge color={color}>{t(`status.referral.${status}`, { defaultValue: status })}</Badge>;
}

/* Alert lifecycle status */
export function AlertStatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation();
  if (!status) return null;
  const color: BadgeColor =
    status === "resolved" ? "green" : status === "acknowledged" ? "blue" : "amber";
  return <Badge color={color}>{t(`status.alert.${status}`, { defaultValue: status })}</Badge>;
}

/* Recommendation priority */
export function PriorityBadge({ priority }: { priority?: string | null }) {
  const { t } = useTranslation();
  if (!priority) return null;
  const color: BadgeColor = priority === "high" ? "red" : priority === "medium" ? "amber" : "green";
  return <Badge color={color}>{t(`status.priority.${priority}`, { defaultValue: priority })}</Badge>;
}

/* Warning severity for symptoms */
export function SymptomSeverityBadge({ severity }: { severity?: string | null }) {
  const { t } = useTranslation();
  if (!severity) return null;
  const color: BadgeColor = severity === "mild" ? "green" : severity === "moderate" ? "amber" : "red";
  return <Badge color={color}>{t(`status.symptom.${severity}`, { defaultValue: severity })}</Badge>;
}

/* Trimester */
export function TrimesterLabel({ trimester }: { trimester?: number | string | null }) {
  const { t } = useTranslation();
  if (!trimester) return <>{t("common.notAvailable")}</>;
  return <>{t(`pregnancy.trimesterN`, { n: trimester })}</>;
}