import { Link } from "react-router-dom";
import { ReactNode } from "react";

export function QuickActionCard({
  to,
  icon,
  label,
  description,
  accent = "blush",
  badge,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  description?: string;
  accent?: "blush" | "peach" | "lavender" | "sage" | "cream";
  badge?: number;
}) {
  const accentClass: Record<string, string> = {
    blush: "bg-primary-100/90 text-primary-700",
    peach: "bg-peach-100/90 text-peach-700",
    lavender: "bg-lavender-100/90 text-lavender-700",
    sage: "bg-accent-100/90 text-accent-700",
    cream: "bg-cream-100/90 text-cream-700",
  };

  return (
    <Link
      to={to}
      className="group rounded-2xl bg-white border border-rose-100/70 shadow-card p-5 flex flex-col gap-3
                 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft hover:border-primary-200
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <span
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${accentClass[accent]}`}
        >
          {icon}
        </span>
        {badge !== undefined && badge > 0 && (
          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary-600 text-white text-xs font-semibold">
            {badge}
          </span>
        )}
      </div>
      <span className="font-medium text-gray-800 group-hover:text-primary-700 transition-colors">
        {label}
      </span>
      {description && (
        <span className="text-xs text-gray-500">{description}</span>
      )}
    </Link>
  );
}