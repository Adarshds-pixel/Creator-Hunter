import mongoose, { Schema, type Document, type Types } from "mongoose";

// Plain data shape — matches what .lean() returns (no Document methods).
export interface ICreatorAttrs {
  _id: Types.ObjectId;
  name: string;
  username: string;
  platform: string;
  profileUrl?: string;
  profileImage?: string;
  bio?: string;

  category: string;
  location?: string;
  country?: string;
  city?: string;
  languages: string[];

  followers: number;
  following: number;
  posts: number;

  avgLikes: number;
  avgComments: number;
  avgViews: number;
  engagementRate: number;

  audienceMale: number;
  audienceFemale: number;

  age18_24: number;
  age25_34: number;
  age35_44: number;
  age45Plus: number;

  audienceIndia: number;
  audienceUSA: number;
  audienceUAE: number;
  audienceUK: number;
  audienceOther: number;

  growthRate: number;
  estimatedCost: number;

  authenticityScore: number;
  audienceQualityScore: number;

  source: string;
  sourceId?: string;
  lastSyncedAt?: Date;
}

// Document shape — used when working with live Mongoose documents (not .lean()).
export interface ICreator extends Document, Omit<ICreatorAttrs, "_id"> {}

const creatorSchema = new Schema<ICreator>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
    platform: { type: String, required: true },
    profileUrl: { type: String },
    profileImage: { type: String },
    bio: { type: String },

    category: { type: String, required: true },
    location: { type: String },
    country: { type: String },
    city: { type: String },
    languages: [{ type: String }],

    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },

    avgLikes: { type: Number, default: 0 },
    avgComments: { type: Number, default: 0 },
    avgViews: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },

    audienceMale: { type: Number, default: 0 },
    audienceFemale: { type: Number, default: 0 },

    age18_24: { type: Number, default: 0 },
    age25_34: { type: Number, default: 0 },
    age35_44: { type: Number, default: 0 },
    age45Plus: { type: Number, default: 0 },

    audienceIndia: { type: Number, default: 0 },
    audienceUSA: { type: Number, default: 0 },
    audienceUAE: { type: Number, default: 0 },
    audienceUK: { type: Number, default: 0 },
    audienceOther: { type: Number, default: 0 },

    growthRate: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },

    authenticityScore: { type: Number, default: 0 },
    audienceQualityScore: { type: Number, default: 0 },

    source: { type: String, default: "DATASET" },
    sourceId: { type: String },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ICreator>("Creator", creatorSchema);
