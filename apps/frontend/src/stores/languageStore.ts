import { create } from "zustand";
import { Language } from "@maasuraksha/shared";
import i18n from "@/i18n";

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()((set) => ({
  language:
    (localStorage.getItem("i18n_lng") as Language) || Language.EN,
  setLanguage: (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem("i18n_lng", language);
    set({ language });
  },
}));
