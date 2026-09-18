import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { COMMON_SYMPTOMS, symptomTriage } from "@maasuraksha/shared";
import { useAuthStore } from "@/stores/authStore";
import { useSymptoms, useCreateSymptom } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { formatDate, toLocalInputDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { SymptomSeverityBadge } from "@/components/status/StatusLabels";

type SymptomForm = {
  date: string;
  symptoms: string[];
  severity: "mild" | "moderate" | "severe" | "critical";
  notes?: string;
  onset?: string;
  durationHours?: number;
  frequency?: "once" | "occasional" | "daily" | "constant";
};

const SEVERITIES = ["mild", "moderate", "severe", "critical"] as const;

export default function SymptomsPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [savedTriage, setSavedTriage] = useState<string>();
  const symptoms = useSymptoms(undefined, 20, page, filter || undefined);
  const create = useCreateSymptom();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SymptomForm>({
    resolver: zodResolver(schemas.symptom),
    defaultValues: { date: toLocalInputDate(new Date()), severity: "mild", symptoms: [] },
  });

  const selected = watch("symptoms");
  const triage = symptomTriage(selected, watch("severity"));

  const toggleSymptom = (value: string) => {
    if (selected.includes(value)) {
      setValue(
        "symptoms",
        selected.filter((s) => s !== value),
        { shouldValidate: true, shouldDirty: true }
      );
    } else {
      setValue("symptoms", [...selected, value], { shouldValidate: true, shouldDirty: true });
    }
  };

  const onSubmit = (data: SymptomForm) => {
    create.mutate(
      {
        input: {
          date: data.date,
          symptoms: data.symptoms,
          severity: data.severity,
          notes: data.notes || undefined,
          onset: data.onset || undefined, durationHours: data.durationHours, frequency: data.frequency || undefined,
        },
        userId: user?.id,
      },
      {
        onSuccess: (entry) => {
          setSavedTriage(entry.triage);
          setPage(1);
          push(t("symptoms.saved"), "success");
          reset({ date: toLocalInputDate(new Date()), severity: "mild", symptoms: [] });
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  if (symptoms.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("symptoms.title")} subtitle={t("symptoms.subtitle")} />

      <p className="text-sm text-gray-600">{t("symptoms.tracking.help")} <a className="underline" href="https://www.cdc.gov/hearher/maternal-warning-signs/index.html" target="_blank" rel="noreferrer">{t("symptoms.tracking.source")}</a></p>
      {savedTriage && savedTriage !== "routine" && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4">{t(`symptoms.tracking.${savedTriage}`)}</div>}
      <Card title={t("symptoms.reportTitle")} tone="lavender">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label={t("symptoms.chooseSymptoms")} error={errors.symptoms?.message} required>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_SYMPTOMS.map((sym) => {
                const checked = selected.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    aria-pressed={checked}
                    className={`text-sm px-3 py-1.5 rounded-full border text-center font-medium transition-colors ${
                      checked
                        ? "chip-active"
                        : "chip"
                    }`}
                  >
                    {t(`symptoms.symptom.${sym}`, { defaultValue: sym })}
                  </button>
                );
              })}
            </div>
          </Field>
          {triage !== "routine" && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4">{t(`symptoms.tracking.${triage}`)}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("symptoms.severity")} htmlFor="severity" error={errors.severity?.message} required>
              <Select id="severity" {...register("severity")}>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.symptom.${s}`, { defaultValue: s === "critical" ? "Critical" : s })}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("symptoms.date")} htmlFor="date">
              <InputDate register={register} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label={t("symptoms.tracking.onset")} htmlFor="onset" error={errors.onset?.message}><input id="onset" type="date" max={toLocalInputDate(new Date())} className="input-field" {...register("onset")} /></Field>
            <Field label={t("symptoms.tracking.duration")} htmlFor="duration" error={errors.durationHours?.message}><input id="duration" type="number" min="0" max="8760" step="0.5" className="input-field" {...register("durationHours", { setValueAs: v => v === "" ? undefined : Number(v) })} /></Field>
            <Field label={t("symptoms.tracking.frequency")} htmlFor="frequency"><Select id="frequency" {...register("frequency")}><option value="">{t("symptoms.tracking.unspecified")}</option>{["once", "occasional", "daily", "constant"].map(v => <option key={v} value={v}>{t(`symptoms.tracking.${v}`)}</option>)}</Select></Field>
          </div>
          <Field label={t("symptoms.notes")} htmlFor="notes">
            <Textarea id="notes" rows={3} {...register("notes")} />
          </Field>
          <Button type="submit" loading={create.isPending}>
            {t("symptoms.submit")}
          </Button>
        </form>
      </Card>

      <Card title={t("symptoms.history")}>
        <Field label={t("symptoms.tracking.filter")} htmlFor="history-severity"><Select id="history-severity" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}><option value="">{t("symptoms.tracking.all")}</option>{SEVERITIES.map(v => <option key={v} value={v}>{t(`status.symptom.${v}`, { defaultValue: v === "critical" ? "Critical" : v })}</option>)}</Select></Field>
        {symptoms.isError ? (
          <ErrorState message={symptoms.error?.message} onRetry={() => symptoms.refetch()} />
        ) : (symptoms.data?.items ?? []).length === 0 ? (
          <EmptyState title={t("symptoms.none")} />
        ) : (
          <ul className="divide-y divide-rose-100/60">
            {(symptoms.data?.items ?? [])
              .map((entry) => (
                <li key={entry.id} className="py-3 flex items-start gap-3">
                  <SymptomSeverityBadge severity={entry.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.symptoms.map((s) => t(`symptoms.symptom.${s}`, { defaultValue: s === "critical" ? "Critical" : s })).join(", ")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(entry.date, lang)} · {t(`status.symptom.${entry.severity}`, { defaultValue: entry.severity })}
                    </p>
                    <p className="text-xs text-gray-500">{entry.onset && `${t("symptoms.tracking.onset")}: ${formatDate(entry.onset, lang)} · `}{entry.durationHours !== undefined && `${t("symptoms.tracking.duration")}: ${entry.durationHours} · `}{entry.frequency && t(`symptoms.tracking.${entry.frequency}`)}</p>
                    {entry.triage && entry.triage !== "routine" && <p className="text-sm text-rose-700">{t(`symptoms.tracking.${entry.triage}`)}</p>}
                    {entry.notes && <p className="text-xs text-gray-400 mt-0.5">{entry.notes}</p>}
                  </div>
                </li>
              ))}
          </ul>
        )}
        <nav aria-label={t("symptoms.tracking.pagination")} className="flex items-center justify-between mt-4"><Button type="button" disabled={page <= 1 || symptoms.isFetching} onClick={() => setPage(p => p-1)}>{t("symptoms.tracking.previous")}</Button><span>{page} / {Math.max(1, symptoms.data?.totalPages ?? 1)}</span><Button type="button" disabled={page >= (symptoms.data?.totalPages ?? 1) || symptoms.isFetching} onClick={() => setPage(p => p+1)}>{t("symptoms.tracking.next")}</Button></nav>
      </Card>
    </div>
  );
}

/* Small helper to keep the date input registered without cluttering the form. */
function InputDate({ register }: { register: UseFormRegister<SymptomForm> }) {
  const { t } = useTranslation();
  return <input id="date" type="date" max={toLocalInputDate(new Date())} className="input-field" {...register("date")} aria-label={t("symptoms.date")} />;
}