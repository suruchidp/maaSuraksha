import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { pregnancyProfileSchema, appointmentToday } from "@maasuraksha/shared";
import { usePregnancy, useUpsertPregnancy } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { getApiErrorMessage, isNotFound } from "@/lib/api";
import { formatCalendarDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrimesterLabel } from "@/components/status/StatusLabels";
import PregnancyTracking from "./PregnancyTracking";
export default function PregnancyPage({ patientId }: { patientId?: string }) {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const pregnancy = usePregnancy(patientId);
  const upsert = useUpsertPregnancy();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const p = pregnancy.data;
  const label = (key: string) => t(`tracking.${key}`);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const list = (name: string) =>
      String(f.get(name) ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    const status = f.get("status");
    const parsed = pregnancyProfileSchema.safeParse({
      lmp: f.get("lmp"),
      gravida: Number(f.get("gravida")),
      para: Number(f.get("para")),
      riskFactors: list("riskFactors"),
      medicalHistory: list("medicalHistory"),
      status,
      endedOn:
        status === "completed" ? f.get("endedOn") || undefined : undefined,
      updatedAt: p?.updatedAt,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    upsert.mutate(
      { input: parsed.data, userId: patientId },
      {
        onSuccess: () => {
          setCreating(false);
          setError("");
        },
        onError: (e) => setError(getApiErrorMessage(e)),
      },
    );
  }
  if (pregnancy.isLoading) return <Spinner />;
  return (
    <div className="space-y-6">
      <PageHeader title={t("pregnancy.title")} subtitle={label("subtitle")} />
      {pregnancy.isError &&
        !p &&
        (isNotFound(pregnancy.error) ? (
          !creating && (
            <EmptyState
              title={t("pregnancy.notFound")}
              description={t("patient.pregnancy.ctaDescription")}
              action={
                <Button onClick={() => setCreating(true)}>
                  {t("patient.dashboard.setUpPregnancy")}
                </Button>
              }
            />
          )
        ) : (
          <ErrorState
            message={getApiErrorMessage(pregnancy.error)}
            onRetry={() => pregnancy.refetch()}
          />
        ))}
      {p && (
        <>
          <Card title={t("pregnancy.currentProfile")}>
            <dl className="grid sm:grid-cols-3 gap-4">
              <div>
                <dt>{t("pregnancy.gestationalWeek")}</dt>
                <dd className="text-2xl font-semibold">
                  {p.gestationalWeek} {t("pregnancy.weeks")}
                  {p.gestationalDays !== undefined &&
                    ` + ${p.gestationalDays} ${label("days")}`}
                </dd>
              </div>
              <div>
                <dt>{t("pregnancy.dueDate")}</dt>
                <dd>{formatCalendarDate(p.expectedDueDate, lang)}</dd>
              </div>
              <div>
                <dt>{t("pregnancy.trimester")}</dt>
                <dd>
                  <TrimesterLabel trimester={p.trimester} />
                </dd>
              </div>
              <div>
                <dt>{label("status")}</dt>
                <dd>{label(p.status ?? "active")}</dd>
              </div>
              <div>
                <dt>{t("pregnancy.riskStatus")}</dt>
                <dd>
                  {p.isHighRisk
                    ? t("pregnancy.highRisk")
                    : label("no_recorded_risks")}
                </dd>
              </div>
              <div>
                <dt>{label("as_of")}</dt>
                <dd>{p.asOf ? formatCalendarDate(p.asOf, lang) : "—"}</dd>
              </div>
            </dl>
            <p className="text-sm text-gray-500 mt-4">
              {label("estimate_note")}
            </p>
            {p.status === "completed" ? (
              <p className="mt-3">
                {label("completed_note")}{" "}
                {p.endedOn && formatCalendarDate(p.endedOn, lang)}
              </p>
            ) : p.datingNeedsReview ? (
              <p role="alert" className="text-amber-800 mt-3">
                {label("dating_review")}
              </p>
            ) : (
              <p className="mt-3">
                {(p.daysToDue ?? 0) < 0
                  ? `${Math.abs(p.daysToDue!)} ${label("days_past_due")}`
                  : `${p.daysToDue ?? "—"} ${label("days_to_due")}`}
              </p>
            )}
          </Card>
          <PregnancyTracking patientId={patientId} />
        </>
      )}
      {(p || creating) && (
        <Card
          title={p ? t("pregnancy.updateTitle") : t("pregnancy.createTitle")}
        >
          <form
            key={p?.updatedAt ?? "new"}
            onSubmit={submit}
            className="space-y-4 max-w-xl"
          >
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            <label className="block">
              {t("pregnancy.lmp")}
              <Input
                name="lmp"
                type="date"
                defaultValue={p?.lmp.slice(0, 10) ?? appointmentToday()}
                max={appointmentToday()}
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                {t("pregnancy.gravida")}
                <Input
                  name="gravida"
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  defaultValue={p?.gravida ?? 1}
                  required
                />
              </label>
              <label>
                {t("pregnancy.para")}
                <Input
                  name="para"
                  type="number"
                  min={0}
                  max={19}
                  step={1}
                  defaultValue={p?.para ?? 0}
                  required
                />
              </label>
            </div>
            <label className="block">
              {t("pregnancy.riskFactors")}
              <textarea
                name="riskFactors"
                className="w-full border rounded-lg p-2"
                rows={3}
                defaultValue={p?.riskFactors.join("\n")}
                maxLength={9000}
              />
            </label>
            <label className="block">
              {label("medical_history")}
              <textarea
                name="medicalHistory"
                className="w-full border rounded-lg p-2"
                rows={3}
                defaultValue={p?.medicalHistory.join("\n")}
                maxLength={9000}
              />
            </label>
            <p className="text-sm text-gray-500">{label("one_per_line")}</p>
            <label className="block">
              {label("status")}
              <select
                name="status"
                defaultValue={p?.status ?? "active"}
                className="w-full border rounded-lg p-2"
              >
                <option value="active">{label("active")}</option>
                <option value="completed">{label("completed")}</option>
              </select>
            </label>
            <label className="block">
              {label("ended_on")}
              <Input
                name="endedOn"
                type="date"
                defaultValue={p?.endedOn?.slice(0, 10)}
                max={appointmentToday()}
              />
            </label>
            <p className="text-sm text-gray-500">{label("lmp_change_note")}</p>
            <Button type="submit" loading={upsert.isPending}>
              {t("common.save")}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
