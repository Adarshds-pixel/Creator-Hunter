import type { ReactNode } from "react";
import type { MatchBreakdown } from "../../types/creator";
import { SCORE_FACTORS, scoreTone } from "./factors";

interface ScoreBreakdownProps {
  matchScore: number;
  breakdown: MatchBreakdown;
  explanation?: ReactNode;
  className?: string;
}

const TONE_BG: Record<ReturnType<typeof scoreTone>, string> = {
  match: "bg-match",
  neutral: "bg-steel-500",
  caution: "bg-caution",
};

// The signature element, expanded: the same six weighted factors as
// ScoreStrip, laid out full-size with labels and the arithmetic visible —
// used on the creator profile and inside "why is this creator a good fit?"
export function ScoreBreakdown({ matchScore, breakdown, explanation, className = "" }: ScoreBreakdownProps) {
  return (
    <div className={`rounded-card border-[0.5px] border-border bg-surface p-5 ${className}`}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-steel-500">Match score</p>
        <p className="font-data text-4xl font-semibold tabular-nums text-ink">{matchScore}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {SCORE_FACTORS.map((factor) => {
          const value = Math.round(breakdown[factor.key]);
          return (
            <div key={factor.key} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3">
              <span className="text-sm text-ink">{factor.label}</span>
              <div
                role="img"
                aria-label={`${factor.label}: ${value} out of 100, weighted ${factor.weight * 100}% of the match score`}
                className="h-2 overflow-hidden rounded-pill bg-steel-100"
              >
                <div
                  className={`h-full ${TONE_BG[scoreTone(value)]}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-right font-data text-sm tabular-nums text-steel-700">{value}</span>
            </div>
          );
        })}
      </div>

      {explanation && (
        <div className="mt-4 border-t-[0.5px] border-border pt-4 text-sm text-ink">{explanation}</div>
      )}
    </div>
  );
}
