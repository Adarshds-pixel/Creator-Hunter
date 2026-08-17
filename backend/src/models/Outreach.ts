import mongoose, { Schema, type Document, type Types } from "mongoose";

const CHANNELS = ["INSTAGRAM", "EMAIL", "WHATSAPP", "LINKEDIN"] as const;
export type OutreachChannel = (typeof CHANNELS)[number];

const STATUSES = [
  "DRAFT",
  "CONTACTED",
  "REPLIED",
  "INTERESTED",
  "NEGOTIATING",
  "REJECTED",
  "NO_RESPONSE",
] as const;
export type OutreachStatus = (typeof STATUSES)[number];

export interface IOutreach extends Document {
  campaignId: Types.ObjectId;
  creatorId: Types.ObjectId;

  channel: OutreachChannel;

  message: string;

  status: OutreachStatus;

  sentAt?: Date;
  repliedAt?: Date;
}

const outreachSchema = new Schema<IOutreach>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: "Creator", required: true },

    channel: { type: String, enum: CHANNELS, required: true },

    message: { type: String, required: true },

    status: { type: String, enum: STATUSES, default: "DRAFT" },

    sentAt: { type: Date },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

outreachSchema.index({ campaignId: 1 });
outreachSchema.index({ campaignId: 1, creatorId: 1 });

export const OUTREACH_CHANNELS = CHANNELS;
export const OUTREACH_STATUSES = STATUSES;
export default mongoose.model<IOutreach>("Outreach", outreachSchema);
