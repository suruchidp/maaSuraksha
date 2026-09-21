import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/authStore";
import {
  usePregnancy,
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
import { GDM_SCREENING_THRESHOLD } from "@/lib/mlUtils";
import type { GDMAssessmentDTO } from "@/lib/types";

/* react-hook-form's `valueAsNumber` converts an empty number input to NaN.
   zod's `.optional()` only accepts `undefined`, so a blank optional field
   failed validation and the form could never reach onSubmit. Convert blank
   inputs to undefined instead of NaN. */
const toNumberOrUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : Number(value);

/* Schema-driven required indicators: a field shows a required * exactly when
   the zod schema rejects an undefined value for it (i.e. it is non-optional).
   This keeps the visible label in agreement with validation by construction. */
function requiredFlags(
  shape: Record<string, { isOptional(): boolean }>,
  keys: readonly string[]
): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const key of keys) {
    const field = shape[key];
    flags[key] = Boolean(field && !field.isOptional());
  }
  return flags;
}

const MATERNAL_VISIBLE_FIELDS = [
  "age",
  "systolicBP",
  "diastolicBP",
  "bloodSugar",
  "bodyTemp",
  "heartRate",
  "bmi",
  "gestationalWeek",
  "hemoglobin",
] as const;

const GDM_VISIBLE_FIELDS = [
  "age",
  "bmi",
  "hdl",
  "pregnancyCount",
  "previousPregnancyGestation",
  "familyHistory",
  "unexplainedPrenatalLoss",
  "largeChildOrBirthDefect",
  "pcos",
  "systolicBP",
  "diastolicBP",
  "hemoglobin",
  "sedentaryLifestyle",
] as const;

/* ---------------- Maternal risk ---------------- */

