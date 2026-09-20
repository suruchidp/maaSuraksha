import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePatients } from "@/hooks/queries";
import { PatientOverview } from "@/components/caregiver/PatientOverview";
import { PatientRecord } from "@/components/caregiver/PatientRecord";
import { DoctorActionForms } from "@/components/caregiver/DoctorForms";
import { MaternalRiskPanel, GDMPanel, PPDPanel } from "@/components/assessments/AssessmentPanels";
import { Spinner } from "@/components/ui/Spinner";
import NotFoundPage from "@/pages/NotFoundPage";

export default function DoctorPatientDetailPage() {
  const { t } = useTranslation();
  const { patientId } = useParams<{ patientId: string }>();
  const patients = usePatients("", 100);

  if (patients.isLoading) return <Spinner />;

  const patient = (patients.data?.items ?? []).find((p) => p.id === patientId);
  if (!patient) return <NotFoundPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/doctor/patients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" /> {t("doctor.backToPatients")}
        </Link>
      </div>
      <PatientOverview patient={patient} />
      <PatientRecord patientId={patient.id} showAssessments={false} />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("doctor.runAssessments")}</h2>
        <div className="space-y-4">
          <MaternalRiskPanel userId={patient.id} />
          <GDMPanel userId={patient.id} />
          <PPDPanel userId={patient.id} />
        </div>
      </div>

      <DoctorActionForms patientId={patient.id} />
    </div>
  );
}