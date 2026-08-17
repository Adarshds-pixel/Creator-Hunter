import { useState } from "react";
import { getTheme, toggleTheme } from "../../lib/theme";
import { SunIcon, MoonIcon } from "./icons";

export function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme);

  return (
    <button
      type="button"
      onClick={() => setThemeState(toggleTheme())}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-steel-700 transition-colors hover:bg-steel-100"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      <span className="hidden xl:inline">{theme === "dark" ? "Light theme" : "Dark theme"}</span>
    </button>
  );
}
