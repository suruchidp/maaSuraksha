import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { HealthMetricDTO } from "@/lib/types";
import { formatDate } from "@/lib/date";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { EmptyState } from "@/components/ui/EmptyState";

export type MetricKey = keyof Pick<
  HealthMetricDTO,
  "systolicBP" | "diastolicBP" | "weight" | "glucose" | "heartRate" | "temperature" | "hemoglobin"
>;

export function MetricTrendChart({
  metrics,
  metricKey,
  color = "#db2777",
  unit,
}: {
  metrics: HealthMetricDTO[];
  metricKey: MetricKey;
  color?: string;
  unit?: string;
}) {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();

  const rows = metrics
    .filter((m) => m[metricKey] !== undefined && m[metricKey] !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      date: formatDate(m.date, lang),
      value: m[metricKey] as number,
    }));

  if (rows.length < 1) {
    return (
      <div className="py-6">
        <EmptyState title={t("charts.noData")} description={t("charts.noDataDescription")} />
      </div>
    );
  }

  const min = Math.min(...rows.map((r) => r.value));
  const max = Math.max(...rows.map((r) => r.value));
  const pad = max - min < 1 ? 1 : (max - min) * 0.15;

  return (
    <div className="h-48 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fontSize: 11 }}
            unit={unit ?? ""}
          />
          <Tooltip
            formatter={(value: number) => [
              `${value}${unit ?? ""}`,
              t("charts.value"),
            ]}
            labelFormatter={(label) => String(label)}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}