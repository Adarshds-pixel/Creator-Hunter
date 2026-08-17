import type { CreatorScoreBreakdown, MatchBreakdown } from "../../types/creator";

// Mirrors the weights in backend/src/services/ranking.ts exactly — this is
// the one place the marketing-facing label and the real algorithm weight
// live together, so ScoreStrip and ScoreBreakdown can never drift from
// what the server actually computed.
export const SCORE_FACTORS: {
  key: keyof MatchBreakdown;
  label: string;
  shortLabel: string;
  weight: number;
}[] = [
  { key: "audience", label: "Audience Fit", shortLabel: "Audience", weight: 0.3 },
  { key: "engagement", label: "Engagement", shortLabel: "Engagement", weight: 0.2 },
  { key: "contentRelevance", label: "Content Relevance", shortLabel: "Relevance", weight: 0.2 },
  { key: "location", label: "Location Fit", shortLabel: "Location", weight: 0.1 },
  { key: "follower", label: "Follower Fit", shortLabel: "Reach", weight: 0.1 },
  { key: "price", label: "Price Fit", shortLabel: "Price", weight: 0.1 },
];

// Score value -> performance tier color. Width says how much a factor
// counts; color says how well it did — two independent signals in one bar.
export function scoreTone(score: number): "match" | "neutral" | "caution" {
  if (score >= 70) return "match";
  if (score >= 40) return "neutral";
  return "caution";
}

// Campaign-independent — mirrors backend/src/services/ranking.ts's
// calculateCreatorScore weights exactly.
export const CREATOR_SCORE_FACTORS: {
  key: keyof CreatorScoreBreakdown;
  label: string;
  weight: number;
}[] = [
  { key: "engagement", label: "Engagement", weight: 0.3 },
  { key: "authenticity", label: "Authenticity", weight: 0.3 },
  { key: "audienceQuality", label: "Audience Quality", weight: 0.25 },
  { key: "growth", label: "Growth", weight: 0.15 },
];
