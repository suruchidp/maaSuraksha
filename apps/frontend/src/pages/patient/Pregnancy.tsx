import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/authStore";
import { usePregnancy, useUpsertPregnancy } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { formatDate, toLocalInputDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { TrimesterLabel } from "@/components/status/StatusLabels";

type PregnancyForm = {
  lmp: string;
  gravida?: number;
  para?: number;
};

export default function PregnancyPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const pregnancy = usePregnancy();
  const upsert = useUpsertPregnancy();

  const defaultLmp = pregnancy.data?.lmp
    ? toLocalInputDate(pregnancy.data.lmp)
    : toLocalInputDate(new Date());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PregnancyForm>({
    resolver: zodResolver(schemas.pregnancyProfile),
    defaultValues: {
      lmp: defaultLmp,
      gravida: pregnancy.data?.gravida ?? 1,
      para: pregnancy.data?.para ?? 0,
    },
  });

  const onSubmit = (data: PregnancyForm) => {
    upsert.mutate(
      {
        input: {
          lmp: data.lmp,
          gravida: data.gravida,
          para: data.para,
        },
        userId: user?.id,
      },
      {
        onSuccess: () => {
          push(t("pregnancy.saved"), "success");
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  if (pregnancy.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pregnancy.title")}
        subtitle={t("pregnancy.subtitle")}
      />

      {pregnancy.isError && !pregnancy.data ? (
        (
          <ErrorState
            message={pregnancy.isLoading ? "" : t("pregnancy.notFound")}
            onRetry={() => pregnancy.refetch()}
          />
        )
      ) : (
        <>
          <Card title={t("pregnancy.currentProfile")}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <dt className="text-xs text-gray-500">{t("pregnancy.dueDate")}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">
                  {pregnancy.data ? formatDate(pregnancy.data.expectedDueDate, lang) : t("common.notAvailable")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("pregnancy.gestationalWeek")}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">
                  {pregnancy.data ? `${pregnancy.data.gestationalWeek} ${t("pregnancy.weeks")}` : t("common.notAvailable")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("pregnancy.trimester")}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">
                  {pregnancy.data ? <TrimesterLabel trimester={pregnancy.data.trimester} /> : t("common.notAvailable")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("pregnancy.lmp")}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">
                  {pregnancy.data ? formatDate(pregnancy.data.lmp, lang) : t("common.notAvailable")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("pregnancy.riskStatus")}</dt>
                <dd className="mt-1">
                  {pregnancy.data ? (
                    pregnancy.data.isHighRisk ? (
                      <Badge color="red">{t("pregnancy.highRisk")}</Badge>
                    ) : (
                      <Badge color="green">{t("pregnancy.lowRisk")}</Badge>
                    )
                  ) : (
                    <span className="text-sm text-gray-400">{t("common.notAvailable")}</span>
                  )}
                </dd>
              </div>
              {pregnancy.data?.riskFactors?.length ? (
                <div>
                  <dt className="text-xs text-gray-500">{t("pregnancy.riskFactors")}</dt>
                  <dd className="text-sm text-gray-700 mt-0.5 flex flex-wrap gap-1">
                    {pregnancy.data.riskFactors.map((f) => (
                      <span key={f} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                        {t(`pregnancy.riskFactor.${f}`, { defaultValue: f })}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : (
                pregnancy.data && (
                  <div>
                    <dt className="text-xs text-gray-500">{t("pregnancy.riskFactors")}</dt>
                    <dd className="text-sm text-gray-400">{t("common.none")}</dd>
                  </div>
                )
              )}
            </dl>
          </Card>

          <Card title={t("pregnancy.updateTitle")}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md" noValidate>
              <Field
                label={t("pregnancy.lmp")}
                htmlFor="lmp"
                hint={t("pregnancy.lmpHint")}
                error={errors.lmp?.message}
                required
              >
                <Input id="lmp" type="date" {...register("lmp")} />
              </Field>
              <Field label={`${t("pregnancy.gravida")}`} htmlFor="gravida" error={errors.gravida?.message}>
                <Input id="gravida" type="number" min={0} step={1} {...register("gravida", { valueAsNumber: true })} />
              </Field>
              <Field label={t("pregnancy.para")} htmlFor="para" error={errors.para?.message}>
                <Input id="para" type="number" min={0} step={1} {...register("para", { valueAsNumber: true })} />
              </Field>
              <Button type="submit" loading={upsert.isPending}>
                {t("common.save")}
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}