export interface CreatorLike {
  category?: string;
  platform?: string;
  country?: string;
  city?: string;
  followers?: number;
  engagementRate?: number;
  estimatedCost?: number;
  audienceMale?: number;
  audienceFemale?: number;
  audienceIndia?: number;
  audienceUSA?: number;
  audienceUAE?: number;
  audienceUK?: number;
  audienceOther?: number;
  age18_24?: number;
  age25_34?: number;
  age35_44?: number;
  age45Plus?: number;
  authenticityScore?: number;
  audienceQualityScore?: number;
  growthRate?: number;
}

export interface CreatorScoreBreakdown {
  engagement: number;
  authenticity: number;
  audienceQuality: number;
  growth: number;
}

export interface CampaignLike {
  targetCategory?: string;
  platform?: string;
  targetCountry?: string;
  targetCity?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minEngagement?: number;
  budget?: number;
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetGender?: string;
}

export interface MatchBreakdown {
  audience: number;
  engagement: number;
  contentRelevance: number;
  location: number;
  follower: number;
  price: number;
}

export interface MatchResult {
  matchScore: number;
  breakdown: MatchBreakdown;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function engagementScore(creator: CreatorLike, campaign?: CampaignLike): number {
  const rate = creator.engagementRate || 0;
  const min = campaign?.minEngagement ?? 0;

  if (min <= 0) return clamp(rate * 15);
  if (rate < min) return clamp((rate / min) * 60);
  return clamp(60 + (rate - min) * 10);
}

// Live imports carry none of these fields (see services/providers/youtube.ts)
// — without this check, a campaign targeting any country/age/gender would
// score such a creator a hard 0 on audience fit purely because the data
// doesn't exist, not because the audience is actually a bad fit. No signal
// should read as "unknown" (neutral), the same as the factors === 0 case
// below already does when the campaign itself asks for nothing.
function hasAudienceData(creator: CreatorLike): boolean {
  return [
    creator.audienceMale,
    creator.audienceFemale,
    creator.age18_24,
    creator.age25_34,
    creator.age35_44,
    creator.age45Plus,
    creator.audienceIndia,
    creator.audienceUSA,
    creator.audienceUAE,
    creator.audienceUK,
    creator.audienceOther,
  ].some((v) => v != null && v > 0);
}

export function audienceScore(creator: CreatorLike, campaign?: CampaignLike): number {
  if (!hasAudienceData(creator)) return 50;

  let score = 0;
  let factors = 0;

  const countryField: Record<string, number | undefined> = {
    India: creator.audienceIndia,
    USA: creator.audienceUSA,
    UAE: creator.audienceUAE,
    UK: creator.audienceUK,
  };

  if (campaign?.targetCountry) {
    const pct = countryField[campaign.targetCountry];
    score += clamp(pct ?? creator.audienceOther ?? 0);
    factors += 1;
  }

  if (campaign?.targetAgeMin != null && campaign?.targetAgeMax != null) {
    const buckets = [
      { min: 18, max: 24, pct: creator.age18_24 },
      { min: 25, max: 34, pct: creator.age25_34 },
      { min: 35, max: 44, pct: creator.age35_44 },
      { min: 45, max: 200, pct: creator.age45Plus },
    ];
    const overlap = buckets
      .filter((b) => b.max >= campaign.targetAgeMin! && b.min <= campaign.targetAgeMax!)
      .reduce((sum, b) => sum + (b.pct || 0), 0);
    score += clamp(overlap);
    factors += 1;
  }

  if (campaign?.targetGender) {
    const genderPct =
      campaign.targetGender === "MALE"
        ? creator.audienceMale
        : campaign.targetGender === "FEMALE"
          ? creator.audienceFemale
          : undefined;
    if (genderPct != null) {
      score += clamp(genderPct);
      factors += 1;
    }
  }

  return factors === 0 ? 50 : clamp(score / factors);
}

export function locationScore(creator: CreatorLike, campaign?: CampaignLike): number {
  if (!campaign?.targetCountry && !campaign?.targetCity) return 50;

  let score = 0;
  if (campaign.targetCountry && creator.country === campaign.targetCountry) score += 60;
  if (campaign.targetCity && creator.city === campaign.targetCity) score += 40;

  return clamp(score || 20);
}

export function followerScore(creator: CreatorLike, campaign?: CampaignLike): number {
  const followers = creator.followers || 0;
  const min = campaign?.minFollowers;
  const max = campaign?.maxFollowers;

  if (min == null && max == null) return 50;
  if (min != null && followers < min) return clamp((followers / min) * 60);
  if (max != null && followers > max) return clamp(100 - ((followers - max) / max) * 40);

  return 100;
}

export function priceScore(creator: CreatorLike, campaign?: CampaignLike): number {
  const cost = creator.estimatedCost || 0;
  const budget = campaign?.budget;

  if (!budget) return 50;
  if (cost === 0) return 50;
  if (cost > budget) return clamp(60 - ((cost - budget) / budget) * 60);

  return clamp(70 + (1 - cost / budget) * 30);
}

export function contentRelevanceScore(creator: CreatorLike, campaign?: CampaignLike): number {
  let score = 0;
  let factors = 0;

  if (campaign?.targetCategory) {
    score += creator.category === campaign.targetCategory ? 100 : 30;
    factors += 1;
  }

  if (campaign?.platform) {
    score += creator.platform === campaign.platform ? 100 : 40;
    factors += 1;
  }

  return factors === 0 ? 50 : clamp(score / factors);
}

const WEIGHTS = {
  audience: 0.3,
  engagement: 0.2,
  contentRelevance: 0.2,
  location: 0.1,
  follower: 0.1,
  price: 0.1,
};

export function calculateMatchScore(creator: CreatorLike, campaign?: CampaignLike): MatchResult {
  const breakdown: MatchBreakdown = {
    audience: audienceScore(creator, campaign),
    engagement: engagementScore(creator, campaign),
    contentRelevance: contentRelevanceScore(creator, campaign),
    location: locationScore(creator, campaign),
    follower: followerScore(creator, campaign),
    price: priceScore(creator, campaign),
  };

  const matchScore =
    breakdown.audience * WEIGHTS.audience +
    breakdown.engagement * WEIGHTS.engagement +
    breakdown.contentRelevance * WEIGHTS.contentRelevance +
    breakdown.location * WEIGHTS.location +
    breakdown.follower * WEIGHTS.follower +
    breakdown.price * WEIGHTS.price;

  return {
    matchScore: Math.round(matchScore * 10) / 10,
    breakdown,
  };
}

export interface CreatorScoreResult {
  creatorScore: number;
  breakdown: CreatorScoreBreakdown;
}

const CREATOR_SCORE_WEIGHTS = {
  engagement: 0.3,
  authenticity: 0.3,
  audienceQuality: 0.25,
  growth: 0.15,
};

// Campaign-independent — how good is this creator on their own merits,
// with no brief to score against. Always available (no campaign needed),
// unlike calculateMatchScore. Reuses engagementScore(creator) with no
// campaign arg, which already degrades gracefully to a reach-independent
// curve (clamp(rate * 15)) when there's no minEngagement to compare to.
export function calculateCreatorScore(creator: CreatorLike): CreatorScoreResult {
  // Seed data's growthRate lands roughly in [-2, 15]; map that onto 0-100
  // rather than assuming growth is always positive. 0 is a legitimate real
  // value in that range, so — unlike authenticity/audienceQuality just
  // below, where the raw score itself can safely `?? 50` — growth needs an
  // explicit presence check: a live import has no growthRate at all (a
  // single snapshot can't measure it), and that absence must land on
  // neutral, not get treated as "measured 0% growth".
  const growth = creator.growthRate != null ? clamp((creator.growthRate + 2) * (100 / 17)) : 50;

  const breakdown: CreatorScoreBreakdown = {
    engagement: engagementScore(creator),
    // `?? 50` here is exactly the missing-data case, not just a style
    // choice: live imports genuinely have no authenticity/audience-quality
    // signal (no fraud-detection data from a public API), so this reads as
    // undefined and correctly falls back to neutral rather than a
    // measured-looking number.
    authenticity: clamp(creator.authenticityScore ?? 50),
    audienceQuality: clamp(creator.audienceQualityScore ?? 50),
    growth,
  };

  const creatorScore =
    breakdown.engagement * CREATOR_SCORE_WEIGHTS.engagement +
    breakdown.authenticity * CREATOR_SCORE_WEIGHTS.authenticity +
    breakdown.audienceQuality * CREATOR_SCORE_WEIGHTS.audienceQuality +
    breakdown.growth * CREATOR_SCORE_WEIGHTS.growth;

  return {
    creatorScore: Math.round(creatorScore * 10) / 10,
    breakdown,
  };
}
