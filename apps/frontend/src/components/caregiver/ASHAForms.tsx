import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateHealthMetric, useCreateAlert, useCreateReferral, useCreateAppointment, useDoctors } from "@/hooks/queries";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { toLocalInputDate } from "@/lib/date";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

type MetricForm = {
  date: string;
  weight?: number;
  systolicBP?: number;
  diastolicBP?: number;
  glucose?: number;
  heartRate?: number;
  temperature?: number;
  hemoglobin?: number;
  notes?: string;
};

type AlertForm = {
  severity: "info" | "warning" | "urgent" | "critical";
  title: string;
  message: string;
};

type ReferralForm = {
  referredTo?: string;
  facility?: string;
  reason: string;
  notes?: string;
};

type AppointmentForm = {
  date: string;
  time: string;
  type: string;
  notes?: string;
};

export function ASHMetricForm({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);
  const create = useCreateHealthMetric();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MetricForm>({
    resolver: zodResolver(schemas.healthMetric),
    defaultValues: { date: toLocalInputDate(new Date()) },
  });

  return (
    <Card title={t("asha.recordMetric")}>
      <form
        onSubmit={handleSubmit((data) =>
          create.mutate(
            {
              input: {
                date: data.date,
                weight: data.weight || undefined,
                systolicBP: data.systolicBP || undefined,
                diastolicBP: data.diastolicBP || undefined,
                glucose: data.glucose || undefined,
                heartRate: data.heartRate || undefined,
                temperature: data.temperature || undefined,
                hemoglobin: data.hemoglobin || undefined,
                notes: data.notes || undefined,
              },
              userId: patientId,
            },
            {
              onSuccess: () => {
                push(t("metrics.saved"), "success");
                reset({ date: toLocalInputDate(new Date()) });
              },
              onError: (err) => push(getApiErrorMessage(err), "error"),
            }
          )
        )}
        className="space-y-3"
        noValidate
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label={t("metrics.date")} htmlFor="m-date">
            <Input id="m-date" type="date" {...register("date")} />
          </Field>
          <Field label={`${t("metrics.weight")} (kg)`} htmlFor="m-weight" error={errors.weight?.message}>
            <Input id="m-weight" type="number" step="0.1" {...register("weight", { valueAsNumber: true })} />
          </Field>
          <Field label={t("metrics.systolicBP")} htmlFor="m-sbp" error={errors.systolicBP?.message}>
            <Input id="m-sbp" type="number" {...register("systolicBP", { valueAsNumber: true })} />
          </Field>
          <Field label={t("metrics.diastolicBP")} htmlFor="m-dbp" error={errors.diastolicBP?.message}>
            <Input id="m-dbp" type="number" {...register("diastolicBP", { valueAsNumber: true })} />
          </Field>
          <Field label={`${t("metrics.glucose")} (mg/dL)`} htmlFor="m-glucose" error={errors.glucose?.message}>
            <Input id="m-glucose" type="number" {...register("glucose", { valueAsNumber: true })} />
          </Field>
          <Field label={`${t("metrics.heartRate")} (bpm)`} htmlFor="m-hr" error={errors.heartRate?.message}>
            <Input id="m-hr" type="number" {...register("heartRate", { valueAsNumber: true })} />
          </Field>
          <Field label={`${t("metrics.temperature")} (°C)`} htmlFor="m-temp" error={errors.temperature?.message}>
            <Input id="m-temp" type="number" step="0.1" {...register("temperature", { valueAsNumber: true })} />
          </Field>
          <Field label={`${t("metrics.hemoglobin")} (g/dL)`} htmlFor="m-hb" error={errors.hemoglobin?.message}>
            <Input id="m-hb" type="number" step="0.1" {...register("hemoglobin", { valueAsNumber: true })} />
          </Field>
        </div>
        <Field label={t("metrics.notes")} htmlFor="m-notes">
          <Textarea id="m-notes" rows={2} {...register("notes")} />
        </Field>
        <Button type="submit" loading={create.isPending}>{t("common.save")}</Button>
      </form>
    </Card>
  );
}

