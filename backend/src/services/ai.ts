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
  followers?: number;
  engagementRate?: number;
  estimatedCost?: number;
  location?: string;
  authenticityScore?: number;
  audienceIndia?: number;
}

interface CampaignForAI {
  name?: string;
  budget?: number;
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const MODEL = "gemini-3.6-flash";

// Gemini's free tier returns transient 503 "high demand" errors fairly
// often. Retry a couple of times with backoff before giving up — this
// alone resolves most of them silently. Callers still need a fallback for
// when the outage outlasts the retries.
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 800): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}

// Member A — Search & Discovery
// Natural language query -> structured creator search filters.
export async function parseCreatorSearch(query: string): Promise<SearchFilters> {
  const ai = getClient();
  if (!ai) return fallbackParseSearch(query);

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL,
        contents: `Extract creator search filters from this campaign brief: "${query}"

Only include a field if the brief actually specifies it — omit fields you're not confident about rather than guessing.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              // enum constrains the model to the exact casing the database uses —
              // without it the model returns lowercase/paraphrased values
              // ("fitness" instead of "Fitness") that never match a Mongo query.
              category: { type: Type.STRING, enum: Object.keys(CATEGORY_KEYWORDS) },
              country: { type: Type.STRING, enum: Object.keys(COUNTRY_KEYWORDS) },
              city: { type: Type.STRING },
              platform: { type: Type.STRING, enum: Object.keys(PLATFORM_KEYWORDS) },
              minFollowers: { type: Type.NUMBER },
              maxFollowers: { type: Type.NUMBER },
              minEngagement: {
                type: Type.NUMBER,
                description:
                  'Engagement rate as a plain percentage number, matching how the brief states it — "above 4%" means 4, not 0.04.',
              },
            },
          },
        },
      })
    );

    return JSON.parse(response.text ?? "{}") as SearchFilters;
  } catch (err) {
    // Retries exhausted (e.g. sustained 503 from Gemini) — degrade to the
    // keyword parser instead of failing the search outright.
    console.error("parseCreatorSearch: Gemini unavailable, using fallback parser", err);
    return fallbackParseSearch(query);
  }
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
  if (!ai) return fallbackCreatorAnalysis(creator, campaign, matchBreakdown);

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL,
        contents: `You are a creator-marketing analyst writing a fit assessment for a brand's campaign manager, who will read this before deciding whether to contact the creator. Be specific and cite real numbers from the data below — never write generic filler like "strong engagement" without the actual percentage, or "good audience fit" without the actual audience split. Ground every claim in the creator, campaign, or match-score data provided; do not invent facts.

Creator data: ${JSON.stringify(creator)}
Campaign brief: ${JSON.stringify(campaign)}
Match score breakdown (0-100 per factor, already weighted into the overall score): ${JSON.stringify(matchBreakdown)}

Write:
- summary: 3-4 sentences. Open with the single strongest reason this creator suits (or doesn't suit) the campaign, then back it with specific figures (follower count, engagement rate, audience composition, estimated cost vs. budget). Write like a colleague briefing another colleague, not marketing copy.
- strengths: 3-4 bullets, each one specific claim with its supporting number, not an adjective.
- weaknesses: 2-3 bullets, same standard — specific risk or gap, with the number that shows it. If the data is genuinely strong across the board, name the weakest of the six factors rather than inventing a flaw.
- recommendation: one sentence — a clear verdict (e.g. "Strong fit, prioritize outreach" / "Fit is conditional on X" / "Not recommended for this brief") with its one-line reason.`,
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
      })
    );

    return JSON.parse(response.text ?? "{}") as CreatorAnalysis;
  } catch (err) {
    console.error("generateCreatorAnalysis: Gemini unavailable, using fallback analysis", err);
    return fallbackCreatorAnalysis(creator, campaign, matchBreakdown);
  }
}

// No-key/quota-failure safety net. Still cites real numbers from the
// creator/campaign/breakdown data instead of generic phrases — this is what
// ships when GEMINI_API_KEY is unset or the call fails, so it needs to hold
// up on its own, not just say "consider alternatives."
function fallbackCreatorAnalysis(
  creator: CreatorForAI,
  campaign: CampaignForAI | undefined,
  matchBreakdown: MatchBreakdown
): CreatorAnalysis {
  const b = matchBreakdown ?? ({} as MatchBreakdown);
  const followers = creator.followers ?? 0;
  const engagement = creator.engagementRate ?? 0;
  const cost = creator.estimatedCost;
  const budget = campaign?.budget;

  const factors: { label: string; value: number; note: string }[] = [
    { label: "audience fit", value: b.audience ?? 50, note: `${Math.round(b.audience ?? 50)}/100` },
    {
      label: "engagement",
      value: b.engagement ?? 50,
      note: `${engagement}% engagement rate (${Math.round(b.engagement ?? 50)}/100)`,
    },
    {
      label: "content relevance",
      value: b.contentRelevance ?? 50,
      note: `${Math.round(b.contentRelevance ?? 50)}/100 for this brief's category and platform`,
    },
    { label: "location fit", value: b.location ?? 50, note: `${Math.round(b.location ?? 50)}/100` },
    {
      label: "follower fit",
      value: b.follower ?? 50,
      note: `${followers.toLocaleString()} followers (${Math.round(b.follower ?? 50)}/100)`,
    },
    {
      label: "price fit",
      value: b.price ?? 50,
      note:
        cost != null
          ? `est. cost ₹${cost.toLocaleString()}${budget ? ` against a ₹${budget.toLocaleString()} budget` : ""} (${Math.round(b.price ?? 50)}/100)`
          : `${Math.round(b.price ?? 50)}/100`,
    },
  ];

  const ranked = [...factors].sort((a, z) => z.value - a.value);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  const strengths = ranked
    .filter((f) => f.value >= 65)
    .slice(0, 4)
    .map((f) => `Strong ${f.label} — ${f.note}`);
  const weaknesses = ranked
    .filter((f) => f.value < 65)
    .slice(-3)
    .reverse()
    .map((f) => `Weaker ${f.label} — ${f.note}`);

  const overall = Object.values(b).length
    ? Object.values(b).reduce((sum, v) => sum + (v ?? 0), 0) / Object.values(b).length
    : 50;

  const summary = [
    `${creator.name} is a ${creator.category} creator on ${creator.platform}${creator.location ? `, based in ${creator.location}` : ""}, with ${followers.toLocaleString()} followers and a ${engagement}% engagement rate.`,
    `The strongest signal for this campaign is ${best.label} (${best.note}), while ${worst.label} is the weakest factor (${worst.note}).`,
    cost != null && budget
      ? `At an estimated ₹${cost.toLocaleString()} against a ₹${budget.toLocaleString()} campaign budget, cost is ${cost <= budget ? "within range" : "above budget and worth negotiating"}.`
      : `Authenticity score is ${creator.authenticityScore ?? "not available"}, which factors into the overall confidence in this read.`,
  ].join(" ");

  return {
    summary,
    strengths: strengths.length ? strengths : [`Solid all-round fit — every factor scores at or above 50/100`],
    weaknesses: weaknesses.length ? weaknesses : [`No significant weak factor — ${worst.label} is the softest at ${worst.note}`],
    recommendation:
      overall >= 75
        ? `Strong fit — prioritize outreach. Overall match ${Math.round(overall)}/100.`
        : overall >= 55
          ? `Conditional fit — worth shortlisting, but weigh ${worst.label} before committing budget. Overall match ${Math.round(overall)}/100.`
          : `Not recommended for this brief — ${worst.label} and related gaps outweigh the strengths. Overall match ${Math.round(overall)}/100.`,
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

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
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
      })
    );

    return JSON.parse(response.text ?? "{}") as OutreachResult;
  } catch (err) {
    console.error("generateOutreach: Gemini unavailable, using fallback message", err);
    return fallbackOutreach(creator, campaign);
  }
}

function fallbackOutreach(creator: CreatorForAI, campaign: CampaignForAI | undefined): OutreachResult {
  return {
    message: `Hi ${creator.name}, we've been following your ${creator.category} content and think you'd be a great fit for our "${campaign?.name ?? "upcoming"}" campaign. Would you be open to a quick chat about a collaboration?`,
  };
}
