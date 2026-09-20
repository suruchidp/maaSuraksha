import { useTranslation } from "react-i18next";
import { Language } from "@maasuraksha/shared";
import {
  useHealthMetrics,
  useSymptoms,
  useMaternalRiskHistory,
  useGDMHistory,
  usePPDHistory,
  useReports,
  useAppointments,
  useReferrals,
} from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  RiskBadge,
  AssessmentStatusBadge,
  PPDSeverityBadge,
  SymptomSeverityBadge,
  AppointmentStatusBadge,
  ReferralStatusBadge,
} from "@/components/status/StatusLabels";

interface PatientRecordProps {
  patientId: string;
  showAssessments?: boolean;
}

export function PatientRecord({ patientId, showAssessments = false }: PatientRecordProps) {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();

  const metrics = useHealthMetrics(patientId, 50);
  const symptoms = useSymptoms(patientId, 20);
  const maternal = useMaternalRiskHistory(patientId, 5);
  const gdm = useGDMHistory(patientId, 5);
  const ppd = usePPDHistory(patientId, 5);
  const reports = useReports(20, patientId);
  const appointments = useAppointments(patientId, 20);
  const referrals = useReferrals(patientId, 20);

  const loading =
    metrics.isLoading || symptoms.isLoading || reports.isLoading || appointments.isLoading || referrals.isLoading;

  if (loading) return <Spinner />;

  const metricItems = metrics.data?.items ?? [];
  const symptomItems = symptoms.data?.items ?? [];

  const latestMaternal = (maternal.data?.items ?? [])[0];
  const latestGDM = (gdm.data?.items ?? [])[0];
  const latestPPD = (ppd.data?.items ?? [])[0];

  return (
    <div className="space-y-6">
      <Card title={t("caregiver.healthHistory")}>
        {metricItems.length === 0 ? (
          <EmptyState title={t("caregiver.noHealthHistory")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-rose-100/60">
                  <th className="py-2 pr-3 font-medium">{t("metrics.date")}</th>
                  <th className="py-2 pr-3 font-medium">{t("metrics.bp")}</th>
                  <th className="py-2 pr-3 font-medium">{t("metrics.weight")}</th>
                  <th className="py-2 pr-3 font-medium">{t("metrics.glucose")}</th>
                  <th className="py-2 pr-3 font-medium">{t("metrics.heartRate")}</th>
                  <th className="py-2 pr-3 font-medium">{t("metrics.temperature")}</th>
                  <th className="py-2 font-medium">{t("metrics.hemoglobin")}</th>
                </tr>
              </thead>
              <tbody>
                {metricItems.map((m) => (
                  <tr key={m.id} className="border-b border-rose-100/40 last:border-0">
                    <td className="py-2 pr-3 text-gray-700 whitespace-nowrap">{formatDate(m.date, lang)}</td>
                    <td className="py-2 pr-3 text-gray-700">
                      {m.systolicBP !== undefined ? `${m.systolicBP}/${m.diastolicBP ?? "—"}` : "—"}
                    </td>
                    <td className="py-2 pr-3 text-gray-700">{m.weight ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray-700">{m.glucose ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray-700">{m.heartRate ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray-700">{m.temperature ?? "—"}</td>
                    <td className="py-2 text-gray-700">{m.hemoglobin ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={t("caregiver.symptoms")}>
        {symptomItems.length === 0 ? (
          <EmptyState title={t("caregiver.noSymptoms")} />
        ) : (
          <ul className="divide-y divide-rose-100/60">
            {symptomItems.slice(0, 10).map((symptom) => (
              <li key={symptom.id} className="py-3 flex items-start gap-3">
                <SymptomSeverityBadge severity={symptom.severity} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{symptom.symptoms.join(", ")}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(symptom.date, lang)}
                    {symptom.notes ? ` · ${symptom.notes}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {showAssessments && (
        <Card title={t("caregiver.assessments")}>
          <p className="text-xs text-gray-500 mb-4">{t("assessments.subtitle")}</p>
          <div className="grid gap-6 lg:grid-cols-3">
            <AssessmentBlock
              title={t("caregiver.maternalRisk")}
              status={latestMaternal?.status}
              level={latestMaternal?.riskLevel}
              score={latestMaternal?.riskScore}
              date={latestMaternal?.createdAt}
              empty={t("caregiver.noAssessments")}
              onFormatDate={formatDate}
              lang={lang}
            />
            <AssessmentBlock
              title={t("caregiver.gdmScreening")}
              note={t("caregiver.screeningFollowUp")}
              status={latestGDM?.status}
              level={latestGDM?.riskLevel}
              score={latestGDM?.riskScore}
              date={latestGDM?.createdAt}
              empty={t("caregiver.noAssessments")}
              onFormatDate={formatDate}
              lang={lang}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">{t("caregiver.ppdScreening")}</p>
              {!latestPPD ? (
                <p className="text-sm text-gray-500">{t("caregiver.noAssessments")}</p>
              ) : (
                <div className="space-y-3 rounded-xl border border-rose-100 bg-rose-50/30 p-3">
                  <div className="flex items-center gap-2">
                    <AssessmentStatusBadge status={latestPPD.status} />
                    <PPDSeverityBadge severity={latestPPD.severity} />
                  </div>
                  {latestPPD.edinburghScore !== undefined && (
                    <p className="text-sm text-gray-700">
                      {t("assessments.ppd.epdsScore")}: {latestPPD.edinburghScore}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">{formatDate(latestPPD.createdAt, lang)}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card title={t("caregiver.reports")}>
        {(reports.data?.items ?? []).length === 0 ? (
          <EmptyState title={t("caregiver.noReports")} />
        ) : (
          <ul className="divide-y divide-rose-100/60">
            {(reports.data?.items ?? []).map((report) => (
              <li key={report.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{report.title}</p>
                  <p className="text-xs text-gray-500">{report.type}</p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(report.createdAt, lang)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t("caregiver.appointments")}>
          {(appointments.data?.items ?? []).length === 0 ? (
            <EmptyState title={t("caregiver.noAppointments")} />
          ) : (
            <ul className="divide-y divide-rose-100/60">
              {(appointments.data?.items ?? []).map((appt) => (
                <li key={appt.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {t(`appointments.typeOptions.${appt.type}`, { defaultValue: appt.type })}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(appt.date, lang)} · {appt.time}</p>
                  </div>
                  <AppointmentStatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t("caregiver.referrals")}>
          {(referrals.data?.items ?? []).length === 0 ? (
            <EmptyState title={t("caregiver.noReferrals")} />
          ) : (
            <ul className="divide-y divide-rose-100/60">
              {(referrals.data?.items ?? []).map((ref) => (
                <li key={ref.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ref.reason}</p>
                    <p className="text-xs text-gray-500">{ref.facility ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(ref.createdAt, lang)}</p>
                    <ReferralStatusBadge status={ref.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function AssessmentBlock({
  title,
  note,
  status,
  level,
  score,
  date,
  empty,
  onFormatDate,
  lang,
}: {
  title: string;
  note?: string;
  status?: string;
  level?: string;
  score?: number;
  date?: string;
  empty: string;
  onFormatDate: typeof formatDate;
  lang: Language;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900 mb-2">{title}</p>
      {!status || !level ? (
        <p className="text-sm text-gray-500">{empty}</p>
      ) : (
        <div className="space-y-3 rounded-xl border border-rose-100 bg-rose-50/30 p-3">
          <div className="flex items-center gap-2">
            <AssessmentStatusBadge status={status} />
            <RiskBadge level={level} />
          </div>
          {score !== undefined && score !== null && (
            <p className="text-sm text-gray-700">{Math.round(score * 100)}%</p>
          )}
          <p className="text-xs text-gray-500">{date ? onFormatDate(date, lang) : "—"}</p>
          {note && <p className="text-xs text-gray-500">{note}</p>}
        </div>
      )}
    </div>
  );
}