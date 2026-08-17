import type { Creator } from "./creator";

export const CAMPAIGN_CREATOR_STATUSES = [
  "DISCOVERED",
  "SHORTLISTED",
  "CONTACTED",
  "REPLIED",
  "NEGOTIATING",
  "APPROVED",
  "CONTENT_SUBMITTED",
  "COMPLETED",
  "REJECTED",
] as const;

export type CampaignCreatorStatus = (typeof CAMPAIGN_CREATOR_STATUSES)[number];

export interface CampaignCreator {
  _id: string;
  campaignId: string;
  creatorId: string;
  matchScore: number;
  status: CampaignCreatorStatus;
  notes?: string;
  creator?: Creator | null;
}
