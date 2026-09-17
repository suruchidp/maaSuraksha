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
import {
  EXPLAIN_FEATURES,
  ExplainFeature,
  formatFeatureLabel,
  formatFeatureValue,
  formatShapValue,
  GDM_IMPUTATION_DEFAULTS,
  getGDMImputationValue,
} from "@/lib/mlUtils";

export type ExplainKind = keyof typeof EXPLAIN_FEATURES;

interface ShapRow {
  feature: string;
  label: string;
  value: number;
  valueDisplay: string;
  modelUsedDisplay?: string;
  direction: "higher" | "lower" | "none";
}

interface ShapEntry {
  feature: string;
  value: number;
}

function makeValueDisplay(
  raw: number | boolean | undefined | null,
  meta: ExplainFeature,
  t: (key: string, params?: Record<string, unknown>) => string
): string {
  if (raw === undefined || raw === null) return t("common.notRecorded");
  if (typeof raw === "boolean") return raw ? t("common.yes") : t("common.no");
  if (Number.isNaN(Number(raw))) return t("common.notRecorded");
  const formatted = formatFeatureValue(raw, meta);
  return formatted ?? raw.toString();
}

function directionOf(value: number): ShapRow["direction"] {
  if (value > 0) return "higher";
  if (value < 0) return "lower";
  return "none";
}

/**
 * When a GDM numeric feature was not recorded, the trained model still uses a
 * value for inference: the median imputed from its training data (metadata
 * `defaults`). Only print the exact configured number when the served model
 * version matches the version the number was read from; otherwise downgrade to
 * an honest, version-agnostic statement.
 */
function modelUsedDisplay(
  row: ShapRow,
  meta: ExplainFeature,
  modelVersion: string | undefined,
  t: (key: string, params?: Record<string, unknown>) => string
): string | undefined {
  if (row.valueDisplay !== t("common.notRecorded")) return undefined;
  const imputed = getGDMImputationValue(row.feature);
  if (imputed === undefined) return undefined;
  if (modelVersion === GDM_IMPUTATION_DEFAULTS.modelVersion) {
    const withUnit = formatFeatureValue(imputed, meta) ?? String(imputed);
    return `${withUnit} · ${t("assessment.shapImputationNote")}`;
  }
  return t("assessment.shapImputedGeneric");
}

export function ShapChart({
  shapValues,
  inputValues,
  kind,
  modelVersion,
  positiveColor = "#db2777",
  negativeColor = "#9ca3af",
}: {
  shapValues?: Record<string, number> | null;
  inputValues?: Record<string, number | boolean> | null;
  kind: ExplainKind;
  modelVersion?: string;
  positiveColor?: string;
  negativeColor?: string;
}) {
  const { t } = useTranslation();
  if (!shapValues) return null;

  const featuresByShapKey = new Map<string, ExplainFeature>(
    EXPLAIN_FEATURES[kind].map((f) => [f.shapKey, f])
  );

  const rows: ShapRow[] = [];
  for (const [feature, value] of Object.entries(shapValues)) {
    const meta = featuresByShapKey.get(feature);
    if (!meta) continue;
    const row: ShapRow = {
      feature,
      label: meta.label,
      value,
      valueDisplay: makeValueDisplay(
        inputValues?.[meta.inputKey] ?? undefined,
        meta,
        t
      ),
      direction: directionOf(value),
    };
    row.modelUsedDisplay = modelUsedDisplay(row, meta, modelVersion, t);
    rows.push(row);
  }

  if (rows.length === 0) return null;

  rows.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const chartData: ShapEntry[] = rows.map((r) => ({
    feature: r.feature,
    value: r.value,
  }));

  const directionClass: Record<ShapRow["direction"], string> = {
    higher: "text-pink-700",
    lower: "text-gray-600",
    none: "text-gray-400",
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        {t("assessment.shapTitle")}
      </h4>
      <p className="text-xs text-gray-500 mb-3">{t("assessment.shapDescription")}</p>

      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.feature}
            className="rounded-lg border border-gray-200 bg-white p-3"
          >
            <div className="text-sm font-semibold text-gray-800">{row.label}</div>
            <dl className="mt-1 space-y-0.5 text-sm">
              <div className="grid grid-cols-[max-content_1fr] gap-x-3">
                <dt className="text-gray-500">{t("assessment.shapPatientValueLabel")}</dt>
                <dd className="text-gray-800">{row.valueDisplay}</dd>
              </div>
              {row.modelUsedDisplay && (
                <div className="grid grid-cols-[max-content_1fr] gap-x-3">
                  <dt className="text-gray-500">{t("assessment.shapModelUsedLabel")}</dt>
                  <dd className="text-gray-700">{row.modelUsedDisplay}</dd>
                </div>
              )}
              <div className="grid grid-cols-[max-content_1fr] gap-x-3">
                <dt className="text-gray-500">{t("assessment.shapContributionLabel")}</dt>
                <dd
                  className={`tabular-nums ${
                    row.value > 0 ? "text-pink-700" : row.value < 0 ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {formatShapValue(row.value)}
                </dd>
              </div>
              <div className="grid grid-cols-[max-content_1fr] gap-x-3">
                <dt className="text-gray-500">{t("assessment.shapDirectionLabel")}</dt>
                <dd className={directionClass[row.direction]}>
                  {row.direction === "higher" && t("assessment.shapHigherRisk")}
                  {row.direction === "lower" && t("assessment.shapLowerRisk")}
                  {row.direction === "none" && t("assessment.shapNoEffect")}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <p className="text-xs text-gray-500 mt-3">{t("assessment.shapLegendNote")}</p>

      <div className="h-48 sm:h-56 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 12 }}>
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              dataKey="feature"
              type="category"
              width={120}
              tickFormatter={formatFeatureLabel}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(v: number) => [formatShapValue(v), t("assessment.shapValue")]}
              labelFormatter={(label) => formatFeatureLabel(label as string)}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.value >= 0 ? positiveColor : negativeColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        {t("assessment.shapChartRelationship")}
      </p>

      <p className="text-xs text-gray-400 mt-2 italic">
        {t("assessment.shapCaveatNote")}
      </p>
    </div>
  );
}