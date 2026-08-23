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

interface NameFilter {
  $or: [{ name: { $regex: string; $options: string } }, { username: { $regex: string; $options: string } }];
}

// Escapes regex metacharacters so the query is treated as a literal
// substring, not a user-controlled regex pattern.
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  // Gemini only extracts campaign-brief criteria (category/location/reach/
  // engagement) — it has no way to represent "a creator named X". Without a
  // literal name/username match too, typing a creator's name here (the one
  // thing this search box's placeholder promises) returns nothing when
  // Gemini can't map it to a filter, and a freshly imported creator becomes
  // unfindable by name entirely.
  const trimmed = query.trim();
  const nameFilter: NameFilter | null = trimmed
    ? {
        $or: [
          { name: { $regex: escapeRegex(trimmed), $options: "i" } },
          { username: { $regex: escapeRegex(trimmed), $options: "i" } },
        ],
      }
    : null;

  const structuredKeys = Object.keys(mongoFilter);
  // Never fall through to an unfiltered `{}` query — that used to mean
  // "every creator in the database" (up to the 200 cap) whenever Gemini
  // couldn't extract a structured filter, which is exactly what made
  // unmappable queries (most often a plain name) return a flood of
  // unrelated results instead of the specific creator being searched for.
  const effectiveFilter =
    structuredKeys.length > 0 && nameFilter
      ? { $or: [mongoFilter, nameFilter] }
      : structuredKeys.length > 0
        ? mongoFilter
        : nameFilter ?? {};

  const creators = await Creator.find(effectiveFilter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(200)
    .lean<ICreatorAttrs[]>();

  const rankingContext: CampaignLike = { ...filters, ...(campaign || {}) };

  const ranked: RankedCreator[] = creators
    .map((creator) => {
      const { matchScore, breakdown } = calculateMatchScore(creator, rankingContext);
      return { ...creator, matchScore, matchBreakdown: breakdown };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return { filters, results: ranked };
}
