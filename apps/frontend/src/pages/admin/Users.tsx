import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRole, Language } from "@maasuraksha/shared";
import { useAdminUsers, useCreateAdminUser, useUpdateAdminUser } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatDate } from "@/lib/date";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import type { UserDTO } from "@/lib/types";

type CreateForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  language: Language;
};

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editing, setEditing] = useState<UserDTO | null>(null);

  const users = useAdminUsers();
  const ashas = useAdminUsers({ role: "ASHA", limit: 100 });
  const doctors = useAdminUsers({ role: "DOCTOR", limit: 100 });
  const create = useCreateAdminUser();
  const update = useUpdateAdminUser();

  const allUsers = useMemo(() => users.data?.items ?? [], [users.data]);
  const filtered = roleFilter === "all" ? allUsers : allUsers.filter((u) => u.role === roleFilter);
  const ashaList = ashas.data?.items ?? [];
  const doctorList = doctors.data?.items ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(schemas.register),
    defaultValues: { role: UserRole.PATIENT, language: Language.EN },
  });

  const onCreate = (data: CreateForm) => {
    create.mutate(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone || undefined,
        language: data.language,
      },
      {
        onSuccess: () => {
          push(t("admin.users.created"), "success");
          reset({ role: UserRole.PATIENT, language: Language.EN });
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  if (users.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.users.title")} subtitle={t("admin.users.subtitle")} />

      <Card title={t("admin.users.createTitle")}>
        <form onSubmit={handleSubmit(onCreate)} className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl" noValidate>
          <Field label={t("auth.name")} htmlFor="u-name" error={errors.name?.message} required>
            <Input id="u-name" {...register("name")} />
          </Field>
          <Field label={t("auth.email")} htmlFor="u-email" error={errors.email?.message} required>
            <Input id="u-email" type="email" {...register("email")} />
          </Field>
          <Field label={t("auth.password")} htmlFor="u-password" error={errors.password?.message} required>
            <Input id="u-password" type="password" {...register("password")} />
          </Field>
          <Field label={t("auth.role")} htmlFor="u-role" error={errors.role?.message} required>
            <Select id="u-role" {...register("role")}>
              <option value={UserRole.PATIENT}>{t("roles.PATIENT")}</option>
              <option value={UserRole.ASHA}>{t("roles.ASHA")}</option>
              <option value={UserRole.DOCTOR}>{t("roles.DOCTOR")}</option>
            </Select>
          </Field>
          <Field label={t("auth.phone")} htmlFor="u-phone">
            <Input id="u-phone" type="tel" {...register("phone")} />
          </Field>
          <Field label={t("auth.language")} htmlFor="u-language">
            <Select id="u-language" {...register("language")}>
              <option value={Language.EN}>English</option>
              <option value={Language.HI}>à¤¹à¤¿à¤¨à¥à¤¦à¥€</option>
              <option value={Language.KN}>à²•à²¨à³à²¨à²¡</option>
            </Select>
          </Field>
          <div className="col-span-2 lg:col-span-3">
            <Button type="submit" loading={create.isPending}>{t("admin.users.create")}</Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-2 flex-wrap">
            {["all", UserRole.PATIENT, UserRole.ASHA, UserRole.DOCTOR].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                  roleFilter === role ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {role === "all" ? t("common.all") : t(`roles.${role}`)}
              </button>
            ))}
          </div>
        </div>

        {users.isError ? (
          <ErrorState message={users.error?.message} onRetry={() => users.refetch()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-3 font-medium">{t("admin.users.name")}</th>
                  <th className="py-2 pr-3 font-medium">{t("auth.email")}</th>
                  <th className="py-2 pr-3 font-medium">{t("auth.role")}</th>
                  <th className="py-2 pr-3 font-medium">{t("admin.users.status")}</th>
                  <th className="py-2 pr-3 font-medium">{t("admin.users.created")}</th>
                  <th className="py-2 font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/60">
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2 pr-3 font-medium text-gray-900">{u.name}</td>
                    <td className="py-2 pr-3 text-gray-600">{u.email}</td>
                    <td className="py-2 pr-3">{t(`roles.${u.role}`)}</td>
                    <td className="py-2 pr-3">
                      <Badge color={u.isActive ? "green" : "red"}>
                        {u.isActive ? t("admin.users.active") : t("admin.users.inactive")}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-gray-500">{formatDate(u.createdAt, lang)}</td>
                    <td className="py-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(u)}>
                        {t("admin.users.edit")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <EditUserModal
        user={editing}
        ashas={ashaList}
        doctors={doctorList}
        onClose={() => setEditing(null)}
        onSave={(id, patch) =>
          update.mutate(
            { id, patch },
            {
              onSuccess: () => {
                push(t("admin.users.updated"), "success");
                setEditing(null);
              },
              onError: (err) => push(getApiErrorMessage(err), "error"),
            }
          )
        }
      />
    </div>
  );
}

function EditUserModal({
  user,
  ashas,
  doctors,
  onClose,
  onSave,
}: {
  user: UserDTO | null;
  ashas: UserDTO[];
  doctors: UserDTO[];
  onClose: () => void;
  onSave: (id: string, patch: unknown) => void;
}) {
  const { t } = useTranslation();
  const [role, setRole] = useState<string>(user?.role ?? UserRole.PATIENT);
  const [active, setActive] = useState<boolean>(user?.isActive ?? true);
  const [asha, setAsha] = useState<string>(user?.assignedASHA ?? "");
  const [doctor, setDoctor] = useState<string>(user?.assignedDoctor ?? "");

  if (!user) return null;
  const isPatient = role === UserRole.PATIENT;

  return (
    <Modal open={Boolean(user)} onClose={onClose} title={`${t("admin.users.edit")}: ${user.name}`}>
      <div className="space-y-4">
        <Field label={t("auth.role")} htmlFor="e-role">
          <Select id="e-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value={UserRole.PATIENT}>{t("roles.PATIENT")}</option>
            <option value={UserRole.ASHA}>{t("roles.ASHA")}</option>
            <option value={UserRole.DOCTOR}>{t("roles.DOCTOR")}</option>
          </Select>
        </Field>
        <Field label={t("admin.users.status")} htmlFor="e-active">
          <Select id="e-active" value={active ? "1" : "0"} onChange={(e) => setActive(e.target.value === "1")}>
            <option value="1">{t("admin.users.active")}</option>
            <option value="0">{t("admin.users.inactive")}</option>
          </Select>
        </Field>
        {isPatient && (
          <>
            <Field label={t("admin.users.assignedASHA")} htmlFor="e-asha">
              <Select id="e-asha" value={asha} onChange={(e) => setAsha(e.target.value)}>
                <option value="">{t("common.none")}</option>
                {ashas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </Field>
            <Field label={t("admin.users.assignedDoctor")} htmlFor="e-doctor">
              <Select id="e-doctor" value={doctor} onChange={(e) => setDoctor(e.target.value)}>
                <option value="">{t("common.none")}</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </Field>
          </>
        )}
        <Button
          onClick={() =>
            onSave(user.id, {
              role,
              isActive: active,
              assignedASHA: isPatient ? asha || null : null,
              assignedDoctor: isPatient ? doctor || null : null,
            })
          }
        >
          {t("common.save")}
        </Button>
      </div>
    </Modal>
  );
}