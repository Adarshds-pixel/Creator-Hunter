import type { ComponentType } from "react";
import { cn } from "../../lib/cn";

export type IconTileColor = "teal" | "indigo" | "blue" | "amber" | "magenta" | "success" | "danger";

const COLOR_CLASSES: Record<IconTileColor, string> = {
  teal: "bg-teal-soft text-teal",
  indigo: "bg-indigo-soft text-indigo",
  blue: "bg-blue-soft text-blue",
  amber: "bg-amber-soft text-amber",
  magenta: "bg-magenta-soft text-magenta",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
};

interface IconTileProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  color: IconTileColor;
  className?: string;
}

// The single element that does most of the visual work across KPI cards,
// activity rows, and stat blocks — one component, reused everywhere.
export function IconTile({ icon: Icon, color, className = "" }: IconTileProps) {
  return (
    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", COLOR_CLASSES[color], className)}>
      <Icon size={20} />
    </div>
  );
}
