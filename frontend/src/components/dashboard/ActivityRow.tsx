import { Megaphone, Star, Send } from "lucide-react";
import { IconTile, type IconTileColor } from "./IconTile";
import { EmptyState } from "../ui/EmptyState";
import { formatRelativeTime } from "../../lib/format";
import type { DashboardStats } from "../../lib/apiClient";

type ActivityItem = DashboardStats["recentActivity"][number];

const TYPE_STYLE: Record<ActivityItem["type"], { icon: typeof Megaphone; color: IconTileColor }> = {
  campaign: { icon: Megaphone, color: "indigo" },
  shortlist: { icon: Star, color: "amber" },
  outreach: { icon: Send, color: "blue" },
};

// Rows connected by a 1px vertical line through the icon-tile centers —
// the line is a single absolutely-positioned span per row, not one long
// element behind the list, so it still terminates cleanly on the last row.
export function ActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Activity shows up here as you create campaigns, shortlist creators, and send outreach."
      />
    );
  }

  return (
    <ul>
      {items.map((item, i) => {
        const { icon, color } = TYPE_STYLE[item.type];
        return (
          <li key={`${item.type}-${item.entityName}-${item.createdAt}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
            {i < items.length - 1 && <span className="absolute left-5 top-10 h-full w-px bg-border" aria-hidden />}
            <IconTile icon={icon} color={color} className="relative z-10" />
            <div className="min-w-0 flex-1 pt-1.5">
              <p className="truncate text-sm text-ink">
                {item.label} — <span className="font-medium text-teal">{item.entityName}</span>
              </p>
            </div>
            <span className="shrink-0 pt-1.5 text-xs text-ink-secondary">{formatRelativeTime(item.createdAt)}</span>
          </li>
        );
      })}
    </ul>
  );
}
