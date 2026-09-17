import { useTranslation } from "react-i18next";
import { useForm, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { COMMON_SYMPTOMS } from "@maasuraksha/shared";
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
  severity: "mild" | "moderate" | "severe";
  notes?: string;
};

const SEVERITIES = ["mild", "moderate", "severe"] as const;

export default function SymptomsPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const symptoms = useSymptoms(undefined, 50);
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
        },
        userId: user?.id,
      },
      {
        onSuccess: () => {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("symptoms.severity")} htmlFor="severity" error={errors.severity?.message} required>
              <Select id="severity" {...register("severity")}>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {t(`symptoms.severity.${s}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("symptoms.date")} htmlFor="date">
              <InputDate register={register} />
            </Field>
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
        {symptoms.isError ? (
          <ErrorState message={symptoms.error?.message} onRetry={() => symptoms.refetch()} />
        ) : (symptoms.data?.items ?? []).length === 0 ? (
          <EmptyState title={t("symptoms.none")} />
        ) : (
          <ul className="divide-y divide-rose-100/60">
            {(symptoms.data?.items ?? [])
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry) => (
                <li key={entry.id} className="py-3 flex items-start gap-3">
                  <SymptomSeverityBadge severity={entry.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.symptoms.map((s) => t(`symptoms.symptom.${s}`, { defaultValue: s })).join(", ")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(entry.date, lang)} · {t(`symptoms.severity.${entry.severity}`, { defaultValue: entry.severity })}
                    </p>
                    {entry.notes && <p className="text-xs text-gray-400 mt-0.5">{entry.notes}</p>}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* Small helper to keep the date input registered without cluttering the form. */
function InputDate({ register }: { register: UseFormRegister<SymptomForm> }) {
  const { t } = useTranslation();
  return <input id="date" type="date" className="input-field" {...register("date")} aria-label={t("symptoms.date")} />;
}