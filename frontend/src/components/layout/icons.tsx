import type { SVGProps } from "react";

// Minimal geometric line icons, hand-drawn for the rail — no icon-library
// dependency for four glyphs. 20x20, 1.5 stroke, matches the instrument
// tone (no fills, no color, inherits currentColor).
const shared: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function DashboardIcon() {
  return (
    <svg {...shared}>
      <rect x="3" y="3" width="6" height="8" rx="1" />
      <rect x="11" y="3" width="6" height="5" rx="1" />
      <rect x="11" y="10" width="6" height="7" rx="1" />
      <rect x="3" y="13" width="6" height="4" rx="1" />
    </svg>
  );
}

export function DiscoverIcon() {
  return (
    <svg {...shared}>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M16.5 16.5 12.8 12.8" />
    </svg>
  );
}

export function CampaignsIcon() {
  return (
    <svg {...shared}>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3.5" />
      <circle cx="10" cy="10" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function ShortlistsIcon() {
  return (
    <svg {...shared}>
      <path d="M5 3h10v14l-5-3.2L5 17V3Z" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg {...shared}>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.4 4.6l-1.4 1.4M6 12.6l-1.4 1.4M15.4 15.4l-1.4-1.4M6 7.4 4.6 6" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg {...shared}>
      <path d="M16 11.5A6.5 6.5 0 0 1 8.5 4 6.5 6.5 0 1 0 16 11.5Z" />
    </svg>
  );
}
