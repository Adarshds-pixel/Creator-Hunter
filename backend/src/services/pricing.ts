export interface CostInputs {
  followers: number;
  engagementRate: number;
  platform: string;
  category: string;
}

// Single source of truth for estimatedCost, shared by the seed generator and
// the live YouTube import — both need to land on the same scale, or campaign
// price-fit scoring (ranking.ts's priceScore) and side-by-side comparisons
// break down for whichever source drifts.
//
// Realistic influencer-rate floor, correlated with both followers (sqrt
// curve compresses the spread with real rank order preserved, and gives
// larger channels a lower marginal cost per follower — a real dynamic in
// influencer pricing, not a bug) and engagement (higher engagement pushes
// the rate up, not just reach).
//
// The ceiling exists only to guard against pathological inputs (a corrupt
// follower count), not to model a real price cap — it's set well above what
// the sqrt curve produces even for the largest real channels this app is
// likely to import (a 300M-subscriber channel lands around ₹31L, nowhere
// near it). Seeded creators top out at 5M followers and never approach it
// either. It was previously ₹5L, which *seeded* data (max 5M followers)
// happened to stay just under — but real YouTube imports can be an order of
// magnitude bigger, and every one of those was clamped to the exact same
// ₹5L, making differently-sized mega-creators show an identical estimated
// cost (and, as a direct side effect, an inverted cost-per-1K: whichever
// had more followers "cost less" purely because both were clipped to the
// same numerator).
export function estimateCreatorCost({ followers, engagementRate, platform, category }: CostInputs): number {
  const followerComponent = 15_000 + Math.sqrt(followers) * 153.4;
  const engagementMultiplier = 0.8 + engagementRate * 0.05;

  return Math.round(
    Math.max(
      15_000,
      Math.min(
        5_000_000,
        followerComponent *
          engagementMultiplier *
          (platform === "YouTube" ? 1.3 : 1) *
          (category === "Finance" || category === "Technology" ? 1.2 : 1)
      )
    )
  );
}
