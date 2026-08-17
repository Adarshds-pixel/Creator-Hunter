export const OUTREACH_CHANNELS = ["INSTAGRAM", "EMAIL", "WHATSAPP", "LINKEDIN"] as const;
export type OutreachChannelType = (typeof OUTREACH_CHANNELS)[number];

export const OUTREACH_STATUSES = [
  "DRAFT",
  "CONTACTED",
  "REPLIED",
  "INTERESTED",
  "NEGOTIATING",
  "REJECTED",
  "NO_RESPONSE",
] as const;
export type OutreachStatusType = (typeof OUTREACH_STATUSES)[number];

export interface Outreach {
  _id: string;
  campaignId: string;
  creatorId: string;
  channel: OutreachChannelType;
  message: string;
  status: OutreachStatusType;
  sentAt?: string;
  repliedAt?: string;
  createdAt?: string;
}
