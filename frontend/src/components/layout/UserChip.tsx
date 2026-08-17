import { useState } from "react";
import { ChevronDown, Sun, Moon } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { DropdownMenu } from "../ui/DropdownMenu";
import { getTheme, toggleTheme } from "../../lib/theme";

// No auth flow exists in this app — the demo user is the only account, so
// this is real (not placeholder) data, just not user-switchable yet. The
// chip still opens a real menu (theme shortcut) rather than being a dead
// click target with a misleading hover/chevron affordance.
export function UserChip() {
  const [theme, setThemeState] = useState(getTheme);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-control px-2 py-2 text-left hover:bg-steel-100"
        >
          <Avatar name="Demo User" size={32} />
          <div className="hidden min-w-0 flex-1 xl:block">
            <p className="truncate text-sm font-medium text-ink">Demo User</p>
            <p className="truncate text-xs text-ink-secondary">demo@creatorhunter.app</p>
          </div>
          <ChevronDown size={14} className="hidden shrink-0 text-steel-500 xl:block" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start" side="top">
        <div className="px-2.5 py-1.5">
          <p className="text-sm font-medium text-ink">Demo User</p>
          <p className="text-xs text-ink-secondary">demo@creatorhunter.app</p>
        </div>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          onSelect={() => setThemeState(toggleTheme())}
          className="inline-flex w-full items-center gap-2"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
