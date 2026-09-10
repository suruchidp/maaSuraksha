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
  color?: "primary" | "green" | "amber" | "red" | "blue";
}) {
  const colorClass: Record<string, string> = {
    primary: "bg-primary-50 text-primary-700",
    green: "bg-accent-50 text-accent-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <div className="card flex items-start gap-4">
      {icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass[color]}`}>
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