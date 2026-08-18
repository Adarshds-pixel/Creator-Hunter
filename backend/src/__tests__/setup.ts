import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer | null = null;

export async function connectTestDB(): Promise<string> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Try in-memory server first for isolated, hermetic testing
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    return uri;
  } catch {
    // Fallback to local MongoDB instance
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/creator-hunter-test";
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    return uri;
  }
}

export async function disconnectTestDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
      mongod = null;
    }
  } catch (err) {
    console.error("Error tearing down test DB:", err);
  }
}
