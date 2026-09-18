import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { BrandMark } from "@/components/brand/BrandMark";

export default function Navbar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const homePath = user ? `/${user.role.toLowerCase()}/dashboard` : "/login";

  return (
    <nav className="bg-cream-50/80 backdrop-blur-sm border-b border-rose-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-2 min-h-16 py-2">
          <Link to="/" className="flex items-center space-x-2.5 min-w-0">
            <BrandMark className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
            <span className="flex flex-col leading-tight min-w-0">
              <span className="font-display text-base sm:text-xl font-semibold text-gray-900 whitespace-nowrap">
                {t("app.name")}
              </span>
              <span className="hidden md:block text-[11px] font-medium text-primary-600/90 tracking-wide">
                {t("app.tagline")}
              </span>
            </span>
          </Link>
          <div className="flex items-center space-x-2 sm:space-x-3 ml-auto shrink-0">
            <LanguageSwitcher />
            {isAuthenticated && user ? (
              <>
                <Link
                  to={homePath}
                  className="text-gray-600 hover:text-primary-700 font-medium text-sm"
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
                  className="text-gray-600 hover:text-primary-700 font-medium text-sm"
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
