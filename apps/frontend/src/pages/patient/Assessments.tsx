import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { MaternalRiskPanel, GDMPanel, PPDPanel } from "@/components/assessments/AssessmentPanels";

export default function AssessmentsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;
  const userId = user.id;

  return (
    <div className="space-y-6">
      <PageHeader title={t("assessments.title")} subtitle={t("assessments.subtitle")} />
      <MaternalRiskPanel userId={userId} />
      <GDMPanel userId={userId} />
      <PPDPanel userId={userId} />
    </div>
  );
}