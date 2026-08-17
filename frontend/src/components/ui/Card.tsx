import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-card border-[0.5px] border-border bg-surface px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}
