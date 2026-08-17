import type { ComponentType, ReactNode } from "react";
import { IconTile, type IconTileColor } from "./IconTile";

interface StatCardProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  color: IconTileColor;
  value: ReactNode;
  label: string;
  /** Positive delta text, e.g. "+32 this week" — rendered in success green. */
  delta?: string;
  /** Muted state note shown when there's no delta yet, e.g. "No campaigns running".
   *  A bare value with neither delta nor note is a design smell — always pass one. */
  note?: string;
}

export function StatCard({ icon, color, value, label, delta, note }: StatCardProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <IconTile icon={icon} color={color} />
      <p className="mt-3 font-data text-3xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-sm text-ink-secondary">{label}</p>
      {delta ? (
        <p className="mt-2 text-xs font-medium text-success">↗ {delta}</p>
      ) : note ? (
        <p className="mt-2 text-xs text-ink-secondary">• {note}</p>
      ) : null}
    </div>
  );
}
