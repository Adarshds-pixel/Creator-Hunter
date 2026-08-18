import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Creator from "../models/Creator.js";
import CampaignCreator from "../models/CampaignCreator.js";
import Shortlist from "../models/Shortlist.js";
import Outreach from "../models/Outreach.js";
import { seedDatabase } from "../seed.js";

let mongod: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/creator-hunter";

  try {
    // Attempt connecting to the configured URI with a 2-second timeout
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`Connected to MongoDB: ${uri}`);
  } catch (err) {
    console.warn(
      `Could not connect to MongoDB at ${uri}: ${(err as Error).message}. Initializing in-memory Mongo server for seamless local development (data will NOT persist to your real database)...`
    );
    mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    await mongoose.connect(memUri);
    console.log(`Connected to In-Memory MongoDB: ${memUri}`);
  }

  await Promise.all([
    Creator.syncIndexes(),
    CampaignCreator.syncIndexes(),
    Shortlist.syncIndexes(),
    Outreach.syncIndexes(),
  ]);
  console.log("Database indexes synced.");

  const creatorCount = await Creator.countDocuments();
  if (creatorCount === 0) {
    console.log("Empty database detected. Auto-seeding initial creators and demo accounts...");
    await seedDatabase(500);
  }
}
