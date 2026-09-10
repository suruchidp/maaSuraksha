import { ReactNode } from "react";

export type BadgeColor =
  | "gray"
  | "primary"
  | "green"
  | "amber"
  | "red"
  | "blue";

const colorClass: Record<BadgeColor, string> = {
  gray: "bg-gray-100 text-gray-700",
  primary: "bg-primary-100 text-primary-800",
  green: "bg-accent-100 text-accent-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
};

export function Badge({
  color = "gray",
  children,
  className = "",
}: {
  color?: BadgeColor;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass[color]} ${className}`}
    >
      {children}
    </span>
  );
}