import { appointmentStart, appointmentToday } from "@maasuraksha/shared";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/authStore";
import { useAppointments, useCreateAppointment, useUpdateAppointmentStatus, useRescheduleAppointment } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { formatCalendarDate } from "@/lib/date";
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
import { AppointmentStatusBadge } from "@/components/status/StatusLabels";
import { useState } from "react";

type AppointmentForm = {
  date: string;
  time: string;
  type: string;
  notes?: string;
};

export default function AppointmentsPage({ patientId }: { patientId?: string }) {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const staff = ["DOCTOR", "ASHA", "ADMIN"].includes(user?.role ?? "");
  const targetPatient = patientId ?? user?.id;
  const [view, setView] = useState("upcoming");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const appointments = useAppointments(targetPatient, 20, page, view, statusFilter || undefined);
  const create = useCreateAppointment();
  const updateStatus = useUpdateAppointmentStatus();
  const reschedule = useRescheduleAppointment();
  const [scheduleTarget, setScheduleTarget] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(schemas.appointment.omit({ patient: true, doctor: true, asha: true })),
    defaultValues: {
      date: appointmentToday(new Date(Date.now() + 86400000)),
      time: "10:00",
      type: "antenatal",
      notes: "",
    },
  });

  const onSubmit = (data: AppointmentForm) => {
    if (!user) return;
    create.mutate(
      {
        patient: targetPatient!,
        date: data.date,
        time: data.time,
        type: data.type,
        notes: data.notes || undefined,
      },
      {
        onSuccess: () => {
          push(t("appointments.booked"), "success");
          setPage(1);
          reset({ date: appointmentToday(new Date(Date.now() + 86400000)), time: "10:00", type: "antenatal", notes: "" });
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  const confirmCancel = () => {
    if (!cancelTarget || updateStatus.isPending) return;
    updateStatus.mutate(
      { id: cancelTarget, status: "cancelled", reason: cancelReason.trim() || (staff ? "cancelled_by_care_team" : "cancelled_by_patient") },
      {
        onSuccess: () => {
          push(t("appointments.cancelled"), "success");
          setCancelTarget(null);
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  const items = appointments.data?.items ?? [];
  const changeStatus = (id: string, status: string) => updateStatus.mutate({ id, status }, { onSuccess: () => push(t("appointments.workflow.updated"), "success"), onError: err => push(getApiErrorMessage(err), "error") });
  const saveSchedule = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!scheduleTarget || reschedule.isPending) return;
    const fields = new FormData(event.currentTarget);
    reschedule.mutate({ id: scheduleTarget, date: String(fields.get("date")), time: String(fields.get("time")) }, { onSuccess: () => { setScheduleTarget(null); setPage(1); push(t("appointments.workflow.rescheduled"), "success"); }, onError: err => push(getApiErrorMessage(err), "error") });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("appointments.title")} subtitle={t("appointments.subtitle")} actions={
        <Button variant="outline" loading={appointments.isFetching} onClick={() => appointments.refetch()}>{t("alerts.refresh")}</Button>
      } />
      <p className="text-sm text-gray-600">{t("appointments.workflow.help")}</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={t("appointments.bookTitle")}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label={t("appointments.date")} htmlFor="date" error={errors.date?.message} required>
              <Input id="date" type="date" min={appointmentToday()} {...register("date")} />
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
            <div className="flex flex-wrap gap-3 mb-4"><div role="group" aria-label={t("appointments.workflow.view")}>{["upcoming", "past", "all"].map(v => <Button key={v} size="sm" variant={view === v ? "primary" : "outline"} aria-pressed={view === v} onClick={() => { setView(v); setPage(1); }}>{t(`appointments.workflow.${v}`)}</Button>)}</div><Select aria-label={t("appointments.workflow.statusFilter")} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}><option value="">{t("appointments.workflow.allStatuses")}</option>{["scheduled", "confirmed", "completed", "cancelled", "missed"].map(v => <option key={v} value={v}>{t(`status.appointment.${v}`, { defaultValue: v })}</option>)}</Select></div>
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
                        {formatCalendarDate(appt.date, lang)} · {appt.time} · {t("appointments.workflow.indiaTime")}
                      </p>
                      <p className="text-xs text-gray-500">{t("appointments.workflow.doctor")}: {appt.doctorName || t("appointments.workflow.unassigned")} · {t("appointments.workflow.asha")}: {appt.ashaName || t("appointments.workflow.unassigned")}</p>
                      {appt.cancelledReason && <p className="text-xs text-gray-500">{t("appointments.workflow.reason")}: {appt.cancelledReason}</p>}
                      {appt.notes && <p className="text-xs text-gray-400 mt-0.5">{appt.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <AppointmentStatusBadge status={appt.status} />
                      {(appt.status === "scheduled" || appt.status === "confirmed") && (staff || appointmentStart(appt.date, appt.time).getTime() > Date.now()) && <Button size="sm" variant="outline" disabled={reschedule.isPending} onClick={() => { reschedule.reset(); setScheduleTarget(appt.id); setScheduleDate(appt.date.slice(0,10)); setScheduleTime(appt.time); }}>{t("appointments.workflow.reschedule")}</Button>}
                      {staff && appt.status === "scheduled" && <Button size="sm" disabled={updateStatus.isPending} onClick={() => changeStatus(appt.id, "confirmed")}>{t("appointments.workflow.confirm")}</Button>}
                      {staff && appt.status === "confirmed" && appointmentStart(appt.date, appt.time).getTime() <= Date.now() && <Button size="sm" disabled={updateStatus.isPending} onClick={() => changeStatus(appt.id, "completed")}>{t("appointments.workflow.complete")}</Button>}
                      {staff && ["scheduled", "confirmed"].includes(appt.status) && appointmentStart(appt.date, appt.time).getTime() <= Date.now() && <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => changeStatus(appt.id, "missed")}>{t("appointments.workflow.missed")}</Button>}

                      {(appt.status === "confirmed" || appt.status === "scheduled") && (staff || appointmentStart(appt.date, appt.time).getTime() > Date.now()) ? (
                        <Button size="sm" variant="danger" disabled={updateStatus.isPending} onClick={() => { updateStatus.reset(); setCancelReason(""); setCancelTarget(appt.id); }}>
                          {t("appointments.cancel")}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {!appointments.isLoading && !appointments.isError && (page > 1 || (appointments.data?.totalPages ?? 0) > 1) && (
            <nav className="flex justify-between items-center mt-4" aria-label={t("appointments.myAppointments")}>
              <Button variant="outline" disabled={page === 1 || appointments.isFetching} onClick={() => setPage(page - 1)}>{t("alerts.previous")}</Button>
              <span className="text-sm text-gray-500">{t("alerts.page", { page, total: appointments.data?.totalPages })}</span>
              <Button variant="outline" disabled={page >= (appointments.data?.totalPages ?? 1) || appointments.isFetching} onClick={() => setPage(page + 1)}>{t("alerts.next")}</Button>
            </nav>
          )}
          {updateStatus.isError && <p role="alert" className="mt-3 text-sm text-red-700">{getApiErrorMessage(updateStatus.error)}</p>}
        </div>
      </div>

      <Modal open={Boolean(scheduleTarget)} onClose={() => { if (!reschedule.isPending) setScheduleTarget(null); }} title={t("appointments.workflow.reschedule")}><form onSubmit={saveSchedule} className="space-y-4"><p>{t("appointments.workflow.reconfirm")}</p><Field label={t("appointments.date")} htmlFor="schedule-date"><Input id="schedule-date" name="date" type="date" required min={appointmentToday()} value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} /></Field><Field label={t("appointments.time")} htmlFor="schedule-time"><Input id="schedule-time" name="time" type="time" required value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} /></Field>{reschedule.isError && <p role="alert" className="text-red-700">{getApiErrorMessage(reschedule.error)}</p>}<Button type="submit" loading={reschedule.isPending}>{t("appointments.workflow.saveSchedule")}</Button></form></Modal>
      <Modal open={Boolean(cancelTarget)} onClose={() => { if (!updateStatus.isPending) setCancelTarget(null); }} title={t("appointments.cancelConfirmTitle")}>
        <p>{t("appointments.cancelConfirmMessage")}</p>
        <Field label={t("appointments.workflow.reason")} htmlFor="cancel-reason"><Textarea id="cancel-reason" maxLength={500} value={cancelReason} onChange={e => setCancelReason(e.target.value)} /></Field>
        {updateStatus.isError && <p role="alert" className="text-red-700">{getApiErrorMessage(updateStatus.error)}</p>}
        <div className="flex justify-end gap-2 mt-4"><Button variant="outline" disabled={updateStatus.isPending} onClick={() => setCancelTarget(null)}>{t("common.cancel")}</Button><Button variant="danger" loading={updateStatus.isPending} onClick={confirmCancel}>{t("appointments.cancel")}</Button></div>
      </Modal>
    </div>
  );
}
