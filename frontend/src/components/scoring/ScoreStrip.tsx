import type { MatchBreakdown } from "../../types/creator";
import { SCORE_FACTORS, scoreTone } from "./factors";

interface ScoreStripProps {
  matchScore: number;
  breakdown: MatchBreakdown;
  /** "labeled" (default) shows the factor name + value under each segment,
   *  matching the card-level treatment. "compact" is bar-only for tight
   *  table rows where there's no room for six labels. */
  variant?: "labeled" | "compact";
  className?: string;
}

const TONE_BG: Record<ReturnType<typeof scoreTone>, string> = {
  match: "bg-match",
  neutral: "bg-steel-500",
  caution: "bg-caution",
};

// The signature element, collapsed: one segmented bar per creator.
// Segment width = the factor's real weight in the ranking algorithm;
// segment color = how well that factor scored. Scannable across a list of
// 127 rows without opening a single profile.
export function ScoreStrip({ matchScore, breakdown, variant = "labeled", className = "" }: ScoreStripProps) {
  const summary = SCORE_FACTORS.map((f) => `${f.label} ${Math.round(breakdown[f.key])}`).join(", ");

  const bar = (
    <div
      role="img"
      aria-label={`Match score ${matchScore}. Breakdown: ${summary}.`}
      className={`flex h-2 overflow-hidden rounded-pill bg-steel-100 ${variant === "compact" ? "w-24" : "w-full"}`}
    >
      {SCORE_FACTORS.map((factor) => (
        <div
          key={factor.key}
          className={TONE_BG[scoreTone(breakdown[factor.key])]}
          style={{ width: `${factor.weight * 100}%` }}
        />
      ))}
    </div>
  );

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {bar}
        <span className="font-data text-sm font-medium tabular-nums text-ink">{matchScore}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {bar}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-data text-xs text-steel-500">
        {SCORE_FACTORS.map((factor) => (
          <span key={factor.key}>
            {factor.shortLabel} <span className="tabular-nums text-ink">{Math.round(breakdown[factor.key])}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
