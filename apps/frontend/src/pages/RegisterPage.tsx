import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { UserRole, Language } from "@maasuraksha/shared";
import { register as registerApi } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore } from "@/stores/languageStore";
import { buildSchemas } from "@/lib/schemas";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { BrandMark } from "@/components/brand/BrandMark";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  language: Language;
};

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionUser = useAuthStore((s) => s.user);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schemas.register),
    defaultValues: { role: UserRole.PATIENT, language: Language.EN },
  });

  if (isAuthenticated && sessionUser) {
    return <Navigate to={`/${sessionUser.role.toLowerCase()}/dashboard`} replace />;
  }

  const registerMutation = useMutation({
    mutationFn: (data: RegisterForm) =>
      registerApi({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone,
        language: data.language,
      }),
    onSuccess: (data) => {
      useLanguageStore
        .getState()
        .setLanguage(data.user.language as Language);
      setAuth(
        {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          language: data.user.language,
          isActive: true,
        },
        data.token
      );
      push(t("auth.registerSuccess"), "success");
      navigate(`/${data.user.role.toLowerCase()}/dashboard`, { replace: true });
    },
    onError: (err: unknown) => {
      push(getApiErrorMessage(err), "error");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-maternal-sheen py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center">
            <BrandMark className="w-14 h-14 sm:w-16 sm:h-16 shadow-soft" />
            <span className="font-display text-3xl font-semibold text-gray-900 mt-3">
              {t("app.name")}
            </span>
            <span className="mt-1.5 text-sm font-medium text-primary-600/90 leading-snug">
              {t("app.taglineLine1")}
              <br />
              {t("app.taglineLine2")}
            </span>
          </Link>
          <h1 className="font-display text-2xl font-semibold text-gray-900 mt-5">
            {t("auth.registerTitle")}
          </h1>
        </div>

        <div className="card">
          <form
            onSubmit={handleSubmit((d) => registerMutation.mutate(d))}
            className="space-y-4"
            noValidate
          >
            <Field label={t("auth.name")} htmlFor="name" error={errors.name?.message} required>
              <Input id="name" autoComplete="name" {...register("name")} />
            </Field>
            <Field label={t("auth.email")} htmlFor="email" error={errors.email?.message} required>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
            </Field>
            <Field label={t("auth.password")} htmlFor="password" error={errors.password?.message} hint={t("auth.passwordHint")} required>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            </Field>
            <Field label={t("auth.phone")} htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
            </Field>
            <Field label={t("auth.role")} htmlFor="role" error={errors.role?.message} required>
              <Select id="role" {...register("role")}>
                <option value={UserRole.PATIENT}>{t("roles.PATIENT")}</option>
                <option value={UserRole.ASHA}>{t("roles.ASHA")}</option>
                <option value={UserRole.DOCTOR}>{t("roles.DOCTOR")}</option>
              </Select>
            </Field>
            <Field label={t("auth.language")} htmlFor="language">
              <Select id="language" {...register("language")}>
                <option value={Language.EN}>English</option>
                <option value={Language.HI}>हिन्दी</option>
                <option value={Language.KN}>ಕನ್ನಡ</option>
              </Select>
            </Field>
            <Button type="submit" fullWidth loading={registerMutation.isPending}>
              {t("auth.registerButton")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t("auth.hasAccount")}{" "}
              <Link to="/login" className="text-primary-600 font-medium hover:underline">
                {t("auth.loginLink")}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}