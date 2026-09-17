import { ReactNode } from "react";
import { Sprout } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
  compact = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`${
        compact ? "py-6" : "py-10"
      } px-4 flex flex-col items-center justify-center text-center`}
    >
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-50 to-lavender-50 border border-primary-100 flex items-center justify-center shadow-sm">
        {icon ?? <Sprout className="w-6 h-6 text-primary-400" aria-hidden />}
      </div>
      <h3 className="mt-3 font-medium text-gray-800">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 max-w-sm text-balance">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}