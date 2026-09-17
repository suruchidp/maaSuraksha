import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-cream-50/60 border-t border-rose-100/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-sm text-amber-700 font-medium">
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