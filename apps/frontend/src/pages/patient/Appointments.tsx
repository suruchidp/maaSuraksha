import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/authStore";
import { useAppointments, useCreateAppointment, useUpdateAppointmentStatus } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { formatDate, toLocalInputDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AppointmentStatusBadge } from "@/components/status/StatusLabels";
import { useState } from "react";

type AppointmentForm = {
  date: string;
  time: string;
  type: string;
  notes?: string;
};

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const appointments = useAppointments(user?.id, 100);
  const create = useCreateAppointment();
  const updateStatus = useUpdateAppointmentStatus();

  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(schemas.appointment),
    defaultValues: {
      date: toLocalInputDate(new Date()),
      time: "10:00",
      type: "antenatal",
    },
  });

  const onSubmit = (data: AppointmentForm) => {
    if (!user) return;
    create.mutate(
      {
        patient: user.id,
        doctor: user.assignedDoctor,
        asha: user.assignedASHA,
        date: data.date,
        time: data.time,
        type: data.type,
        notes: data.notes || undefined,
      },
      {
        onSuccess: () => {
          push(t("appointments.booked"), "success");
          reset({ date: toLocalInputDate(new Date()), time: "10:00", type: "antenatal" });
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  const confirmCancel = () => {
    if (!cancelTarget) return;
    updateStatus.mutate(
      { id: cancelTarget, status: "cancelled", reason: "cancelled_by_patient" },
      {
        onSuccess: () => {
          push(t("appointments.cancelled"), "success");
          setCancelTarget(null);
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  if (appointments.isLoading) return <Spinner />;

  const items = [...(appointments.data?.items ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("appointments.title")} subtitle={t("appointments.subtitle")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={t("appointments.bookTitle")}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label={t("appointments.date")} htmlFor="date" error={errors.date?.message} required>
              <Input id="date" type="date" {...register("date")} />
            </Field>
            <Field label={t("appointments.time")} htmlFor="time" error={errors.time?.message} required>
              <Input id="time" type="time" {...register("time")} />
            </Field>
            <Field label={t("appointments.type")} htmlFor="type" error={errors.type?.message} required>
              <Select id="type" {...register("type")}>
                <option value="antenatal">{t("appointments.typeOptions.antenatal")}</option>
                <option value="vaccination">{t("appointments.typeOptions.vaccination")}</option>
                <option value="ultrasound">{t("appointments.typeOptions.ultrasound")}</option>
                <option value="lab">{t("appointments.typeOptions.lab")}</option>
                <option value="consultation">{t("appointments.typeOptions.consultation")}</option>
                <option value="other">{t("appointments.typeOptions.other")}</option>
              </Select>
            </Field>
            <Field label={t("appointments.notes")} htmlFor="notes">
              <Textarea id="notes" rows={3} {...register("notes")} />
            </Field>
            <Button type="submit" loading={create.isPending}>
              {t("appointments.book")}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <Card title={t("appointments.myAppointments")}>
            {appointments.isError ? (
              <ErrorState message={appointments.error?.message} onRetry={() => appointments.refetch()} />
            ) : items.length === 0 ? (
              <EmptyState title={t("appointments.none")} description={t("appointments.noneDescription")} />
            ) : (
              <ul className="divide-y divide-rose-100/60">
                {items.map((appt) => (
                  <li key={appt.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{t(`appointments.typeOptions.${appt.type}`, { defaultValue: appt.type })}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(appt.date, lang)} Â· {appt.time}
                      </p>
                      {appt.notes && <p className="text-xs text-gray-400 mt-0.5">{appt.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <AppointmentStatusBadge status={appt.status} />
                      {appt.status === "confirmed" ? (
                        <Button size="sm" variant="danger" onClick={() => setCancelTarget(appt.id)}>
                          {t("appointments.cancel")}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title={t("appointments.cancelConfirmTitle")}
        message={t("appointments.cancelConfirmMessage")}
        confirmLabel={t("appointments.cancel")}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
        danger
      />
    </div>
  );
}