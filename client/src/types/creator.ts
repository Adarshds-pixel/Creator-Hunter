export interface MatchBreakdown {
  audience: number;
  engagement: number;
  contentRelevance: number;
  location: number;
  follower: number;
  price: number;
}

export interface Creator {
  _id: string;
  name: string;
  username: string;
  platform: string;
  category: string;
  country?: string;
  city?: string;
  followers: number;
  engagementRate: number;
  avgViews: number;
  estimatedCost: number;
  authenticityScore: number;
  matchScore?: number;
  matchBreakdown?: MatchBreakdown;
}

export interface CreatorAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}
