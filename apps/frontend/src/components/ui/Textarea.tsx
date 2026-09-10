import { forwardRef, TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...rest }, ref) {
  return <textarea ref={ref} className={`input-field min-h-[96px] ${className}`} {...rest} />;
});