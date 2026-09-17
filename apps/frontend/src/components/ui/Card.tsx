import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  /** Soft colored surface for highlighted content */
  tone?: "white" | "blush" | "peach" | "lavender" | "sage";
}

const toneClass: Record<NonNullable<CardProps["tone"]>, string> = {
  white: "bg-white border-rose-100/70",
  blush: "bg-primary-50/70 border-primary-100",
  peach: "bg-peach-50/80 border-peach-100",
  lavender: "bg-lavender-50/70 border-lavender-100",
  sage: "bg-accent-50/70 border-accent-100",
};

export function Card({
  children,
  title,
  action,
  tone = "white",
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-2xl shadow-card border p-6 ${toneClass[tone]} ${className}`}
      {...rest}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h3 className="section-title">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}