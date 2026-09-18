import PregnancyPage from "@/pages/patient/Pregnancy";
import ReportsPage from "@/pages/patient/Reports";
import AppointmentsPage from "@/pages/patient/Appointments";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePatients } from "@/hooks/queries";
import { PatientOverview } from "@/components/caregiver/PatientOverview";
import { ASHAActionForms } from "@/components/caregiver/ASHAForms";
import { Spinner } from "@/components/ui/Spinner";
import NotFoundPage from "@/pages/NotFoundPage";

export default function ASHAPatientDetailPage() {
  const { t } = useTranslation();
  const { patientId } = useParams<{ patientId: string }>();
  const patients = usePatients("", 100);

  if (patients.isLoading) return <Spinner />;

  const patient = (patients.data?.items ?? []).find((p) => p.id === patientId);
  if (!patient) return <NotFoundPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/asha/patients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" /> {t("asha.backToPatients")}
        </Link>
      </div>
      <PatientOverview patient={patient} />
      <PregnancyPage key={`pregnancy-${patient.id}`} patientId={patient.id} />
      <AppointmentsPage key={patient.id} patientId={patient.id} />
      <ReportsPage key={`reports-${patient.id}`} patientId={patient.id} />
      <ASHAActionForms patientId={patient.id} />
    </div>
  );
}