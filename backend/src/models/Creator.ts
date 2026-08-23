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
  title?: string;
  tags: string[];
  verified: boolean;
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

  // Unset (not defaulted) for live imports — see services/providers/youtube.ts.
  // A one-shot snapshot can't measure real growth, and there's no
  // fraud-detection signal available to compute authenticity/audience
  // quality from a public API lookup.
  growthRate?: number;
  estimatedCost: number;

  authenticityScore?: number;
  audienceQualityScore?: number;

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
    title: { type: String },
    tags: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
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

    // No `default: 0` here deliberately — 0 is a legitimate real growthRate
    // (seed range is -2 to 15) and authenticity/audienceQuality never
    // legitimately hit 0 either, so an explicit absence needs to stay a
    // genuine absence for ranking.ts's "no signal -> neutral" checks to
    // trust `!= null`, rather than colliding with a real measured value.
    growthRate: { type: Number },
    estimatedCost: { type: Number, default: 0 },

    authenticityScore: { type: Number },
    audienceQualityScore: { type: Number },

    source: { type: String, default: "DATASET" },
    sourceId: { type: String },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

creatorSchema.index({ category: 1 });
creatorSchema.index({ country: 1 });
creatorSchema.index({ city: 1 });
creatorSchema.index({ platform: 1 });
creatorSchema.index({ followers: 1 });
creatorSchema.index({ engagementRate: 1 });
creatorSchema.index({ category: 1, country: 1, platform: 1, followers: 1 });

export default mongoose.model<ICreator>("Creator", creatorSchema);
