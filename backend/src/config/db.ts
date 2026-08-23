import dns from "dns";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Creator from "../models/Creator.js";
import CampaignCreator from "../models/CampaignCreator.js";
import Shortlist from "../models/Shortlist.js";
import Outreach from "../models/Outreach.js";
import { seedDatabase } from "../seed.js";

// Ensure Node.js can resolve MongoDB SRV records on Windows networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Fallback to default system DNS
}

let mongod: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/creator-hunter";

  try {
    // Attempt connecting to the configured URI with a 10-second timeout for cloud Atlas
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`Connected to MongoDB Atlas: ${uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")}`);
  } catch (err) {
    console.warn(
      `Could not connect to external MongoDB: ${(err as Error).message}. Initializing in-memory Mongo server for seamless local development...`
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
    console.log("Empty database detected on Atlas. Auto-seeding initial creators and demo accounts...");
    await seedDatabase(500);
  }
}
