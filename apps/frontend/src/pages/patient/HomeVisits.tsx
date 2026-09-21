import { appointmentToday } from "@maasuraksha/shared";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/authStore";
import { useHomeVisits, useRequestHomeVisit } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { formatCalendarDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { HomeVisitStatusBadge } from "@/components/status/StatusLabels";

type HomeVisitForm = {
  preferredDate: string;
  preferredTime: string;
  reason: string;
};

export default function HomeVisitsPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const visits = useHomeVisits();
  const create = useRequestHomeVisit();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HomeVisitForm>({
    resolver: zodResolver(schemas.homeVisitRequest.omit({ patient: true })),
    defaultValues: {
      preferredDate: appointmentToday(new Date(Date.now() + 86400000)),
      preferredTime: "10:00",
      reason: "",
    },
  });

  const onSubmit = (data: HomeVisitForm) => {
    if (!user) return;
    create.mutate(
      {
        patient: user.id,
        reason: data.reason,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
      },
      {
        onSuccess: () => {
          push(t("homeVisits.requested"), "success");
          reset({ preferredDate: appointmentToday(new Date(Date.now() + 86400000)), preferredTime: "10:00", reason: "" });
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  const items = visits.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("homeVisits.title")} subtitle={t("homeVisits.subtitle")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={t("homeVisits.requestTitle")}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label={t("homeVisits.reason")} htmlFor="reason" error={errors.reason?.message} required>
              <Textarea id="reason" rows={3} maxLength={500} {...register("reason")} />
            </Field>
            <Field label={t("homeVisits.date")} htmlFor="preferred-date" error={errors.preferredDate?.message} required>
              <Input id="preferred-date" type="date" min={appointmentToday()} {...register("preferredDate")} />
            </Field>
            <Field label={t("homeVisits.time")} htmlFor="preferred-time" error={errors.preferredTime?.message} required>
              <Input id="preferred-time" type="time" {...register("preferredTime")} />
            </Field>
            {create.isError && <p role="alert" className="text-sm text-red-700">{getApiErrorMessage(create.error)}</p>}
            <Button type="submit" disabled={!user} loading={create.isPending}>
              {t("homeVisits.request")}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <Card title={t("homeVisits.myRequests")}>
            {visits.isLoading ? <Spinner /> : visits.isError ? (
              <ErrorState message={visits.error?.message} onRetry={() => visits.refetch()} />
            ) : items.length === 0 ? (
              <EmptyState title={t("homeVisits.none")} description={t("homeVisits.noneDescription")} />
            ) : (
              <ul className="divide-y divide-rose-100/60">
                {items.map((visit) => (
                  <li key={visit._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{visit.reason}</p>
                      <p className="text-xs text-gray-500">
                        {formatCalendarDate(visit.preferredDate, lang)} · {visit.preferredTime} · {t("homeVisits.indiaTime")}
                      </p>
                      {visit.notes && <p className="text-xs text-gray-400 mt-0.5">{visit.notes}</p>}
                    </div>
                    <HomeVisitStatusBadge status={visit.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}