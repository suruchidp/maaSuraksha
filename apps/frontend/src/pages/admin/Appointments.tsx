import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePatients } from "@/hooks/queries";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import AppointmentsPage from "@/pages/patient/Appointments";

export default function AdminAppointmentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const patients = usePatients(search, 100);
  return <div className="space-y-6">
    <Field label={t("appointments.workflow.patientSearch")} htmlFor="patient-search"><Input id="patient-search" value={search} onChange={e => setSearch(e.target.value)} /></Field>
    {patients.isLoading ? <Spinner /> : patients.isError ? <ErrorState message={patients.error?.message} onRetry={() => patients.refetch()} /> : <Field label={t("appointments.workflow.patient")} htmlFor="appointment-patient"><Select id="appointment-patient" value={patientId} onChange={e => setPatientId(e.target.value)}><option value="">{t("appointments.workflow.choosePatient")}</option>{(patients.data?.items ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>}
    {patientId && <AppointmentsPage key={patientId} patientId={patientId} />}
  </div>;
}
