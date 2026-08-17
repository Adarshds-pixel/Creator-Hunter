import type { ReactNode } from "react";

type Tone = "neutral" | "teal" | "match" | "caution";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

// Tone is always paired with a text label (the children) — status is never
// conveyed by color alone.
export function Badge({ children, tone = "neutral", className = "" }: BadgeProps) {
  const tones: Record<Tone, string> = {
    neutral: "bg-steel-100 text-steel-700",
    teal: "bg-teal-soft text-teal",
    match: "bg-match-soft text-match",
    caution: "bg-caution-soft text-caution",
  };

  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-0.5 font-data text-xs font-medium uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
