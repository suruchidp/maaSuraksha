import { useTranslation } from "react-i18next";
import { useLanguageStore } from "@/stores/languageStore";
import { Language } from "@maasuraksha/shared";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { setLanguage } = useLanguageStore();

  const languages = [
    { code: Language.EN, label: "English" },
    { code: Language.HI, label: "हिन्दी" },
    { code: Language.KN, label: "ಕನ್ನಡ" },
  ];

  const currentLang = (i18n.resolvedLanguage ?? i18n.language ?? "en").split("-")[0] as Language;

  const handleChange = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          aria-pressed={currentLang === lang.code}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            currentLang === lang.code
              ? "bg-white text-primary-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
