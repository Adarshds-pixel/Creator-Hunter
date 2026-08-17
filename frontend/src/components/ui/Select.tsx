import { useId, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function Select({ label, id, className = "", children, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={selectId}
        className={`rounded-control border-[0.5px] border-border bg-surface px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:bg-steel-100 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
