import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { BrandMark } from "@/components/brand/BrandMark";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-cream-50/60 border-t border-rose-100/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <BrandMark className="w-9 h-9 shrink-0" />
              <span className="flex flex-col leading-tight text-left">
                <span className="font-display text-base font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                  {t("app.name")}
                </span>
                <span className="text-[11px] font-medium text-primary-600/80">
                  {t("app.tagline")}
                </span>
              </span>
            </Link>
            <p className="text-sm text-amber-700 font-medium mt-2">
              {t("footer.disclaimer")}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              &copy; {new Date().getFullYear()} {t("footer.copyright")}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}