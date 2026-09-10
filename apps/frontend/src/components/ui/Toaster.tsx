import { useTranslation } from "react-i18next";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useToastStore, ToastVariant } from "@/stores/toastStore";

function variantIcon(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-accent-600" />;
    case "error":
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    default:
      return <Info className="w-5 h-5 text-primary-600" />;
  }
}

const variantBg: Record<ToastVariant, string> = {
  success: "border-accent-200 bg-accent-50",
  error: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  info: "border-primary-200 bg-primary-50",
};

export function Toaster() {
  const { t } = useTranslation();
  const { toasts, dismiss } = useToastStore();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto border rounded-lg p-3 shadow-sm flex items-start gap-3 ${variantBg[toast.variant]}`}
          role="alert"
        >
          {variantIcon(toast.variant)}
          <p className="text-sm text-gray-800 flex-1">{toast.message}</p>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            aria-label={t("common.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}