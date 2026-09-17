import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EDUCATIONAL_CATEGORIES } from "@maasuraksha/shared";
import { useEducation } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { Language } from "@maasuraksha/shared";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EducationalContentDTO } from "@/lib/types";

export function pickLocalized(
  value: Record<Language, string> | string | undefined,
  lang: Language
): string {
  if (typeof value === "string") return value;
  if (!value) return "";
  return value[lang] ?? value.en ?? "";
}

export default function EducationPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const [category, setCategory] = useState<string>("all");
  const [selected, setSelected] = useState<EducationalContentDTO | null>(null);

  const education = useEducation({ lang });

  const items = useMemo(() => {
    const list = education.data?.items ?? [];
    if (category === "all") return list;
    return list.filter((e) => e.category === category);
  }, [education.data, category]);

  if (education.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("education.title")} subtitle={t("education.subtitle")} />

      <div className="flex flex-wrap gap-2">
        <CategoryChip active={category === "all"} onClick={() => setCategory("all")} label={t("education.allCategories")} />
        {EDUCATIONAL_CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat}
            active={category === cat}
            onClick={() => setCategory(cat)}
            label={t(`education.category.${cat}`, { defaultValue: cat })}
          />
        ))}
      </div>

      {education.isError ? (
        <ErrorState message={education.error?.message} onRetry={() => education.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={t("education.none")} description={t("education.noneDescription")} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="card hover:border-primary-200 hover:shadow-md transition-shadow text-left p-5"
            >
              <p className="text-xs text-primary-600 font-medium mb-1">
                {t(`education.category.${item.category}`, { defaultValue: item.category })}
              </p>
              <h3 className="font-semibold text-gray-900 text-sm">
                {pickLocalized(item.title, lang)}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                {pickLocalized(item.body, lang)}
              </p>
            </button>
          ))}
        </div>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? pickLocalized(selected.title, lang) : ""}>
        {selected && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {pickLocalized(selected.body, lang)}
            </p>
            {(selected.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.tags.map((tag) => (
                  <span key={tag} className="chip">{tag}</span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">{t("education.disclaimer")}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
        active
          ? "chip-active"
          : "chip"
      }`}
    >
      {label}
    </button>
  );
}