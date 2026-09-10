import { useTranslation } from "react-i18next";
import { useDietPlans } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DietPlanDTO } from "@/lib/types";
import { Language } from "@maasuraksha/shared";

export default function DietPlansPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const plans = useDietPlans(undefined, 20);

  if (plans.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("diet.title")} subtitle={t("diet.subtitle")} />

      {plans.isError ? (
        <ErrorState message={plans.error?.message} onRetry={() => plans.refetch()} />
      ) : (plans.data?.items ?? []).length === 0 ? (
        <Card>
          <EmptyState title={t("diet.none")} description={t("diet.noneDescription")} />
        </Card>
      ) : (
        (plans.data?.items ?? []).map((plan) => <DietPlanCard key={plan.id} plan={plan} lang={lang} />)
      )}
    </div>
  );
}

function DietPlanCard({ plan, lang }: { plan: DietPlanDTO; lang: Language }) {
  const { t } = useTranslation();
  return (
    <Card title={plan.title}>
      <p className="text-sm text-gray-600">{plan.description}</p>
      <div className="mt-4 space-y-3">
        {plan.meals.map((meal, i) => (
          <div key={i} className="rounded-lg border border-gray-100 p-3">
            <p className="text-sm font-medium text-gray-800">{meal.name}</p>
            <ul className="mt-1 space-y-0.5">
              {meal.items.map((item, j) => (
                <li key={j} className="text-sm text-gray-600">
                  · {t(`diet.category.${item}`, { defaultValue: item })}
                </li>
              ))}
            </ul>
            {meal.notes && <p className="text-xs text-gray-400 mt-1">{meal.notes}</p>}
          </div>
        ))}
      </div>
      {plan.nutritionalNotes && (
        <p className="text-sm text-gray-600 mt-3">{t("diet.nutritionalNotes")}: {plan.nutritionalNotes}</p>
      )}
      {plan.disclaimer && <p className="text-xs text-gray-400 italic mt-3">{plan.disclaimer}</p>}
      <p className="text-xs text-gray-400 mt-2">{formatDate(plan.createdAt, lang)}</p>
    </Card>
  );
}