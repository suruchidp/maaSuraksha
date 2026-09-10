import { forwardRef, SelectHTMLAttributes } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className = "", children, ...rest }, ref) {
  return (
    <select ref={ref} className={`input-field ${className}`} {...rest}>
      {children}
    </select>
  );
});