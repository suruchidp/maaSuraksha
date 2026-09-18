import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import {
  getPregnancyTracking,
  updatePregnancyMilestone,
} from "@/services/pregnancy";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatCalendarDate, formatDateTime } from "@/lib/date";
import { getApiErrorMessage } from "@/lib/api";
import {
  MetricTrendChart,
  type MetricKey,
} from "@/components/charts/MetricTrendChart";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
const metricUnits: Record<MetricKey, string> = {
  systolicBP: " mmHg",
  diastolicBP: " mmHg",
  weight: " kg",
  glucose: " mg/dL",
  heartRate: " bpm",
  temperature: " °C",
  hemoglobin: " g/dL",
};
export default function PregnancyTracking({
  patientId,
}: {
  patientId?: string;
}) {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const [metric, setMetric] = useState<MetricKey>("weight");
  const label = (key: string) =>
    t(`tracking.${key}`, { defaultValue: key.replace(/_/g, " ") });
  const tracking = useQuery({
    queryKey: ["pregnancy-tracking", user?.id, patientId],
    queryFn: () => getPregnancyTracking(patientId),
    enabled: !!user,
    refetchInterval: 60000,
    retry: 1,
  });
  const update = useMutation({
    mutationFn: ({ key, completed }: { key: string; completed: boolean }) =>
      updatePregnancyMilestone(
        key,
        completed,
        tracking.data!.profile.updatedAt,
        patientId,
      ),
    onSuccess: () => {
      setError("");
      void qc.invalidateQueries({ queryKey: ["pregnancy-tracking"] });
      void qc.invalidateQueries({ queryKey: ["pregnancy"] });
      void qc.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });
  if (tracking.isLoading) return <Spinner />;
  if (tracking.isError)
    return (
      <ErrorState
        message={getApiErrorMessage(tracking.error)}
        onRetry={() => tracking.refetch()}
      />
    );
  if (!tracking.data) return null;
  const { profile: p, milestones, metrics, context } = tracking.data;
  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <Card title={label("timeline")}>
        <progress
          aria-label={label("timeline")}
          value={Math.min(
            280,
            p.gestationalWeek * 7 + (p.gestationalDays ?? 0),
          )}
          max={280}
          className="w-full accent-pink-600"
        />
        <div className="flex justify-between text-sm">
          <span>0 {label("weeks")}</span>
          <span>14 {label("weeks")}</span>
          <span>28 {label("weeks")}</span>
          <span>40 {label("weeks")}</span>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          {label("completed_weeks_note")}
        </p>
      </Card>
      <Card title={label("milestones")}>
        <p className="text-sm text-gray-500 mb-4">{label("milestone_note")}</p>
        <div className="space-y-4">
          {milestones.map((m) => (
            <article key={m.key} className="border rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap justify-between gap-3">
                <h3 className="font-semibold">{label(m.key)}</h3>
                <span className="text-sm">{label(m.state)}</span>
              </div>
              <p>
                {m.fromWeek}–{m.toWeek} {label("weeks")} ·{" "}
                {formatCalendarDate(m.date, lang)}
              </p>
              <p className="text-sm text-gray-600">
                {label(`${m.key}_description`)}
              </p>
              {m.completion && (
                <p className="text-sm">
                  {label("marked_on")}:{" "}
                  {formatDateTime(m.completion.completedAt, lang)}
                </p>
              )}
              <div className="flex items-center gap-3">
                {p.status !== "completed" && (
                  <Button
                    variant="outline"
                    disabled={update.isPending}
                    onClick={() =>
                      update.mutate({
                        key: m.key,
                        completed: m.state !== "recorded",
                      })
                    }
                  >
                    {label(
                      m.state === "recorded"
                        ? "undo_completion"
                        : "mark_complete",
                    )}
                  </Button>
                )}
                <a
                  href={m.source}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-700 underline"
                >
                  {label("source")}
                </a>
              </div>
            </article>
          ))}
        </div>
      </Card>
      <Card title={label("health_trends")}>
        <label className="block mb-3">
          {label("metric")}
          <select
            className="border rounded-lg p-2 ml-3"
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
          >
            {Object.keys(metricUnits).map((k) => (
              <option key={k} value={k}>
                {t(`records.${k}`)}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-gray-500">
          {label("current_pregnancy_only")} · {metrics.included} /{" "}
          {metrics.total} {label("entries")}
          {metrics.truncated && ` · ${label("truncated")}`}
        </p>
        <MetricTrendChart
          metricKey={metric}
          unit={metricUnits[metric]}
          metrics={metrics.items}
        />
        {!!metrics.items.length && (
          <details>
            <summary className="cursor-pointer text-primary-700">
              {label("reading_history")}
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">{label("date")}</th>
                    <th className="text-left p-2">{t(`records.${metric}`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.items
                    .filter((m) => m[metric] !== undefined)
                    .map((m, i) => (
                      <tr key={i}>
                        <td className="p-2">{formatDateTime(m.date, lang)}</td>
                        <td className="p-2">
                          {m[metric]}
                          {metricUnits[metric]}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </Card>
      <Card title={label("connected_care")}>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            ["maternal", context.maternal],
            ["gdm", context.gdm],
          ].map(([key, a]) => {
            const assessment = a as typeof context.maternal;
            return (
              <div key={String(key)}>
                <h3 className="font-semibold">{label(String(key))}</h3>
                <p>
                  {assessment
                    ? `${label(assessment.status)}${assessment.status === "completed" && assessment.riskLevel ? ` · ${label(assessment.riskLevel)}` : ""}`
                    : label("not_assessed")}
                </p>
                {assessment && (
                  <p className="text-sm text-gray-500">
                    {formatDateTime(assessment.createdAt, lang)}
                  </p>
                )}
              </div>
            );
          })}
          <div>
            <h3 className="font-semibold">{label("latest_symptom")}</h3>
            <p>
              {context.latestSymptom
                ? `${context.latestSymptom.symptoms.join(", ")} · ${label(context.latestSymptom.severity)}`
                : label("none_logged")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">{label("open_alerts")}</h3>
            <p>{context.pendingAlerts}</p>
          </div>
        </div>
        <h3 className="font-semibold mt-4">{label("next_appointments")}</h3>
        {context.nextAppointments.length ? (
          context.nextAppointments.map((a, i) => (
            <p key={i}>
              {formatCalendarDate(a.date, lang)} · {a.time}{" "}
              {label("india_time")} · {a.type} · {label(a.status)}
            </p>
          ))
        ) : (
          <p>{label("no_appointments")}</p>
        )}
        {user?.role === "PATIENT" && (
          <nav
            aria-label={label("connected_care")}
            className="flex flex-wrap gap-3 mt-4"
          >
            {[
              ["assessments", "risk"],
              ["alerts", "alerts"],
              ["diet", "diet"],
              ["symptoms", "symptoms"],
              ["appointments", "appointments"],
              ["metrics", "metrics"],
            ].map(([path, key]) => (
              <a
                key={path}
                href={`/patient/${path}`}
                className="text-primary-700 underline"
              >
                {label(key)}
              </a>
            ))}
          </nav>
        )}
      </Card>
    </div>
  );
}
