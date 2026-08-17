import type { ReactElement, SVGProps } from "react";

// lucide-react ships no brand/logo icons (checked: not exported by this
// version) — and the spec explicitly wants mono glyphs here anyway, not
// full-color brand logos ("colour logos fight the card"). Hand-drawn to
// match the same line-icon tone as components/layout/icons.tsx.
const shared: SVGProps<SVGSVGElement> = {
  width: 14,
  height: 14,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...shared} {...props}>
      <rect x="3" y="3" width="14" height="14" rx="4" />
      <circle cx="10" cy="10" r="3.5" />
      <circle cx="14.2" cy="5.8" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeGlyphIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...shared} {...props}>
      <rect x="2.5" y="5" width="15" height="10" rx="3" />
      <path d="M8.5 8v4l4-2-4-2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedinGlyphIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...shared} {...props}>
      <rect x="3" y="3" width="14" height="14" rx="3" />
      <circle cx="7" cy="7.2" r="0.9" fill="currentColor" stroke="none" />
      <path d="M7 9.5v6" />
      <path d="M11 9.5v6" />
      <path d="M11 12c0-1.2 1-2 2-2s2 .8 2 2v3.5" />
    </svg>
  );
}

export const PLATFORM_ICON: Record<string, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  Instagram: InstagramIcon,
  YouTube: YoutubeGlyphIcon,
  LinkedIn: LinkedinGlyphIcon,
};
