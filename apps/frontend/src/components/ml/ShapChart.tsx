import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatFeatureLabel } from "@/lib/mlUtils";

interface ShapEntry {
  feature: string;
  value: number;
}

export function ShapChart({
  shapValues,
  positiveColor = "#db2777",
  negativeColor = "#9ca3af",
}: {
  shapValues?: Record<string, number> | null;
  positiveColor?: string;
  negativeColor?: string;
}) {
  const { t } = useTranslation();
  if (!shapValues) return null;

  const data: ShapEntry[] = Object.entries(shapValues)
    .map(([feature, value]) => ({ feature, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  if (data.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        {t("assessment.shapTitle")}
      </h4>
      <p className="text-xs text-gray-500 mb-3">{t("assessment.shapDescription")}</p>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              dataKey="feature"
              type="category"
              width={120}
              tickFormatter={formatFeatureLabel}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(v: number) => [v.toFixed(4), t("assessment.shapValue")]}
              labelFormatter={(label) => formatFeatureLabel(label as string)}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.value >= 0 ? positiveColor : negativeColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}