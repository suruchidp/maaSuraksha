import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-gray-500" role="status">
      <Loader2 className="w-5 h-5 animate-spin text-primary-500" aria-hidden />
      <span className="text-sm">{label ?? t("common.loading")}</span>
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return <Spinner label={label} />;
}