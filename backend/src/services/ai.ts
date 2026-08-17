import { GoogleGenAI, Type } from "@google/genai";
import type { MatchBreakdown } from "./ranking.js";

export interface SearchFilters {
  category?: string;
  country?: string;
  city?: string;
  platform?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minEngagement?: number;
}

export interface CreatorAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export interface OutreachResult {
  message: string;
}

interface CreatorForAI {
  name: string;
  category: string;
  platform: string;
}

interface CampaignForAI {
  name?: string;
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const MODEL = "gemini-2.5-flash";

// Member A — Search & Discovery
// Natural language query -> structured creator search filters.
export async function parseCreatorSearch(query: string): Promise<SearchFilters> {
  const ai = getClient();
  if (!ai) return fallbackParseSearch(query);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Extract creator search filters from this campaign brief: "${query}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          country: { type: Type.STRING },
          city: { type: Type.STRING },
          platform: { type: Type.STRING },
          minFollowers: { type: Type.NUMBER },
          maxFollowers: { type: Type.NUMBER },
          minEngagement: { type: Type.NUMBER },
        },
      },
    },
  });

  return JSON.parse(response.text ?? "{}") as SearchFilters;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Fitness: ["fitness", "gym", "workout", "health"],
  Gaming: ["gaming", "gamer", "esports", "streamer"],
  Technology: ["tech", "technology", "gadget", "software"],
  Beauty: ["beauty", "makeup", "skincare", "cosmetics"],
  Fashion: ["fashion", "style", "outfit", "clothing"],
  Finance: ["finance", "investing", "money", "stocks"],
  Food: ["food", "cooking", "recipe", "chef", "culinary"],
  Travel: ["travel", "traveling", "vacation", "backpacking"],
  Education: ["education", "study", "learning", "teacher"],
  Lifestyle: ["lifestyle", "vlog", "daily life"],
};

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  India: ["india", "indian"],
  USA: ["usa", " us ", "united states", "america", "american"],
  UK: ["uk", "united kingdom", "britain", "british"],
  UAE: ["uae", "dubai", "abu dhabi", "emirates"],
};

const CITY_COUNTRY: Record<string, string> = {
  bangalore: "India",
  mumbai: "India",
  delhi: "India",
  hyderabad: "India",
  chennai: "India",
  pune: "India",
  kolkata: "India",
  ahmedabad: "India",
  "new york": "USA",
  "los angeles": "USA",
  london: "UK",
  manchester: "UK",
  dubai: "UAE",
  "abu dhabi": "UAE",
};

const PLATFORM_KEYWORDS: Record<string, string[]> = {
  Instagram: ["instagram", "insta", " ig "],
  YouTube: ["youtube", " yt "],
  LinkedIn: ["linkedin"],
};

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

function fallbackParseSearch(query: string): SearchFilters {
  // Naive keyword + regex fallback used when GEMINI_API_KEY is not configured.
  const filters: SearchFilters = {};
  const lower = ` ${query.toLowerCase()} `;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      filters.category = category;
      break;
    }
  }

  for (const [city, country] of Object.entries(CITY_COUNTRY)) {
    if (lower.includes(city)) {
      filters.city = titleCase(city);
      filters.country = country;
      break;
    }
  }

  if (!filters.country) {
    for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
      if (keywords.some((k) => lower.includes(k))) {
        filters.country = country;
        break;
      }
    }
  }

  for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      filters.platform = platform;
      break;
    }
  }

  const toCount = (numStr: string, kFlag: string | undefined) =>
    Number(numStr) * (kFlag ? 1000 : 1);

  const betweenMatch = lower.match(/between\s*(\d+)(k)?\s*and\s*(\d+)(k)?\s*followers/);
  const rangeMatch = lower.match(/(\d+)(k)?\s*(?:to|-)\s*(\d+)(k)?\s*followers/);
  const overMatch = lower.match(/(?:over|above|more than)\s*(\d+)(k)?\s*followers/);
  const underMatch = lower.match(/(?:under|below|less than)\s*(\d+)(k)?\s*followers/);

  const rangeLike = betweenMatch || rangeMatch;
  if (rangeLike) {
    filters.minFollowers = toCount(rangeLike[1], rangeLike[2]);
    filters.maxFollowers = toCount(rangeLike[3], rangeLike[4]);
  } else if (overMatch) {
    filters.minFollowers = toCount(overMatch[1], overMatch[2]);
  } else if (underMatch) {
    filters.maxFollowers = toCount(underMatch[1], underMatch[2]);
  }

  const engagementMatch = lower.match(
    /engagement\s*(?:rate\s*)?(?:above|over|more than)\s*(\d+(?:\.\d+)?)%?/
  );
  if (engagementMatch) filters.minEngagement = Number(engagementMatch[1]);

  return filters;
}

// Member B — Creator Intelligence
// Creator + campaign context -> summary, strengths, weaknesses, recommendation.
export async function generateCreatorAnalysis(
  creator: CreatorForAI,
  campaign: CampaignForAI | undefined,
  matchBreakdown: MatchBreakdown
): Promise<CreatorAnalysis> {
  const ai = getClient();
  if (!ai) return fallbackCreatorAnalysis(creator, matchBreakdown);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Analyze this creator for the campaign and explain fit.
Creator: ${JSON.stringify(creator)}
Campaign: ${JSON.stringify(campaign)}
Match score breakdown: ${JSON.stringify(matchBreakdown)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendation: { type: Type.STRING },
        },
      },
    },
  });

  return JSON.parse(response.text ?? "{}") as CreatorAnalysis;
}

function fallbackCreatorAnalysis(
  creator: CreatorForAI,
  matchBreakdown: MatchBreakdown
): CreatorAnalysis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if ((matchBreakdown?.engagement ?? 0) >= 70) strengths.push("Strong engagement rate");
  if ((matchBreakdown?.audience ?? 0) >= 70) strengths.push("Strong audience fit");
  if ((matchBreakdown?.price ?? 0) < 40) weaknesses.push("Higher estimated pricing");
  if ((matchBreakdown?.follower ?? 0) < 40) weaknesses.push("Follower count outside target range");

  return {
    summary: `${creator.name} is a ${creator.category} creator on ${creator.platform}.`,
    strengths: strengths.length ? strengths : ["Consistent posting activity"],
    weaknesses: weaknesses.length ? weaknesses : ["Limited data available"],
    recommendation: (matchBreakdown?.audience ?? 50) >= 60 ? "Recommended" : "Consider alternatives",
  };
}

// Member C — Campaigns & Outreach
// Creator + campaign -> personalized outreach message.
export async function generateOutreach(
  creator: CreatorForAI,
  campaign: CampaignForAI | undefined,
  channel: string
): Promise<OutreachResult> {
  const ai = getClient();
  if (!ai) return fallbackOutreach(creator, campaign);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Write a short, personalized ${channel} outreach message from a brand to this creator for this campaign.
Creator: ${JSON.stringify(creator)}
Campaign: ${JSON.stringify(campaign)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING },
        },
      },
    },
  });

  return JSON.parse(response.text ?? "{}") as OutreachResult;
}

function fallbackOutreach(creator: CreatorForAI, campaign: CampaignForAI | undefined): OutreachResult {
  return {
    message: `Hi ${creator.name}, we've been following your ${creator.category} content and think you'd be a great fit for our "${campaign?.name ?? "upcoming"}" campaign. Would you be open to a quick chat about a collaboration?`,
  };
}
