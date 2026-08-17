import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { CAMPAIGN_CREATOR_STATUSES } from "../models/CampaignCreator.js";
import { OUTREACH_CHANNELS, OUTREACH_STATUSES } from "../models/Outreach.js";

export const searchQuerySchema = z.object({
  query: z.string().min(1),
  campaign: z.record(z.string(), z.any()).optional(),
});

export const creatorAnalysisSchema = z.object({
  creatorId: z.string().min(1),
  campaign: z.record(z.string(), z.any()).optional(),
});

export const outreachSchema = z.object({
  creatorId: z.string().min(1),
  campaign: z.record(z.string(), z.any()).optional(),
  channel: z.enum(["INSTAGRAM", "EMAIL", "WHATSAPP", "LINKEDIN"]),
});

// Owned by Developer 2 (Backend + Database) in the original plan; implemented here
// to unblock Member A/B/C's slices.
export const creatorCreateSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  platform: z.string().min(1),
  category: z.string().min(1),
  profileUrl: z.string().optional(),
  profileImage: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  languages: z.array(z.string()).optional(),
  followers: z.coerce.number().optional(),
  following: z.coerce.number().optional(),
  posts: z.coerce.number().optional(),
  avgLikes: z.coerce.number().optional(),
  avgComments: z.coerce.number().optional(),
  avgViews: z.coerce.number().optional(),
  engagementRate: z.coerce.number().optional(),
  audienceMale: z.coerce.number().optional(),
  audienceFemale: z.coerce.number().optional(),
  age18_24: z.coerce.number().optional(),
  age25_34: z.coerce.number().optional(),
  age35_44: z.coerce.number().optional(),
  age45Plus: z.coerce.number().optional(),
  audienceIndia: z.coerce.number().optional(),
  audienceUSA: z.coerce.number().optional(),
  audienceUAE: z.coerce.number().optional(),
  audienceUK: z.coerce.number().optional(),
  audienceOther: z.coerce.number().optional(),
  growthRate: z.coerce.number().optional(),
  estimatedCost: z.coerce.number().optional(),
  authenticityScore: z.coerce.number().optional(),
  audienceQualityScore: z.coerce.number().optional(),
  source: z.string().optional(),
  sourceId: z.string().optional(),
});

export const campaignCreateSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  product: z.string().optional(),
  description: z.string().optional(),
  budget: z.coerce.number().optional(),
  targetCountry: z.string().optional(),
  targetCity: z.string().optional(),
  targetCategory: z.string().optional(),
  minFollowers: z.coerce.number().optional(),
  maxFollowers: z.coerce.number().optional(),
  minEngagement: z.coerce.number().optional(),
  targetAgeMin: z.coerce.number().optional(),
  targetAgeMax: z.coerce.number().optional(),
  targetGender: z.string().optional(),
  platform: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.string().optional(),
  createdById: z.string().optional(),
});

export const campaignUpdateSchema = campaignCreateSchema.partial();

export const campaignCreatorAddSchema = z.object({
  creatorId: z.string().min(1),
  matchScore: z.coerce.number().optional(),
  status: z.enum(CAMPAIGN_CREATOR_STATUSES).optional(),
});

export const campaignCreatorUpdateSchema = z.object({
  status: z.enum(CAMPAIGN_CREATOR_STATUSES).optional(),
  notes: z.string().optional(),
});

export const shortlistCreateSchema = z.object({
  name: z.string().min(1),
  userId: z.string().optional(),
});

export const shortlistAddCreatorSchema = z.object({
  creatorId: z.string().min(1),
  notes: z.string().optional(),
});

export const outreachCreateSchema = z.object({
  campaignId: z.string().min(1),
  creatorId: z.string().min(1),
  channel: z.enum(OUTREACH_CHANNELS),
  message: z.string().min(1),
  status: z.enum(OUTREACH_STATUSES).optional(),
});

export const outreachUpdateSchema = z.object({
  status: z.enum(OUTREACH_STATUSES),
});

export function validateBody(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }
    req.body = result.data;
    next();
  };
}
