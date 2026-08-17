import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICampaign extends Document {
  name: string;
  brand?: string;
  product?: string;
  description?: string;

  budget?: number;

  targetCountry?: string;
  targetCity?: string;
  targetCategory?: string;

  minFollowers?: number;
  maxFollowers?: number;
  minEngagement?: number;

  targetAgeMin?: number;
  targetAgeMax?: number;
  targetGender?: string;

  platform?: string;

  startDate?: Date;
  endDate?: Date;

  status: string;

  createdById?: Types.ObjectId;
}

const campaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true },
    brand: { type: String },
    product: { type: String },
    description: { type: String },

    budget: { type: Number },

    targetCountry: { type: String },
    targetCity: { type: String },
    targetCategory: { type: String },

    minFollowers: { type: Number },
    maxFollowers: { type: Number },
    minEngagement: { type: Number },

    targetAgeMin: { type: Number },
    targetAgeMax: { type: Number },
    targetGender: { type: String },

    platform: { type: String },

    startDate: { type: Date },
    endDate: { type: Date },

    status: { type: String, default: "DRAFT" },

    createdById: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<ICampaign>("Campaign", campaignSchema);
