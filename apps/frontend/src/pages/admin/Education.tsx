import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useEducation, useCreateEducation, useUpdateEducation } from "@/hooks/queries";
import { EDUCATIONAL_CATEGORIES, Language } from "@maasuraksha/shared";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { pickLocalized } from "@/pages/patient/Education";
import type { EducationalContentDTO } from "@/lib/types";

const LANG_TABS: { code: Language; label: string }[] = [
  { code: Language.EN, label: "English" },
  { code: Language.HI, label: "हिन्दी" },
  { code: Language.KN, label: "ಕನ್ನಡ" },
];

interface ContentDraft {
  id?: string;
  category: string;
  tags: string;
  isActive: boolean;
  title: Record<Language, string>;
  body: Record<Language, string>;
}

const emptyDraft = (): ContentDraft => ({
  category: "pregnancy",
  tags: "",
  isActive: true,
  title: { en: "", hi: "", kn: "" },
  body: { en: "", hi: "", kn: "" },
});

export default function AdminEducationPage() {
  const { t } = useTranslation();
  const push = useToastStore((s) => s.push);
  const education = useEducation({});
  const create = useCreateEducation();
  const update = useUpdateEducation();

  const [editing, setEditing] = useState<ContentDraft | null>(null);
  const [langTab, setLangTab] = useState<Language>(Language.EN);

  const openCreate = () => {
    setLangTab(Language.EN);
    setEditing(emptyDraft());
  };
  const openEdit = (item: EducationalContentDTO) => {
    setLangTab(Language.EN);
    setEditing({
      id: item.id,
      category: item.category,
      tags: (item.tags ?? []).join(", "),
      isActive: item.isActive,
      title: { ...item.title },
      body: { ...item.body },
    });
  };

  const save = () => {
    if (!editing) return;
    const payload = {
      title: editing.title,
      body: editing.body,
      category: editing.category,
      tags: editing.tags.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const finish = () => {
      push(t("admin.education.saved"), "success");
      setEditing(null);
    };
    if (editing.id) {
      update.mutate({ id: editing.id, patch: { ...payload, isActive: editing.isActive } }, { onSuccess: finish, onError: (e) => push(getApiErrorMessage(e), "error") });
    } else {
      create.mutate(payload, { onSuccess: finish, onError: (e) => push(getApiErrorMessage(e), "error") });
    }
  };

  if (education.isLoading) return <Spinner />;

  const items = education.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.education.title")} subtitle={t("admin.education.subtitle")} />

      <div className="flex justify-end">
        <Button onClick={openCreate}>{t("admin.education.create")}</Button>
      </div>

      {education.isError ? (
        <ErrorState message={education.error?.message} onRetry={() => education.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={t("education.none")} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex items-center gap-2 mb-1">
                <Badge color={item.isActive ? "green" : "gray"}>
                  {item.isActive ? t("admin.education.active") : t("admin.education.inactive")}
                </Badge>
                <span className="text-xs text-gray-400">{t(`education.category.${item.category}`, { defaultValue: item.category })}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{pickLocalized(item.title, Language.EN)}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{pickLocalized(item.body, Language.EN)}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => openEdit(item)}>
                {t("admin.education.edit")}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? t("admin.education.edit") : t("admin.education.create")}
        size="lg"
      >
        {editing && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {LANG_TABS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLangTab(l.code)}
                  className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                    langTab === l.code ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`${t("admin.education.category")} *`}>
                <Select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  {EDUCATIONAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{t(`education.category.${c}`, { defaultValue: c })}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t("admin.education.tags")}>
                <Input value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} placeholder="tag1, tag2" />
              </Field>
            </div>

            <Field label={`${t("admin.education.title")} (${LANG_TABS.find((l) => l.code === langTab)?.label})`} required>
              <Input
                value={editing.title[langTab]}
                onChange={(e) => setEditing({ ...editing, title: { ...editing.title, [langTab]: e.target.value } })}
              />
            </Field>
            <Field label={`${t("admin.education.body")} (${LANG_TABS.find((l) => l.code === langTab)?.label})`} required>
              <Textarea
                rows={6}
                value={editing.body[langTab]}
                onChange={(e) => setEditing({ ...editing, body: { ...editing.body, [langTab]: e.target.value } })}
              />
            </Field>

            <Field label={t("admin.education.isActive")}>
              <Select value={editing.isActive ? "1" : "0"} onChange={(e) => setEditing({ ...editing, isActive: e.target.value === "1" })}>
                <option value="1">{t("admin.education.active")}</option>
                <option value="0">{t("admin.education.inactive")}</option>
              </Select>
            </Field>

            <Button onClick={save} loading={create.isPending || update.isPending}>
              {t("common.save")}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}