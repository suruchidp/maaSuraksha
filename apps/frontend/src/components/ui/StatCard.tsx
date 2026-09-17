import { ReactNode } from "react";

export function StatCard({
  icon,
  label,
  value,
  hint,
  color = "primary",
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  color?: "primary" | "green" | "amber" | "red" | "blue" | "peach" | "blush";
}) {
  const colorClass: Record<string, string> = {
    primary: "bg-primary-100/80 text-primary-700",
    blush: "bg-primary-100/80 text-primary-700",
    green: "bg-accent-100/80 text-accent-700",
    amber: "bg-amber-100/80 text-amber-700",
    red: "bg-red-100/80 text-red-700",
    blue: "bg-blue-100/80 text-blue-700",
    peach: "bg-peach-100/80 text-peach-700",
  };
  return (
    <div className="rounded-2xl bg-white border border-rose-100/70 shadow-card p-5 flex items-start gap-4">
      {icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClass[color]}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-xl font-bold text-gray-900 truncate">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  );
}