import mongoose from "mongoose";
import Creator from "../models/Creator.js";
import CampaignCreator from "../models/CampaignCreator.js";
import Shortlist from "../models/Shortlist.js";
import Outreach from "../models/Outreach.js";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");
  await Promise.all([
    Creator.syncIndexes(),
    CampaignCreator.syncIndexes(),
    Shortlist.syncIndexes(),
    Outreach.syncIndexes(),
  ]);
  console.log("Indexes synced");
}
