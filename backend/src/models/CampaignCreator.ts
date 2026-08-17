import mongoose, { Schema, type Document, type Types } from "mongoose";

const STATUSES = [
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
export type CampaignCreatorStatus = (typeof STATUSES)[number];

export interface ICampaignCreator extends Document {
  campaignId: Types.ObjectId;
  creatorId: Types.ObjectId;

  matchScore: number;

  status: CampaignCreatorStatus;

  notes?: string;
}

const campaignCreatorSchema = new Schema<ICampaignCreator>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: "Creator", required: true },

    matchScore: { type: Number, default: 0 },

    status: { type: String, enum: STATUSES, default: "DISCOVERED" },

    notes: { type: String },
  },
  { timestamps: true }
);

campaignCreatorSchema.index({ campaignId: 1, creatorId: 1 }, { unique: true });

export const CAMPAIGN_CREATOR_STATUSES = STATUSES;
export default mongoose.model<ICampaignCreator>("CampaignCreator", campaignCreatorSchema);
