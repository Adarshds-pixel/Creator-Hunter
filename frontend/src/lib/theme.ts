export type Theme = "light" | "dark";

const STORAGE_KEY = "creator-hunter-theme";

// index.html sets the initial attribute before React mounts (avoids a
// flash of the wrong theme) — this reads that same source of truth back.
export function getTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
