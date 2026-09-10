import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";

export default function UnauthorizedPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const homePath = user ? `/${user.role.toLowerCase()}/dashboard` : "/login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          {t("access.unauthorizedTitle")}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          {t("access.unauthorizedMessage")}
        </p>
        <Link to={homePath}>
          <Button className="mt-6">{t("nav.dashboard")}</Button>
        </Link>
      </div>
    </div>
  );
}