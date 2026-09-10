import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Language, User } from "@maasuraksha/shared";
import { fetchCurrentUser } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { dtoToUser } from "@/lib/mapping";

export function useAuth() {
  const { user, token, isAuthenticated, setUser, logout } = useAuthStore();
  const hasToken = Boolean(token);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const data = meQuery.data;
  useEffect(() => {
    if (data) {
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        language: data.language,
        phone: data.phone,
        assignedASHA: data.assignedASHA,
        assignedDoctor: data.assignedDoctor,
        isActive: data.isActive,
        createdAt: data.createdAt,
      });
    }
  }, [data, setUser]);

  return {
    user,
    token,
    isAuthenticated,
    isVerifying: hasToken && meQuery.isLoading,
    logout,
    currentUser: data ? (dtoToUser(data) as User) : null,
  };
}

export function useCurrentLanguage(): Language {
  const { i18n } = useTranslation();
  const lang = i18n.language?.toLowerCase();
  if (lang === Language.HI || lang === Language.KN) return lang as Language;
  return Language.EN;
}