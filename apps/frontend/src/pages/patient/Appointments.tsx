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

  const [page, setPage] = useState(1);
  const appointments = useAppointments(user?.id, 20, page);
  const create = useCreateAppointment();
  const updateStatus = useUpdateAppointmentStatus();

  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(schemas.appointment.omit({ patient: true, doctor: true, asha: true })),
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
          setPage(1);
          reset({ date: toLocalInputDate(new Date()), time: "10:00", type: "antenatal" });
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  const confirmCancel = () => {
    if (!cancelTarget || updateStatus.isPending) return;
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

  const items = [...(appointments.data?.items ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("appointments.title")} subtitle={t("appointments.subtitle")} actions={
        <Button variant="outline" loading={appointments.isFetching} onClick={() => appointments.refetch()}>{t("alerts.refresh")}</Button>
      } />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={t("appointments.bookTitle")}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label={t("appointments.date")} htmlFor="date" error={errors.date?.message} required>
              <Input id="date" type="date" min={toLocalInputDate(new Date())} {...register("date")} />
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
              <Textarea id="notes" rows={3} maxLength={500} {...register("notes")} />
            </Field>
            {create.isError && <p role="alert" className="text-sm text-red-700">{getApiErrorMessage(create.error)}</p>}
            <Button type="submit" disabled={!user} loading={create.isPending}>
              {t("appointments.book")}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <Card title={t("appointments.myAppointments")}>
            {appointments.isLoading ? <Spinner /> : appointments.isError ? (
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
                        {formatDate(appt.date, lang)} · {appt.time}
                      </p>
                      {appt.notes && <p className="text-xs text-gray-400 mt-0.5">{appt.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <AppointmentStatusBadge status={appt.status} />
                      {appt.status === "confirmed" || appt.status === "scheduled" ? (
                        <Button size="sm" variant="danger" disabled={updateStatus.isPending} onClick={() => { updateStatus.reset(); setCancelTarget(appt.id); }}>
                          {t("appointments.cancel")}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {!appointments.isLoading && !appointments.isError && (appointments.data?.totalPages ?? 0) > 1 && (
            <nav className="flex justify-between items-center mt-4" aria-label={t("appointments.myAppointments")}>
              <Button variant="outline" disabled={page === 1 || appointments.isFetching} onClick={() => setPage(page - 1)}>{t("alerts.previous")}</Button>
              <span className="text-sm text-gray-500">{t("alerts.page", { page, total: appointments.data?.totalPages })}</span>
              <Button variant="outline" disabled={page >= (appointments.data?.totalPages ?? 1) || appointments.isFetching} onClick={() => setPage(page + 1)}>{t("alerts.next")}</Button>
            </nav>
          )}
          {updateStatus.isError && <p role="alert" className="mt-3 text-sm text-red-700">{getApiErrorMessage(updateStatus.error)}</p>}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title={t("appointments.cancelConfirmTitle")}
        message={t("appointments.cancelConfirmMessage")}
        confirmLabel={t("appointments.cancel")}
        onConfirm={confirmCancel}
        onCancel={() => { if (!updateStatus.isPending) setCancelTarget(null); }}
        loading={updateStatus.isPending}
        danger
      />
    </div>
  );
}
