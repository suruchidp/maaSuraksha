import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const homePath = user ? `/${user.role.toLowerCase()}/dashboard` : "/login";

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{t("app.name")}</span>
          </Link>
          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            {isAuthenticated && user ? (
              <>
                <Link
                  to={homePath}
                  className="text-gray-600 hover:text-primary-600 font-medium text-sm"
                >
                  {t("nav.dashboard")}
                </Link>
                <span className="text-xs text-gray-400 hidden sm:inline">
                  {user.name} · {t("roles." + user.role)}
                </span>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-600 font-medium text-sm"
                >
                  {t("nav.login")}
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}