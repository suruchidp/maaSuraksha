import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { BrandMark } from "@/components/brand/BrandMark";

type LoginForm = { email: string; password: string };

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(schemas.login),
  });

  useEffect(() => {
    document.title = `${t("auth.loginTitle")} - ${t("app.name")}`;
  }, [t, i18n.language]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: LoginForm) => login(email, password),
    retry: false,
    onSuccess: async (data) => {
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
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith("/") ? from : `/${data.user.role.toLowerCase()}/dashboard`, { replace: true });
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
            <BrandMark className="w-14 h-14 sm:w-16 sm:h-16" />
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
            {t("auth.loginTitle")}
          </h1>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4" noValidate>
            <Field label={t("auth.email")} htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
            </Field>
            <Field label={t("auth.password")} htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            </Field>
            {loginMutation.isError && <p role="alert" className="text-sm text-red-700">{getApiErrorMessage(loginMutation.error)}</p>}
            <Button type="submit" fullWidth loading={loginMutation.isPending}>
              {t("auth.loginButton")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-primary-600 font-medium hover:underline">
                {t("auth.registerLink")}
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