type MaternalForm = {
  user: string;
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

  const pregnancy = usePregnancy(userId);
  const profile = pregnancy.data;
  const datedWeek = profile && profile.status !== 'completed' && !profile.datingNeedsReview && profile.gestationalWeek >= 1 && profile.gestationalWeek <= 42 ? profile.gestationalWeek : undefined;
  const history = useMaternalRiskHistory(userId, 10);
  const create = useCreateMaternalRisk();

  /* Requiredness is read from the zod schema itself, so the * markers always
     agree with validation. user is seeded (not rendered), so its "required"
     flag is never shown. */
  const required = requiredFlags(
    schemas.maternalRisk.shape as Record<string, { isOptional(): boolean }>,
    MATERNAL_VISIBLE_FIELDS
  );

  const {
    register,
    handleSubmit,
    reset,
    resetField,
    formState: { errors, dirtyFields },
  } = useForm<MaternalForm>({
    resolver: zodResolver(schemas.maternalRisk),
    /* `user` is validated by schemas.maternalRisk but has no input in this
       form; seed it from the prop so handleSubmit's resolver accepts it. */
    defaultValues: { user: userId, age: 25, gestationalWeek: datedWeek, bmi: 22 },
  });

  useEffect(() => {
    if (!dirtyFields.gestationalWeek) resetField('gestationalWeek', { defaultValue: datedWeek });
  }, [datedWeek, dirtyFields.gestationalWeek, resetField]);

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
        <Field label={t("assessments.maternal.age")} htmlFor="mr-age" error={errors.age?.message} required={required.age}>
          <Input id="mr-age" type="number" {...register("age", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.systolicBP")} htmlFor="mr-sbp" error={errors.systolicBP?.message} required={required.systolicBP}>
          <Input id="mr-sbp" type="number" {...register("systolicBP", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.diastolicBP")} htmlFor="mr-dbp" error={errors.diastolicBP?.message} required={required.diastolicBP}>
          <Input id="mr-dbp" type="number" {...register("diastolicBP", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.maternal.bloodSugar")} htmlFor="mr-sugar" error={errors.bloodSugar?.message} required={required.bloodSugar}>
          <Input id="mr-sugar" type="number" {...register("bloodSugar", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.maternal.bodyTemp")} htmlFor="mr-temp" error={errors.bodyTemp?.message} required={required.bodyTemp}>
          <Input id="mr-temp" type="number" step="0.1" {...register("bodyTemp", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.maternal.heartRate")} htmlFor="mr-hr" error={errors.heartRate?.message} required={required.heartRate}>
          <Input id="mr-hr" type="number" {...register("heartRate", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.maternal.bmi")} htmlFor="mr-bmi" error={errors.bmi?.message} required={required.bmi}>
          <Input id="mr-bmi" type="number" step="0.1" {...register("bmi", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.maternal.gestationalWeek")} htmlFor="mr-gw" error={errors.gestationalWeek?.message} required={required.gestationalWeek}>
          <Input id="mr-gw" type="number" {...register("gestationalWeek", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.maternal.hemoglobin")} htmlFor="mr-hb" error={errors.hemoglobin?.message} required={required.hemoglobin}>
          <Input id="mr-hb" type="number" step="0.1" {...register("hemoglobin", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <div className="col-span-2 lg:col-span-3">
          <Button type="submit" loading={create.isPending}>
            {t("assessments.runAssessment")}
          </Button>
        </div>
      </form>

      <p className="text-xs text-gray-500 mb-4">{t("assessments.maternal.note")}</p>

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
          shapChart={<ShapChart kind="maternalRisk" shapValues={result.shapValues} inputValues={result.inputFeatures} modelVersion={result.modelVersion} />}
        />
      )}

      <AssessmentHistory title={t("assessments.maternal.history")} loading={history.isLoading} error={history.error?.message} onRetry={() => history.refetch()}>
        {(history.data?.items ?? []).map((a) => (
          <li key={a.id} className="py-3 flex items-start gap-3">
            <AssessmentStatusBadge status={a.status} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {a.riskLevel ? t(`assessments.risk.${a.riskLevel}`, { defaultValue: a.riskLevel }) : t("common.notAvailable")}
                {a.riskScore !== undefined && a.riskScore !== null ? ` Â· ${Math.round(a.riskScore * 100)}%` : ""}
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

// Stage 1 early risk assessment inputs (available before glucose testing).
// Fasting/postprandial glucose and HbA1c are Stage 2 CLINICAL measurements and
// are intentionally not part of the community/home risk form.
type GDMForm = {
  user: string;
  age: number;
  bmi?: number;
  hdl?: number;
  pregnancyCount: number;
  previousPregnancyGestation: number;
  familyHistory: boolean;
  unexplainedPrenatalLoss: boolean;
  largeChildOrBirthDefect: boolean;
  pcos: boolean;
  systolicBP?: number;
  diastolicBP: number;
  hemoglobin?: number;
  sedentaryLifestyle: boolean;
};

/* Screening presentation for a completed GDM result: derives the primary
   "Screening Positive/Negative" headline from the model's risk flag and shows
   the actual model score. The configured threshold is only forwarded when the
   served model version matches the metadata the threshold was mirrored from —
   otherwise the UI refuses to claim a threshold for a different model. */
function gdmScreeningProps(result: GDMAssessmentDTO | undefined) {
  if (!result || result.status !== "completed" || typeof result.riskScore !== "number") {
    return undefined;
  }
  const thresholdKnown = result.modelVersion === GDM_SCREENING_THRESHOLD.modelVersion;
  return {
    positive: result.riskLevel === "high",
    score: result.riskScore,
    threshold: thresholdKnown ? GDM_SCREENING_THRESHOLD.positive : undefined,
  };
}

export function GDMPanel({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const history = useGDMHistory(userId, 10);
  const create = useCreateGDM();

  /* Requiredness is read from the zod schema itself, so the * markers always
     agree with validation. Boolean checkboxes (default false) are optional and
     therefore never show *. user is seeded (not rendered). */
  const required = requiredFlags(
    schemas.gdm.shape as Record<string, { isOptional(): boolean }>,
    GDM_VISIBLE_FIELDS
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GDMForm>({
    resolver: zodResolver(schemas.gdm),
    defaultValues: {
      user: userId,
      age: 25,
      pregnancyCount: 1,
      previousPregnancyGestation: 0,
      diastolicBP: 80,
      familyHistory: false,
      unexplainedPrenatalLoss: false,
      largeChildOrBirthDefect: false,
      pcos: false,
      sedentaryLifestyle: false,
    },
  });

  const onSubmit = (data: GDMForm) => {
    create.mutate(
      {
        user: userId,
        age: Number(data.age),
        bmi: data.bmi ? Number(data.bmi) : undefined,
        hdl: data.hdl ? Number(data.hdl) : undefined,
        pregnancyCount: Number(data.pregnancyCount),
        previousPregnancyGestation: Number(data.previousPregnancyGestation),
        familyHistory: data.familyHistory,
        unexplainedPrenatalLoss: data.unexplainedPrenatalLoss,
        largeChildOrBirthDefect: data.largeChildOrBirthDefect,
        pcos: data.pcos,
        systolicBP: data.systolicBP ? Number(data.systolicBP) : undefined,
        diastolicBP: Number(data.diastolicBP),
        hemoglobin: data.hemoglobin ? Number(data.hemoglobin) : undefined,
        sedentaryLifestyle: data.sedentaryLifestyle,
      },
      {
        onSuccess: () => {
          push(t("assessments.submitted"), "success");
          reset({
            user: userId,
            pregnancyCount: 1,
            previousPregnancyGestation: 0,
            diastolicBP: 80,
            familyHistory: false,
            unexplainedPrenatalLoss: false,
            largeChildOrBirthDefect: false,
            pcos: false,
            sedentaryLifestyle: false,
          });
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  const result = create.data;

  return (
    <Card title={t("assessments.gdm.title")}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6" noValidate>
        <Field label={t("assessments.gdm.age")} htmlFor="gdm-age" error={errors.age?.message} required={required.age}>
          <Input id="gdm-age" type="number" {...register("age", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.gdm.bmi")} htmlFor="gdm-bmi" error={errors.bmi?.message} required={required.bmi}>
          <Input id="gdm-bmi" type="number" step="0.1" {...register("bmi", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.gdm.hdl")} htmlFor="gdm-hdl" error={errors.hdl?.message} required={required.hdl}>
          <Input id="gdm-hdl" type="number" step="0.1" {...register("hdl", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.gdm.pregnancyCount")} htmlFor="gdm-pc" error={errors.pregnancyCount?.message} required={required.pregnancyCount}>
          <Input id="gdm-pc" type="number" {...register("pregnancyCount", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.gdm.previousPregnancyGestation")} htmlFor="gdm-ppg" error={errors.previousPregnancyGestation?.message} required={required.previousPregnancyGestation}>
          <Input id="gdm-ppg" type="number" step="0.1" {...register("previousPregnancyGestation", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.gdm.systolicBP")} htmlFor="gdm-sbp" error={errors.systolicBP?.message} required={required.systolicBP} hint={t("assessments.gdm.systolicOptionalHint")}>
          <Input id="gdm-sbp" type="number" {...register("systolicBP", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.gdm.diastolicBP")} htmlFor="gdm-dbp" error={errors.diastolicBP?.message} required={required.diastolicBP}>
          <Input id="gdm-dbp" type="number" {...register("diastolicBP", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <Field label={t("assessments.gdm.hemoglobin")} htmlFor="gdm-hgb" error={errors.hemoglobin?.message} required={required.hemoglobin}>
          <Input id="gdm-hgb" type="number" step="0.1" {...register("hemoglobin", { setValueAs: toNumberOrUndefined })} />
        </Field>
        <div className="col-span-2 lg:col-span-3 flex flex-col gap-2">
          <Checkbox label={t("assessments.gdm.familyHistory")} registration={register("familyHistory")} />
          <Checkbox label={t("assessments.gdm.unexplainedPrenatalLoss")} registration={register("unexplainedPrenatalLoss")} />
          <Checkbox label={t("assessments.gdm.largeChildOrBirthDefect")} registration={register("largeChildOrBirthDefect")} />
          <Checkbox label={t("assessments.gdm.pcos")} registration={register("pcos")} />
          <Checkbox label={t("assessments.gdm.sedentaryLifestyle")} registration={register("sedentaryLifestyle")} />
          <p className="text-xs text-gray-500 mt-1">{t("assessments.gdm.note")}</p>
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
          screening={gdmScreeningProps(result)}
          shapChart={<ShapChart kind="gdm" shapValues={result.shapValues} inputValues={result.inputFeatures} modelVersion={result.modelVersion} />}
        />
      )}

      <AssessmentHistory title={t("assessments.gdm.history")} loading={history.isLoading} error={history.error?.message} onRetry={() => history.refetch()}>
        {(history.data?.items ?? []).map((a) => (
          <li key={a.id} className="py-3 flex items-start gap-3">
            <AssessmentStatusBadge status={a.status} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {a.riskLevel ? t(`assessments.risk.${a.riskLevel}`, { defaultValue: a.riskLevel }) : t("common.notAvailable")}
                {a.riskScore !== undefined && a.riskScore !== null ? ` Â· ${Math.round(a.riskScore * 100)}%` : ""}
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
  } = useForm<{ user: string; edinburghAnswers: number[]; screeningText?: string }>({
    resolver: zodResolver(schemas.ppd),
    /* `user` is part of schemas.ppd but has no input in this form; seed it
       from the prop so handleSubmit's resolver accepts it. */
    defaultValues: { user: userId, edinburghAnswers: Array(10).fill(1), screeningText: "" },
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
          reset({ user: userId, edinburghAnswers: Array(10).fill(1), screeningText: "" });
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  const result = create.data;

  /* The EPDS answers are one required array in the schema (exactly 10 answers
     in 0..3), so every question block is required. screeningText is optional. */
  const epdsRequired = !schemas.ppd.shape.edinburghAnswers.isOptional();

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
                {epdsRequired && <span className="text-red-500 ml-1">*</span>}
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
        <ul className="divide-y divide-rose-100/60">{children}</ul>
      )}
    </div>
  );
}