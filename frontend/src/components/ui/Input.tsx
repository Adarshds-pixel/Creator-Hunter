import { useId, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`rounded-control border-[0.5px] bg-surface px-3 py-2 text-sm text-ink placeholder:text-steel-500 disabled:cursor-not-allowed disabled:bg-steel-100 ${
          error ? "border-caution" : "border-border"
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-caution">
          {error}
        </p>
      )}
    </div>
  );
}
