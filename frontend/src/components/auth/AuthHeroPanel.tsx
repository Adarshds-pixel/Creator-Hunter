import { useEffect, useState, type ReactNode } from "react";
import { AuthBrandMark } from "./AuthBrandMark";
import { CreatorPreviewCard } from "./CreatorPreviewCard";
import { useCoverageStat } from "../../lib/useCoverageStat";
import { fetchCreators } from "../../lib/apiClient";
import type { Creator } from "../../types/creator";

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="login-orb login-orb--1" />
      <div className="login-orb login-orb--2" />
      <div className="login-orb login-orb--3" />
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] px-4 py-2">
      <span className="text-sm font-semibold text-white">{value}</span>
      <span className="text-xs text-white/60">{label}</span>
    </div>
  );
}

const badgeIconShared = {
  width: 14,
  height: 14,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const TRUST_BADGES = [
  {
    label: "AI-Powered Matching",
    icon: (
      <svg {...badgeIconShared}>
        <path d="M10 2.5l1.7 4.2 4.3 1.3-4.3 1.3L10 13.5l-1.7-4.2-4.3-1.3 4.3-1.3L10 2.5z" />
        <path d="M16 14l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z" />
      </svg>
    ),
  },
  {
    label: "Real-time Analytics",
    icon: (
      <svg {...badgeIconShared}>
        <path d="M3 16V4M3 16h14" />
        <path d="M6 13l3-4 2.5 2.5L16 6" />
      </svg>
    ),
  },
  {
    label: "Verified Creators",
    icon: (
      <svg {...badgeIconShared}>
        <path d="M10 2.5l6 2.5v4.4c0 3.8-2.5 6.7-6 7.6-3.5-.9-6-3.8-6-7.6V5l6-2.5z" />
        <path d="M7.2 10l1.9 1.9 3.7-3.7" />
      </svg>
    ),
  },
  {
    label: "Secure & Reliable",
    icon: (
      <svg {...badgeIconShared}>
        <rect x="4.5" y="8.5" width="11" height="8" rx="1.5" />
        <path d="M6.5 8.5V6a3.5 3.5 0 017 0v2.5" />
      </svg>
    ),
  },
];

interface AuthHeroPanelProps {
  eyebrow: string;
  headline: ReactNode;
  subcopy: string;
  bottomContent: ReactNode;
  showTrustBadges?: boolean;
}

// Shared left-side dark marketing panel for Login/Register — was ~90 lines
// of duplicated markup in each page. Stat pills and preview cards pull real
// data from the same public endpoints the rest of the app already uses
// (useCoverageStat, fetchCreators), so the numbers stay accurate as the
// dataset grows instead of drifting from a hardcoded "500+".
export function AuthHeroPanel({ eyebrow, headline, subcopy, bottomContent, showTrustBadges }: AuthHeroPanelProps) {
  const [mounted, setMounted] = useState(false);
  const coverage = useCoverageStat();
  const [previewCreators, setPreviewCreators] = useState<Creator[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetchCreators({ minFollowers: 100_000 }, 1, 6)
      .then((res) => setPreviewCreators(res.creators.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div
      className={`
        login-hero relative hidden lg:flex lg:w-[52%] flex-col justify-between overflow-hidden
        px-10 py-9 xl:px-14 xl:py-11
        transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}
      `}
    >
      <FloatingOrbs />

      <div className="relative z-10">
        <AuthBrandMark size="lg" />
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        <div className="max-w-lg">
          <div
            className={`
              mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] px-3 py-1
              transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
            `}
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-teal" aria-hidden>
              <path d="M10 2.5l1.7 4.2 4.3 1.3-4.3 1.3L10 13.5l-1.7-4.2-4.3-1.3 4.3-1.3L10 2.5z" />
            </svg>
            <span className="text-[11px] font-medium uppercase tracking-wide text-white/80">{eyebrow}</span>
          </div>

          <h1
            className={`
              text-[2.25rem] xl:text-[2.75rem] font-bold leading-[1.1] tracking-tight text-white
              transition-all duration-700 delay-200 ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
            `}
          >
            {headline}
          </h1>
          <p
            className={`
              mt-4 text-base text-white/65 leading-relaxed max-w-sm
              transition-all duration-700 delay-300 ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
            `}
          >
            {subcopy}
          </p>

          <div
            className={`
              mt-6 flex flex-wrap gap-3
              transition-all duration-700 delay-500 ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
            `}
          >
            {coverage && (
              <>
                <StatPill value={coverage.creators.toLocaleString()} label="Creators" />
                <StatPill value={String(coverage.cities)} label="Cities" />
                <StatPill value={String(coverage.categories)} label="Categories" />
              </>
            )}
          </div>
        </div>

        {previewCreators.length === 3 && (
          <div
            className={`
              mb-5 hidden xl:flex gap-5
              transition-all duration-700 delay-[600ms] ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
            `}
          >
            <CreatorPreviewCard creator={previewCreators[0]} className="login-float-card" />
            <CreatorPreviewCard creator={previewCreators[1]} className="mt-6 login-float-card" />
            <CreatorPreviewCard creator={previewCreators[2]} className="mt-2 login-float-card" />
          </div>
        )}
      </div>

      <div
        className={`
          relative z-10 max-w-md
          transition-all duration-700 delay-[700ms] ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
        `}
      >
        {bottomContent}

        {showTrustBadges && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {TRUST_BADGES.map((badge) => (
              <div key={badge.label} className="flex items-center gap-1.5 text-white/60">
                {badge.icon}
                <span className="text-xs">{badge.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
