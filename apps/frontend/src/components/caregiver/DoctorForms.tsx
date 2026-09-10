import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateRecommendation, useReferrals, useUpdateReferralStatus } from "@/hooks/queries";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ReferralStatusBadge } from "@/components/status/StatusLabels";

type RecommendationForm = {
  category: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high";
  source?: string;
};

export function DoctorRecommendationForm({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);
  const create = useCreateRecommendation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecommendationForm>({
    resolver: zodResolver(schemas.recommendation),
    defaultValues: { category: "general", priority: "medium" },
  });

  return (
    <Card title={t("doctor.recommendation")}>
      <form
        onSubmit={handleSubmit((data) =>
          create.mutate(
            {
              input: {
                category: data.category,
                title: data.title,
                content: data.content,
                priority: data.priority,
                source: data.source || undefined,
              },
              userId: patientId,
            },
            {
              onSuccess: () => {
                push(t("recommendations.created"), "success");
                reset({ category: "general", priority: "medium" });
              },
              onError: (err) => push(getApiErrorMessage(err), "error"),
            }
          )
        )}
        className="space-y-3"
        noValidate
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("recommendations.categoryLabel")} htmlFor="rec-cat" error={errors.category?.message} required>
            <Select id="rec-cat" {...register("category")}>
              <option value="general">{t("recommendations.category.general", { defaultValue: "general" })}</option>
              <option value="nutrition">{t("recommendations.category.nutrition", { defaultValue: "nutrition" })}</option>
              <option value="mental_health">{t("recommendations.category.mental_health", { defaultValue: "mental_health" })}</option>
              <option value="exercise">{t("recommendations.category.exercise", { defaultValue: "exercise" })}</option>
              <option value="medication">{t("recommendations.category.medication", { defaultValue: "medication" })}</option>
              <option value="care">{t("recommendations.category.care", { defaultValue: "care" })}</option>
            </Select>
          </Field>
          <Field label={t("recommendations.priority")} htmlFor="rec-priority">
            <Select id="rec-priority" {...register("priority")}>
              <option value="low">{t("status.priority.low")}</option>
              <option value="medium">{t("status.priority.medium")}</option>
              <option value="high">{t("status.priority.high")}</option>
            </Select>
          </Field>
        </div>
        <Field label={t("recommendations.titleLabel")} htmlFor="rec-title" error={errors.title?.message} required>
          <Input id="rec-title" {...register("title")} />
        </Field>
        <Field label={t("recommendations.content")} htmlFor="rec-content" error={errors.content?.message} required>
          <Textarea id="rec-content" rows={4} {...register("content")} />
        </Field>
        <Field label={t("recommendations.source")} htmlFor="rec-source">
          <Input id="rec-source" {...register("source")} />
        </Field>
        <Button type="submit" loading={create.isPending}>{t("recommendations.submit")}</Button>
      </form>
    </Card>
  );
}

export function DoctorReferralActions({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const referrals = useReferrals(patientId, 50);
  const updateStatus = useUpdateReferralStatus();

  if (referrals.isLoading) return <Spinner />;

  const items = referrals.data?.items ?? [];

  return (
    <Card title={t("doctor.manageReferrals")}>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{t("referrals.none")}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((ref) => (
            <li key={ref.id} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <ReferralStatusBadge status={ref.status} />
                <span className="text-sm font-medium text-gray-900">{ref.reason}</span>
              </div>
              {ref.facility && <p className="text-xs text-gray-500 mt-0.5">{t("referrals.facility")}: {ref.facility}</p>}
              {ref.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: ref.id, status: "accepted" })}>
                    {t("referrals.accept")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: ref.id, status: "completed" })}>
                    {t("referrals.complete")}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => updateStatus.mutate({ id: ref.id, status: "rejected" })}>
                    {t("referrals.reject")}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DoctorActionForms({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary w-full justify-center"
        aria-expanded={open}
      >
        {open ? t("common.hide") : t("doctor.quickActions")}
      </button>
      {open && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DoctorRecommendationForm patientId={patientId} />
          <DoctorReferralActions patientId={patientId} />
        </div>
      )}
    </div>
  );
}