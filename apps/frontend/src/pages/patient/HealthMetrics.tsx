import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/authStore";
import { useHealthMetrics, useCreateHealthMetric } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { formatDate, toLocalInputDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Language } from "@maasuraksha/shared";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricTrendChart } from "@/components/charts/MetricTrendChart";
import type { HealthMetricDTO } from "@/lib/types";

type MetricForm = {
  date: string;
  systolicBP?: number;
  diastolicBP?: number;
  weight?: number;
  glucose?: number;
  heartRate?: number;
  temperature?: number;
  hemoglobin?: number;
  notes?: string;
};

export default function HealthMetricsPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const metrics = useHealthMetrics(undefined, 100);
  const create = useCreateHealthMetric();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MetricForm>({
    resolver: zodResolver(schemas.healthMetric),
    defaultValues: { date: toLocalInputDate(new Date()) },
  });

  const onSubmit = (data: MetricForm) => {
    create.mutate(
      {
        input: {
          date: data.date,
          systolicBP: data.systolicBP || undefined,
          diastolicBP: data.diastolicBP || undefined,
          weight: data.weight || undefined,
          glucose: data.glucose || undefined,
          heartRate: data.heartRate || undefined,
          temperature: data.temperature || undefined,
          hemoglobin: data.hemoglobin || undefined,
          notes: data.notes || undefined,
        },
        userId: user?.id,
      },
      {
        onSuccess: () => {
          push(t("metrics.saved"), "success");
          reset({ date: toLocalInputDate(new Date()) });
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  if (metrics.isLoading) return <Spinner />;

  const items = metrics.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("metrics.title")} subtitle={t("metrics.subtitle")} />

      <Card title={t("metrics.logTitle")}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label={t("metrics.date")} htmlFor="date">
              <Input id="date" type="date" {...register("date")} />
            </Field>
            <Field label={t("metrics.systolicBP")} htmlFor="systolicBP" error={errors.systolicBP?.message}>
              <Input id="systolicBP" type="number" {...register("systolicBP", { valueAsNumber: true })} placeholder="120" />
            </Field>
            <Field label={t("metrics.diastolicBP")} htmlFor="diastolicBP" error={errors.diastolicBP?.message}>
              <Input id="diastolicBP" type="number" {...register("diastolicBP", { valueAsNumber: true })} placeholder="80" />
            </Field>
            <Field label={`${t("metrics.weight")} (kg)`} htmlFor="weight" error={errors.weight?.message}>
              <Input id="weight" type="number" step="0.1" {...register("weight", { valueAsNumber: true })} placeholder="60" />
            </Field>
            <Field label={`${t("metrics.glucose")} (mg/dL)`} htmlFor="glucose" error={errors.glucose?.message}>
              <Input id="glucose" type="number" {...register("glucose", { valueAsNumber: true })} placeholder="95" />
            </Field>
            <Field label={`${t("metrics.heartRate")} (bpm)`} htmlFor="heartRate" error={errors.heartRate?.message}>
              <Input id="heartRate" type="number" {...register("heartRate", { valueAsNumber: true })} placeholder="80" />
            </Field>
            <Field label={`${t("metrics.temperature")} (°C)`} htmlFor="temperature" error={errors.temperature?.message}>
              <Input id="temperature" type="number" step="0.1" {...register("temperature", { valueAsNumber: true })} placeholder="37.0" />
            </Field>
            <Field label={`${t("metrics.hemoglobin")} (g/dL)`} htmlFor="hemoglobin" error={errors.hemoglobin?.message}>
              <Input id="hemoglobin" type="number" step="0.1" {...register("hemoglobin", { valueAsNumber: true })} placeholder="11" />
            </Field>
            <div className="col-span-2 lg:col-span-4">
              <Field label={t("metrics.notes")} htmlFor="notes">
                <Textarea id="notes" rows={2} {...register("notes")} />
              </Field>
            </div>
          </div>
          <Button type="submit" loading={create.isPending}>
            {t("metrics.saveMetric")}
          </Button>
        </form>
      </Card>

      {metrics.isError ? (
        <ErrorState message={metrics.error?.message} onRetry={() => metrics.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={t("metrics.none")} description={t("metrics.noneDescription")} />
        </Card>
      ) : (
        <>
          <Card title={t("metrics.trends")}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendBlock
                title={t("metrics.trendBP")}
                chart={
                  <MetricTrendChart
                    metrics={items}
                    metricKey="systolicBP"
                    color="#db2777"
                    unit={` ${t("metrics.unitMmHg")}`}
                  />
                }
              />
              <TrendBlock
                title={t("metrics.trendWeight")}
                chart={<MetricTrendChart metrics={items} metricKey="weight" color="#16a34a" unit=" kg" />}
              />
              <TrendBlock
                title={t("metrics.trendGlucose")}
                chart={
                  <MetricTrendChart
                    metrics={items}
                    metricKey="glucose"
                    color="#2563eb"
                    unit={` ${t("metrics.unitMgDl")}`}
                  />
                }
              />
              <TrendBlock
                title={t("metrics.trendHeartRate")}
                chart={
                  <MetricTrendChart
                    metrics={items}
                    metricKey="heartRate"
                    color="#d97706"
                    unit={` ${t("metrics.unitBpm")}`}
                  />
                }
              />
            </div>
          </Card>

          <Card title={t("metrics.history")}>
            <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {[...items]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((m) => (
                  <MetricRow key={m.id} metric={m} lang={lang} t={t} />
                ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

function TrendBlock({ title, chart }: { title: string; chart: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      {chart}
    </div>
  );
}

function MetricRow({
  metric,
  lang,
  t,
}: {
  metric: HealthMetricDTO;
  lang: Language;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const rows: { label: string; value?: number }[] = [
    { label: t("metrics.systolicBP"), value: metric.systolicBP },
    { label: t("metrics.diastolicBP"), value: metric.diastolicBP },
    { label: t("metrics.weight"), value: metric.weight },
    { label: t("metrics.glucose"), value: metric.glucose },
    { label: t("metrics.heartRate"), value: metric.heartRate },
    { label: t("metrics.temperature"), value: metric.temperature },
    { label: t("metrics.hemoglobin"), value: metric.hemoglobin },
  ];
  const present = rows.filter((r) => r.value !== undefined && r.value !== null);
  return (
    <li className="py-3 flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{formatDate(metric.date, lang)}</p>
        <p className="text-xs text-gray-500 mt-0.5">{present.map((r) => `${r.label}: ${r.value}`).join(" · ")}</p>
        {metric.notes && <p className="text-xs text-gray-400 mt-0.5">{metric.notes}</p>}
      </div>
    </li>
  );
}