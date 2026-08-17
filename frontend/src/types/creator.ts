export interface MatchBreakdown {
  audience: number;
  engagement: number;
  contentRelevance: number;
  location: number;
  follower: number;
  price: number;
}

// Campaign-independent — mirrors backend/src/services/ranking.ts's
// CreatorScoreBreakdown exactly.
export interface CreatorScoreBreakdown {
  engagement: number;
  authenticity: number;
  audienceQuality: number;
  growth: number;
}

export interface Creator {
  _id: string;
  name: string;
  username: string;
  platform: string;
  profileUrl?: string;
  profileImage?: string;
  bio?: string;

  category: string;
  title?: string;
  tags: string[];
  verified: boolean;
  location?: string;
  country?: string;
  city?: string;
  languages?: string[];

  followers: number;
  following?: number;
  posts?: number;

  avgLikes?: number;
  avgComments?: number;
  avgViews: number;
  engagementRate: number;

  audienceMale?: number;
  audienceFemale?: number;

  age18_24?: number;
  age25_34?: number;
  age35_44?: number;
  age45Plus?: number;

  audienceIndia?: number;
  audienceUSA?: number;
  audienceUAE?: number;
  audienceUK?: number;
  audienceOther?: number;

  growthRate?: number;
  estimatedCost: number;

  authenticityScore: number;
  audienceQualityScore?: number;

  matchScore?: number;
  matchBreakdown?: MatchBreakdown;

  creatorScore?: number;
  creatorScoreBreakdown?: CreatorScoreBreakdown;
}

export interface CreatorAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}
