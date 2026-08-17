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

function fallbackParseSearch(query: string): SearchFilters {
  // Naive keyword fallback used when GEMINI_API_KEY is not configured.
  const filters: SearchFilters = {};
  const lower = query.toLowerCase();

  if (lower.includes("india")) filters.country = "India";
  if (lower.includes("fitness")) filters.category = "Fitness";
  if (lower.includes("gaming")) filters.category = "Gaming";

  const followerMatch = lower.match(/(\d+)(k)?\s*(?:to|-)\s*(\d+)(k)?\s*followers/);
  if (followerMatch) {
    const toCount = (numStr: string, kFlag: string | undefined) =>
      Number(numStr) * (kFlag ? 1000 : 1);
    filters.minFollowers = toCount(followerMatch[1], followerMatch[2]);
    filters.maxFollowers = toCount(followerMatch[3], followerMatch[4]);
  }

  const engagementMatch = lower.match(/engagement\s*above\s*(\d+(?:\.\d+)?)%?/);
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
