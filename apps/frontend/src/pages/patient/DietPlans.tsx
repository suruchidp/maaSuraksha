import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useDietGuidance,
  useUpdateDietGuidancePreferences,
  useDietPlans,
} from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriorityBadge } from "@/components/status/StatusLabels";
import {
  DIET_PREFERENCE_OPTIONS,
  DIET_REGION_OPTIONS,
} from "@/services/dietGuidance";
import type { DietGuidanceDTO, DietPlanDTO } from "@/lib/types";
import { Language } from "@maasuraksha/shared";
import type { DietMealPreference } from "@maasuraksha/shared";

export default function DietPlansPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const guidance = useDietGuidance();
  const plans = useDietPlans(undefined, 20);

  if (guidance.isLoading) return <Spinner />;

  const items = guidance.data?.guidance ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("diet.title")} subtitle={t("diet.subtitle")} />

      <PreferencesCard />

      {guidance.isError ? (
        <ErrorState
          message={guidance.error?.message}
          onRetry={() => guidance.refetch()}
        />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title={t("diet.none")}
            description={t("diet.noneDescription")}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <GuidanceCard key={item.id} item={item} lang={lang} />
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t("diet.careTeamPlans")}</h2>
        <p className="text-sm text-gray-500">{t("diet.careTeamPlansDescription")}</p>
        <div className="mt-3 space-y-3">
          {plans.isLoading ? (
            <Spinner />
          ) : plans.isError ? (
            <ErrorState message={plans.error?.message} onRetry={() => plans.refetch()} />
          ) : (plans.data?.items ?? []).length === 0 ? (
            <Card>
              <EmptyState title={t("diet.none")} description={t("diet.noneDescription")} />
            </Card>
          ) : (
            (plans.data?.items ?? []).map((plan) => (
              <DietPlanCard key={plan.id} plan={plan} lang={lang} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PreferencesCard() {
  const { t } = useTranslation();
  const guidance = useDietGuidance();
  const save = useUpdateDietGuidancePreferences();

  const savedPrefs = guidance.data?.preferences;
  const [mealPreference, setMealPreference] = useState<DietMealPreference>("vegetarian");
  const [region, setRegion] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (savedPrefs) {
      setMealPreference(savedPrefs.mealPreference);
      setRegion(savedPrefs.region ?? "");
    }
  }, [savedPrefs?.id, savedPrefs?.updatedAt]);

  const onSave = () => {
    setSavedNotice(false);
    save.mutate(
      { mealPreference, region: region || undefined },
      { onSuccess: () => setSavedNotice(true) }
    );
  };

  return (
    <Card title={t("diet.preferencesTitle")}>
      <p className="text-sm text-gray-500">{t("diet.preferencesDescription")}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="meal-preference" className="label">
            {t("diet.mealPreference")}
          </label>
          <Select
            id="meal-preference"
            value={mealPreference}
            onChange={(e) => setMealPreference(e.target.value as DietMealPreference)}
          >
            {DIET_PREFERENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="diet-region" className="label">
            {t("diet.regionOptional")}
          </label>
          <Select id="diet-region" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">{t("diet.regionLabel.other")}</option>
            {DIET_REGION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" onClick={onSave} loading={save.isPending}>
          {save.isPending ? t("diet.saving") : t("diet.save")}
        </Button>
        {savedNotice && (
          <p className="text-sm text-green-600" role="status">
            {t("diet.saved")}
          </p>
        )}
      </div>
    </Card>
  );
}

function GuidanceCard({ item, lang }: { item: DietGuidanceDTO; lang: Language }) {
  const { t } = useTranslation();
  const isHigh = item.priority === "high";
  const title = item.titleLocalized?.[lang] ?? item.title;
  const rationale = item.rationaleLocalized?.[lang] ?? item.rationale;
  const disclaimer = item.disclaimerLocalized?.[lang] ?? item.disclaimer;

  return (
    <Card className={isHigh ? "ring-2 ring-red-200 border-red-200" : undefined}>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <PriorityBadge priority={item.priority} />
        <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
          {t("diet.generated")}
        </span>
        <span className="text-xs text-gray-400">{formatDate(item.createdAt, lang)}</span>
      </div>
      <h3
        className={`${isHigh ? "text-red-900" : "text-gray-900"} font-semibold text-base`}
      >
        {title}
      </h3>
      <div className="mt-3 space-y-3">
        {item.sections.map((section) => (
          <div key={section.key} className="rounded-lg border border-gray-100 p-3">
            <p className="text-sm font-medium text-gray-800">
              {section.heading[lang] ?? Object.values(section.heading)[0]}
            </p>
            {section.body && (
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                {section.body[lang] ?? section.body.en}
              </p>
            )}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {section.bullets.map((bullet, j) => (
                  <li key={j} className="text-sm text-gray-600">
                    · {bullet[lang] ?? bullet.en}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      {rationale && (
        <p className="text-xs text-gray-400 mt-2 italic">
          {t("diet.why")}: {rationale}
        </p>
      )}
      {item.attribution && item.attribution.length > 0 && (
        <p className="text-xs text-gray-400 mt-1">
          {t("diet.sources")}:{" "}
          {item.attribution.map((source, i) => (
            <span key={source.id}>
              {i > 0 && <span> · </span>}
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="underline text-primary-700"
              >
                {source.title}
              </a>
            </span>
          ))}
        </p>
      )}
      {disclaimer && (
        <p className="text-xs text-gray-400 italic mt-3">{disclaimer}</p>
      )}
    </Card>
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
        <p className="text-sm text-gray-600 mt-3">
          {t("diet.nutritionalNotes")}: {plan.nutritionalNotes}
        </p>
      )}
      {plan.disclaimer && (
        <p className="text-xs text-gray-400 italic mt-3">{plan.disclaimer}</p>
      )}
      <p className="text-xs text-gray-400 mt-2">{formatDate(plan.createdAt, lang)}</p>
    </Card>
  );
}