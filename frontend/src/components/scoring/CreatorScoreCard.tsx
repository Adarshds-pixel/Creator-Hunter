import type { CreatorScoreBreakdown } from "../../types/creator";
import { CREATOR_SCORE_FACTORS, scoreTone } from "./factors";

interface CreatorScoreCardProps {
  creatorScore: number;
  breakdown: CreatorScoreBreakdown;
  className?: string;
}

const TONE_BG: Record<ReturnType<typeof scoreTone>, string> = {
  match: "bg-match",
  neutral: "bg-steel-500",
  caution: "bg-caution",
};

// Campaign-independent counterpart to ScoreBreakdown — how good is this
// creator on their own merits, shown by default when no campaign is
// selected in the profile rail's "Score against" control.
export function CreatorScoreCard({ creatorScore, breakdown, className = "" }: CreatorScoreCardProps) {
  return (
    <div className={`rounded-card border-[0.5px] border-border bg-surface p-5 ${className}`}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-steel-500">Creator score</p>
        <p className="font-data text-4xl font-semibold tabular-nums text-ink">{creatorScore}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {CREATOR_SCORE_FACTORS.map((factor) => {
          const value = Math.round(breakdown[factor.key]);
          return (
            <div key={factor.key} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3">
              <span className="text-sm text-ink">{factor.label}</span>
              <div
                role="img"
                aria-label={`${factor.label}: ${value} out of 100, weighted ${factor.weight * 100}% of the creator score`}
                className="h-2 overflow-hidden rounded-pill bg-steel-100"
              >
                <div className={`h-full ${TONE_BG[scoreTone(value)]}`} style={{ width: `${value}%` }} />
              </div>
              <span className="text-right font-data text-sm tabular-nums text-steel-700">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
