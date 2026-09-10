import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden />
      </div>
      <h3 className="mt-3 font-medium text-gray-900">{t("common.errorOccurred")}</h3>
      {message && <p className="mt-1 text-sm text-gray-500 max-w-sm">{message}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}