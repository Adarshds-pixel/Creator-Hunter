import Creator, { type ICreatorAttrs } from "../models/Creator.js";
import { parseCreatorSearch, type SearchFilters } from "./ai.js";
import { calculateMatchScore, type CampaignLike, type MatchBreakdown } from "./ranking.js";

export interface RankedCreator extends ICreatorAttrs {
  matchScore: number;
  matchBreakdown: MatchBreakdown;
}

export interface SearchResult {
  filters: SearchFilters;
  results: RankedCreator[];
}

interface MongoCreatorFilter {
  category?: string;
  country?: string;
  city?: string;
  platform?: string;
  followers?: { $gte?: number; $lte?: number };
  engagementRate?: { $gte: number };
}

// Member A — Search & Discovery
// Natural language query -> AI filters -> MongoDB query -> ranked results.
export async function searchCreators(
  query: string,
  campaign: CampaignLike | null = null
): Promise<SearchResult> {
  const filters = await parseCreatorSearch(query);

  const mongoFilter: MongoCreatorFilter = {};
  if (filters.category) mongoFilter.category = filters.category;
  if (filters.country) mongoFilter.country = filters.country;
  if (filters.city) mongoFilter.city = filters.city;
  if (filters.platform) mongoFilter.platform = filters.platform;
  if (filters.minFollowers || filters.maxFollowers) {
    mongoFilter.followers = {};
    if (filters.minFollowers) mongoFilter.followers.$gte = filters.minFollowers;
    if (filters.maxFollowers) mongoFilter.followers.$lte = filters.maxFollowers;
  }
  if (filters.minEngagement) {
    mongoFilter.engagementRate = { $gte: filters.minEngagement };
  }

  const creators = await Creator.find(mongoFilter).limit(200).lean<ICreatorAttrs[]>();

  const rankingContext: CampaignLike = { ...filters, ...(campaign || {}) };

  const ranked: RankedCreator[] = creators
    .map((creator) => {
      const { matchScore, breakdown } = calculateMatchScore(creator, rankingContext);
      return { ...creator, matchScore, matchBreakdown: breakdown };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return { filters, results: ranked };
}
