import { Bell } from "lucide-react";
import { DropdownMenu } from "../ui/DropdownMenu";

// There's no backend notification system (no model/route/events) yet, so
// this is an honest empty state rather than fabricated notification data —
// it replaces a bell icon that previously did nothing at all when clicked.
export function NotificationsMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-control border border-border p-2 text-steel-500 hover:bg-steel-100 hover:text-ink"
        >
          <Bell size={18} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <div className="px-2.5 py-3 text-center text-sm text-ink-secondary">No notifications yet</div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