export function ASHAlertForm({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);
  const create = useCreateAlert();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlertForm>({
    resolver: zodResolver(schemas.alert),
    defaultValues: { severity: "warning" },
  });

  return (
    <Card title={t("asha.createAlert")}>
      <form
        onSubmit={handleSubmit((data) =>
          create.mutate(
            {
              user: patientId,
              type: "follow_up",
              severity: data.severity,
              title: data.title,
              message: data.message,
            },
            {
              onSuccess: () => {
                push(t("alerts.created"), "success");
                reset({ severity: "warning", title: "", message: "" });
              },
              onError: (err) => push(getApiErrorMessage(err), "error"),
            }
          )
        )}
        className="space-y-3"
        noValidate
      >
        <Field label={t("alerts.severity")} htmlFor="a-sev" required>
          <Select id="a-sev" {...register("severity")}>
            <option value="info">{t("status.severity.info")}</option>
            <option value="warning">{t("status.severity.warning")}</option>
            <option value="urgent">{t("status.severity.urgent")}</option>
            <option value="critical">{t("status.severity.critical")}</option>
          </Select>
        </Field>
        <Field label={t("alerts.titleLabel")} htmlFor="a-title" error={errors.title?.message} required>
          <Input id="a-title" {...register("title")} />
        </Field>
        <Field label={t("alerts.message")} htmlFor="a-message" error={errors.message?.message} required>
          <Textarea id="a-message" rows={3} {...register("message")} />
        </Field>
        <Button type="submit" loading={create.isPending}>{t("alerts.create")}</Button>
      </form>
    </Card>
  );
}

export function ReferralForm({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);
  const create = useCreateReferral();
  const doctors = useDoctors();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReferralForm>({
    resolver: zodResolver(schemas.referral),
  });

  return (
    <Card title={t("asha.refer")}>
      <p className="text-xs text-gray-400 mb-3">{t("asha.referHint")}</p>
      <form
        onSubmit={handleSubmit((data) =>
          create.mutate(
            {
              patient: patientId,
              referredTo: data.referredTo || undefined,
              facility: data.facility || undefined,
              reason: data.reason,
              notes: data.notes || undefined,
            },
            {
              onSuccess: () => {
                push(t("referrals.created"), "success");
                reset();
              },
              onError: (err) => push(getApiErrorMessage(err), "error"),
            }
          )
        )}
        className="space-y-3"
        noValidate
      >
        <Field label={t("referrals.referredTo")} htmlFor="r-to" error={errors.referredTo?.message}>
          <Select id="r-to" {...register("referredTo")} disabled={doctors.isLoading}>
            <option value="">{t("referrals.referredToNone")}</option>
            {(doctors.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("referrals.facility")} htmlFor="r-facility">
          <Input id="r-facility" {...register("facility")} />
        </Field>
        <Field label={t("referrals.reason")} htmlFor="r-reason" error={errors.reason?.message} required>
          <Textarea id="r-reason" rows={3} {...register("reason")} />
        </Field>
        <Field label={t("referrals.notes")} htmlFor="r-notes">
          <Textarea id="r-notes" rows={2} {...register("notes")} />
        </Field>
        <Button type="submit" loading={create.isPending}>{t("referrals.submit")}</Button>
      </form>
    </Card>
  );
}

export function BookAppointmentForm({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);
  const create = useCreateAppointment();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(schemas.appointment),
    defaultValues: { date: toLocalInputDate(new Date()), time: "10:00", type: "antenatal" },
  });

  return (
    <Card title={t("appointments.bookTitle")}>
      <form
        onSubmit={handleSubmit((data) =>
          create.mutate(
            {
              patient: patientId,
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
          )
        )}
        className="space-y-3"
        noValidate
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("appointments.date")} htmlFor="b-date" error={errors.date?.message} required>
            <Input id="b-date" type="date" {...register("date")} />
          </Field>
          <Field label={t("appointments.time")} htmlFor="b-time" error={errors.time?.message} required>
            <Input id="b-time" type="time" {...register("time")} />
          </Field>
        </div>
        <Field label={t("appointments.type")} htmlFor="b-type" error={errors.type?.message} required>
          <Select id="b-type" {...register("type")}>
            <option value="antenatal">{t("appointments.typeOptions.antenatal")}</option>
            <option value="vaccination">{t("appointments.typeOptions.vaccination")}</option>
            <option value="ultrasound">{t("appointments.typeOptions.ultrasound")}</option>
            <option value="lab">{t("appointments.typeOptions.lab")}</option>
            <option value="consultation">{t("appointments.typeOptions.consultation")}</option>
            <option value="other">{t("appointments.typeOptions.other")}</option>
          </Select>
        </Field>
        <Field label={t("appointments.notes")} htmlFor="b-notes">
          <Textarea id="b-notes" rows={2} {...register("notes")} />
        </Field>
        <Button type="submit" loading={create.isPending}>{t("appointments.book")}</Button>
      </form>
    </Card>
  );
}

/* Collapsible wrapper for the ASHA quick-action forms. */
export function ASHAActionForms({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary w-full justify-center"
        aria-expanded={open}
      >
        {open ? t("common.hide") : t("asha.quickActions")}
      </button>
      {open && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ASHMetricForm patientId={patientId} />
          <ASHAlertForm patientId={patientId} />
          <ReferralForm patientId={patientId} />
          <BookAppointmentForm patientId={patientId} />
        </div>
      )}
    </div>
  );
}
