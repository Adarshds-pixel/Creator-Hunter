import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border-[0.5px] border-dashed border-border px-6 py-12 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-steel-500">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
