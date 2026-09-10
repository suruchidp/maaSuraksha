import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/authStore";
import {
  useCreateMaternalRisk,
  useCreateGDM,
  useCreatePPD,
  useMaternalRiskHistory,
  useGDMHistory,
  usePPDHistory,
} from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Checkbox } from "@/components/ui/Checkbox";
import { AssessmentResult } from "@/components/ml/AssessmentResult";
import { ShapChart } from "@/components/ml/ShapChart";
import { AssessmentStatusBadge } from "@/components/status/StatusLabels";

/* ---------------- Maternal risk ---------------- */

type MaternalForm = {
  age: number;
  systolicBP: number;
  diastolicBP: number;
  bloodSugar: number;
  bodyTemp: number;
  heartRate: number;
  bmi: number;
  gestationalWeek: number;
  hemoglobin?: number;
};

export function MaternalRiskPanel({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const actor = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const history = useMaternalRiskHistory(userId, 10);
  const create = useCreateMaternalRisk();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaternalForm>({
    resolver: zodResolver(schemas.maternalRisk),
    defaultValues: { age: 25, gestationalWeek: 12, bmi: 22 },
  });

  const onSubmit = (data: MaternalForm) => {
    create.mutate(
      {
        user: userId,
        age: Number(data.age),
        systolicBP: Number(data.systolicBP),
        diastolicBP: Number(data.diastolicBP),
        bloodSugar: Number(data.bloodSugar),
        bodyTemp: Number(data.bodyTemp),
        heartRate: Number(data.heartRate),
        bmi: Number(data.bmi),
        gestationalWeek: Number(data.gestationalWeek),
        hemoglobin: data.hemoglobin ? Number(data.hemoglobin) : undefined,
      },
      {
        onSuccess: () => {
          push(t("assessments.submitted"), "success");
          reset();
        },
        onError: (err) => {
          void err;
          push(getApiErrorMessage(err), "error");
        },
      }
    );
  };

  const result = create.data;

  return (
    <Card title={t("assessments.maternal.title")}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6" noValidate>
        <Field label={t("assessments.maternal.age")} htmlFor="mr-age" error={errors.age?.message} required>
          <Input id="mr-age" type="number" {...register("age", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.systolicBP")} htmlFor="mr-sbp" error={errors.systolicBP?.message} required>
          <Input id="mr-sbp" type="number" {...register("systolicBP", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.diastolicBP")} htmlFor="mr-dbp" error={errors.diastolicBP?.message} required>
          <Input id="mr-dbp" type="number" {...register("diastolicBP", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.maternal.bloodSugar")} htmlFor="mr-sugar" error={errors.bloodSugar?.message} required>
          <Input id="mr-sugar" type="number" {...register("bloodSugar", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.maternal.bodyTemp")} htmlFor="mr-temp" error={errors.bodyTemp?.message} required>
          <Input id="mr-temp" type="number" step="0.1" {...register("bodyTemp", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.maternal.heartRate")} htmlFor="mr-hr" error={errors.heartRate?.message} required>
          <Input id="mr-hr" type="number" {...register("heartRate", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.maternal.bmi")} htmlFor="mr-bmi" error={errors.bmi?.message} required>
          <Input id="mr-bmi" type="number" step="0.1" {...register("bmi", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.maternal.gestationalWeek")} htmlFor="mr-gw" error={errors.gestationalWeek?.message} required>
          <Input id="mr-gw" type="number" {...register("gestationalWeek", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.maternal.hemoglobin")} htmlFor="mr-hb" error={errors.hemoglobin?.message}>
          <Input id="mr-hb" type="number" step="0.1" {...register("hemoglobin", { valueAsNumber: true })} />
        </Field>
        <div className="col-span-2 lg:col-span-3">
          <Button type="submit" loading={create.isPending}>
            {t("assessments.runAssessment")}
          </Button>
        </div>
      </form>

      {create.isPending && <Spinner />}

      {result && (
        <AssessmentResult
          title={t("assessments.maternal.result")}
          status={result.status}
          riskLevel={result.riskLevel}
          riskScore={result.riskScore}
          recommendations={result.recommendations}
          message={result.message}
          modelVersion={result.modelVersion}
          shapChart={<ShapChart shapValues={result.shapValues} />}
        />
      )}

      <AssessmentHistory title={t("assessments.maternal.history")} loading={history.isLoading} error={history.error?.message} onRetry={() => history.refetch()}>
        {(history.data?.items ?? []).map((a) => (
          <li key={a.id} className="py-3 flex items-start gap-3">
            <AssessmentStatusBadge status={a.status} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {a.riskLevel ? t(`assessments.risk.${a.riskLevel}`, { defaultValue: a.riskLevel }) : t("common.notAvailable")}
                {a.riskScore !== undefined && a.riskScore !== null ? ` · ${Math.round(a.riskScore * 100)}%` : ""}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(a.createdAt, lang)}</p>
            </div>
          </li>
        ))}
      </AssessmentHistory>
    </Card>
  );
}

/* ---------------- GDM ---------------- */

type GDMForm = {
  age: number;
  bmi: number;
  fastingGlucose: number;
  postprandialGlucose?: number;
  hba1c?: number;
  gestationalWeek: number;
  familyHistoryDiabetes: boolean;
  previousGDM: boolean;
};

export function GDMPanel({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const history = useGDMHistory(userId, 10);
  const create = useCreateGDM();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GDMForm>({
    resolver: zodResolver(schemas.gdm),
    defaultValues: { age: 25, bmi: 22, gestationalWeek: 12, familyHistoryDiabetes: false, previousGDM: false },
  });

  const onSubmit = (data: GDMForm) => {
    create.mutate(
      {
        user: userId,
        age: Number(data.age),
        bmi: Number(data.bmi),
        fastingGlucose: Number(data.fastingGlucose),
        postprandialGlucose: data.postprandialGlucose ? Number(data.postprandialGlucose) : undefined,
        hba1c: data.hba1c ? Number(data.hba1c) : undefined,
        gestationalWeek: Number(data.gestationalWeek),
        familyHistoryDiabetes: data.familyHistoryDiabetes,
        previousGDM: data.previousGDM,
      },
      {
        onSuccess: () => {
          push(t("assessments.submitted"), "success");
          reset({ familyHistoryDiabetes: false, previousGDM: false });
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  const result = create.data;

  return (
    <Card title={t("assessments.gdm.title")}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6" noValidate>
        <Field label={t("assessments.gdm.age")} htmlFor="gdm-age" error={errors.age?.message} required>
          <Input id="gdm-age" type="number" {...register("age", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.gdm.bmi")} htmlFor="gdm-bmi" error={errors.bmi?.message} required>
          <Input id="gdm-bmi" type="number" step="0.1" {...register("bmi", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.gdm.fastingGlucose")} htmlFor="gdm-fg" error={errors.fastingGlucose?.message} required>
          <Input id="gdm-fg" type="number" {...register("fastingGlucose", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.gdm.postprandialGlucose")} htmlFor="gdm-pg" error={errors.postprandialGlucose?.message}>
          <Input id="gdm-pg" type="number" {...register("postprandialGlucose", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.gdm.hba1c")} htmlFor="gdm-hba1c" error={errors.hba1c?.message}>
          <Input id="gdm-hba1c" type="number" step="0.1" {...register("hba1c", { valueAsNumber: true })} />
        </Field>
        <Field label={t("assessments.gdm.gestationalWeek")} htmlFor="gdm-gw" error={errors.gestationalWeek?.message} required>
          <Input id="gdm-gw" type="number" {...register("gestationalWeek", { valueAsNumber: true })} />
        </Field>
        <div className="col-span-2 lg:col-span-3 flex flex-col gap-2">
          <Checkbox label={t("assessments.gdm.familyHistory")} registration={register("familyHistoryDiabetes")} />
          <Checkbox label={t("assessments.gdm.previousGDM")} registration={register("previousGDM")} />
        </div>
        <div className="col-span-2 lg:col-span-3">
          <Button type="submit" loading={create.isPending}>
            {t("assessments.runAssessment")}
          </Button>
        </div>
      </form>

      {create.isPending && <Spinner />}

      {result && (
        <AssessmentResult
          title={t("assessments.gdm.result")}
          status={result.status}
          riskLevel={result.riskLevel}
          riskScore={result.riskScore}
          recommendations={result.recommendations}
          message={result.message}
          modelVersion={result.modelVersion}
          shapChart={<ShapChart shapValues={result.shapValues} />}
        />
      )}

      <AssessmentHistory title={t("assessments.gdm.history")} loading={history.isLoading} error={history.error?.message} onRetry={() => history.refetch()}>
        {(history.data?.items ?? []).map((a) => (
          <li key={a.id} className="py-3 flex items-start gap-3">
            <AssessmentStatusBadge status={a.status} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {a.riskLevel ? t(`assessments.risk.${a.riskLevel}`, { defaultValue: a.riskLevel }) : t("common.notAvailable")}
                {a.riskScore !== undefined && a.riskScore !== null ? ` · ${Math.round(a.riskScore * 100)}%` : ""}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(a.createdAt, lang)}</p>
            </div>
          </li>
        ))}
      </AssessmentHistory>
    </Card>
  );
}

/* ---------------- PPD / EPDS ---------------- */

const EPDS_ANSWERS = [0, 1, 2, 3] as const;

type PPDPanelProps = { userId: string };

export function PPDPanel({ userId }: PPDPanelProps) {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const history = usePPDHistory(userId, 10);
  const create = useCreatePPD();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<{ edinburghAnswers: number[]; screeningText?: string }>({
    resolver: zodResolver(schemas.ppd),
    defaultValues: { edinburghAnswers: Array(10).fill(1), screeningText: "" },
  });

  const values = watch("edinburghAnswers");

  const onSubmit = (data: { edinburghAnswers: number[]; screeningText?: string }) => {
    create.mutate(
      {
        user: userId,
        edinburghAnswers: data.edinburghAnswers.map((n) => Number(n)),
        screeningText: data.screeningText || undefined,
      },
      {
        onSuccess: () => {
          push(t("assessments.submitted"), "success");
          reset({ edinburghAnswers: Array(10).fill(1), screeningText: "" });
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  const result = create.data;

  return (
    <Card title={t("assessments.ppd.title")}>
      <p className="text-sm text-gray-600 mb-4">{t("assessments.ppd.instructions")}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6" noValidate>
        {Array.from({ length: 10 }).map((_, i) => {
          const qKey = `q${i + 1}`;
          return (
            <div key={qKey} className="rounded-lg border border-gray-100 p-3">
              <p className="text-sm font-medium text-gray-800 mb-2">
                {i + 1}. {t(`assessments.ppd.${qKey}`)}
              </p>
              <div className="flex flex-wrap gap-2">
                {EPDS_ANSWERS.map((val) => {
                  const isSelected = Number(values?.[i]) === val;
                  return (
                    <label
                      key={val}
                      className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border cursor-pointer ${
                        isSelected
                          ? "border-primary-400 bg-primary-50 text-primary-800"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        className="accent-primary-600"
                        {...register(`edinburghAnswers.${i}`, { valueAsNumber: true })}
                        value={val}
                      />
                      {t(`assessments.ppd.answer.${val}`)}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <Field label={t("assessments.ppd.screeningText")} htmlFor="ppd-text" error={errors.screeningText?.message} hint={t("assessments.ppd.screeningHint")}>
          <Textarea id="ppd-text" rows={3} {...register("screeningText")} />
        </Field>

        {errors.edinburghAnswers?.message && (
          <p className="text-sm text-red-600">{errors.edinburghAnswers.message}</p>
        )}

        <Button type="submit" loading={create.isPending}>
          {t("assessments.runAssessment")}
        </Button>
      </form>

      {create.isPending && <Spinner />}

      {result && (
        <AssessmentResult
          title={t("assessments.ppd.result")}
          status={result.status}
          riskLevel={result.severity}
          recommendations={result.recommendations}
          message={result.message}
          modelVersion={result.modelVersion}
        >
          {typeof result.edinburghScore === "number" && (
            <p className="text-sm text-gray-700 mb-1">
              {t("assessments.ppd.epdsScore")}: <strong>{result.edinburghScore}</strong>
            </p>
          )}
          {result.nlpAnalysis && (
            <div className="mb-2">
              <p className="text-sm text-gray-700">
                {t("assessments.ppd.sentiment")}: {t(`mood.sentiment.${result.nlpAnalysis.sentiment}`, { defaultValue: result.nlpAnalysis.sentiment })}
              </p>
              {(result.nlpAnalysis.keywords?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.nlpAnalysis.keywords.map((k) => (
                    <span key={k} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </AssessmentResult>
      )}

      <AssessmentHistory title={t("assessments.ppd.history")} loading={history.isLoading} error={history.error?.message} onRetry={() => history.refetch()}>
        {(history.data?.items ?? []).map((a) => (
          <li key={a.id} className="py-3 flex items-start gap-3">
            <AssessmentStatusBadge status={a.status} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {typeof a.edinburghScore === "number"
                  ? `${t("assessments.ppd.epdsScore")}: ${a.edinburghScore}`
                  : t("common.notAvailable")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(a.createdAt, lang)}</p>
            </div>
          </li>
        ))}
      </AssessmentHistory>
    </Card>
  );
}

/* ---------------- shared history block ---------------- */

export function AssessmentHistory({
  title,
  loading,
  error,
  onRetry,
  children,
}: {
  title: string;
  loading: boolean;
  error?: string;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : (
        <ul className="divide-y divide-gray-100">{children}</ul>
      )}
    </div>
  );
}