import type { Creator } from "../../types/creator";
import { formatFollowers, formatPercent } from "../../lib/format";

interface CreatorPreviewCardProps {
  creator: Creator;
  className?: string;
  floatClass?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

// Real seeded creator data rendered as a floating glass card — no photos,
// just an initials avatar, so the hero panel stays visually rich without
// fabricating (or needing) any image assets.
export function CreatorPreviewCard({ creator, className = "", floatClass = "" }: CreatorPreviewCardProps) {
  return (
    <div
      className={`w-48 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] p-3 shadow-lg shadow-black/20 ${floatClass} ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
          {initials(creator.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white/90">{creator.category}</p>
          <p className="truncate text-xs text-white/50">{creator.city ?? creator.location ?? creator.country}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M10 2a4 4 0 100 8 4 4 0 000-8zM2 17a8 8 0 1116 0H2z" />
          </svg>
          {formatFollowers(creator.followers)}
        </span>
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M3 12l3.5-5 3 4 4-6 3.5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {formatPercent(creator.engagementRate)}
        </span>
      </div>
    </div>
  );
}
