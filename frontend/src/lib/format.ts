// One number-formatting source of truth — every metric in the app should
// go through these instead of ad hoc .toLocaleString() calls, so a 127-row
// results table and a profile page render numbers identically.

export function formatFollowers(value: number): string {
  if (value >= 1_000_000) return `${trimDecimal(value / 1_000_000)}M`;
  if (value >= 1_000) return `${trimDecimal(value / 1_000)}K`;
  return String(Math.round(value));
}

// Indian numbering: lakh (1,00,000) and crore (1,00,00,000), matching how
// the product's own budgets are already written (₹10,00,000 in the demo
// campaign, ₹5-20 lakh audience) — not US-style M/B suffixes.
export function formatINR(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `${sign}₹${trimDecimal(abs / 1_00_00_000)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${trimDecimal(abs / 1_00_000)}L`;
  if (abs >= 1_000) return `${sign}₹${trimDecimal(abs / 1_000)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

export function formatPercent(value: number, { signed = false }: { signed?: boolean } = {}): string {
  const rounded = Math.round(value * 10) / 10;
  const sign = signed && rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1)}%`;
}

function trimDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

// For ActivityRow timestamps and anywhere else a relative "how long ago"
// reads better than an absolute date.
export function formatRelativeTime(date: string | Date): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const diffMin = Math.round((Date.now() - then.getTime()) / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return `${Math.round(diffDay / 30)}mo ago`;
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
