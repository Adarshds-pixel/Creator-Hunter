import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Sun, Moon, LogOut, LogIn } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { DropdownMenu } from "../ui/DropdownMenu";
import { getTheme, toggleTheme } from "../../lib/theme";
import { useAuth } from "../../context/AuthContext";

export function UserChip() {
  const [theme, setThemeState] = useState(getTheme);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.name || "Admin User";
  const displayEmail = user?.email || "admin@creatorhunter.app";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-control px-2 py-2 text-left hover:bg-steel-100"
        >
          <Avatar name={displayName} size={32} />
          <div className="hidden min-w-0 flex-1 xl:block">
            <p className="truncate text-sm font-medium text-ink">{displayName}</p>
            <p className="truncate text-xs text-ink-secondary">{displayEmail}</p>
          </div>
          <ChevronDown size={14} className="hidden shrink-0 text-steel-500 xl:block" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start" side="top">
        <div className="px-2.5 py-1.5">
          <p className="text-sm font-medium text-ink">{displayName}</p>
          <p className="text-xs text-ink-secondary">{displayEmail}</p>
          {user?.role && (
            <span className="mt-1 inline-block rounded bg-teal-soft px-1.5 py-0.5 text-[10px] font-semibold text-teal uppercase">
              {user.role}
            </span>
          )}
        </div>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          onSelect={() => setThemeState(toggleTheme())}
          className="inline-flex w-full items-center gap-2"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        {user ? (
          <DropdownMenu.Item
            onSelect={handleLogout}
            className="inline-flex w-full items-center gap-2 text-risk hover:text-risk"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </DropdownMenu.Item>
        ) : (
          <DropdownMenu.Item
            onSelect={() => navigate("/login")}
            className="inline-flex w-full items-center gap-2 text-teal hover:text-teal"
          >
            <LogIn size={14} />
            <span>Sign in</span>
          </DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
