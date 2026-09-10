import { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p role="alert" className="text-red-500 text-xs mt-1">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-gray-400 text-xs mt-1">{hint}</p>
      )}
    </div>
  );
}