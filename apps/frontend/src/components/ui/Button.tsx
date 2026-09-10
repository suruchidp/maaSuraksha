import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline:
    "bg-transparent border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
  ghost:
    "bg-transparent text-gray-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500",
  danger:
    "bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", loading, fullWidth, className = "", children, disabled, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
          variant === "primary" || variant === "secondary" || variant === "danger"
            ? variantClass[variant]
            : variantClass[variant]
        } ${sizeClass[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...rest}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);