import { forwardRef, InputHTMLAttributes } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...rest }, ref) {
  return <input ref={ref} className={`input-field ${className}`} {...rest} />;
});