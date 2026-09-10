import { forwardRef, InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  registration?: object;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, className = "", registration, ...rest }, ref) {
    return (
      <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className="w-4 h-4 accent-primary-600 text-primary-600 rounded"
          {...registration}
          {...rest}
        />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
    );
  }
);