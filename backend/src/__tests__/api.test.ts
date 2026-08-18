import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../app.js";
import Creator from "../models/Creator.js";
import Campaign from "../models/Campaign.js";
import Shortlist from "../models/Shortlist.js";
import User from "../models/User.js";
import { connectTestDB, disconnectTestDB } from "./setup.js";

describe("Core Creator Hunter API Test Suite", () => {
  let createdCreatorId: string;
  let createdCampaignId: string;
  let createdShortlistId: string;
  let testUserId: string;

  beforeAll(async () => {
    await connectTestDB();

    const user = await User.findOneAndUpdate(
      { email: "demo@creatorhunter.app" },
      {
        name: "Demo User",
        email: "demo@creatorhunter.app",
        passwordHash: "hash123",
        role: "OWNER",
      },
      { upsert: true, returnDocument: "after" }
    );
    testUserId = String(user._id);

    const creator = await Creator.create({
      name: "Test Fitness Creator",
      username: "testfitness99",
      platform: "Instagram",
      category: "Fitness",
      country: "India",
      city: "Bangalore",
      languages: ["English", "Hindi"],
      followers: 120000,
      engagementRate: 4.8,
      avgViews: 45000,
      avgLikes: 5700,
      avgComments: 180,
      authenticityScore: 92,
      estimatedCost: 35000,
      source: "TEST",
    });
    createdCreatorId = String(creator._id);
  });

  afterAll(async () => {
    if (createdCreatorId) {
      await Creator.findByIdAndDelete(createdCreatorId);
    }
    if (createdCampaignId) {
      await Campaign.findByIdAndDelete(createdCampaignId);
    }
    if (createdShortlistId) {
      await Shortlist.findByIdAndDelete(createdShortlistId);
    }
    await disconnectTestDB();
  });

  it("GET /api/health should return ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/creators should return list of creators with total count", async () => {
    const res = await request(app).get("/api/creators?category=Fitness");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("creators");
    expect(res.body).toHaveProperty("total");
    expect(Array.isArray(res.body.creators)).toBe(true);
  });

  it("GET /api/creators/:id should return single creator", async () => {
    const res = await request(app).get(`/api/creators/${createdCreatorId}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(createdCreatorId);
    expect(res.body.name).toBe("Test Fitness Creator");
  });

  it("GET /api/creators/:id should 404 on unknown id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/creators/${fakeId}`);
    expect(res.status).toBe(404);
  });

  it("POST /api/search/creators should search with natural query and rank results", async () => {
    const res = await request(app)
      .post("/api/search/creators")
      .send({ query: "Find Indian fitness creators with >50K followers" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("filters");
    expect(res.body).toHaveProperty("results");
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it("POST /api/campaigns should create a new campaign", async () => {
    const res = await request(app)
      .post("/api/campaigns")
      .send({
        name: "Summer Fitness Launch",
        brand: "FitPro India",
        budget: 500000,
        status: "ACTIVE",
        category: "Fitness",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.name).toBe("Summer Fitness Launch");
    createdCampaignId = res.body._id;
  });

  it("POST /api/campaigns/:id/creators should add creator to campaign pipeline", async () => {
    const res = await request(app)
      .post(`/api/campaigns/${createdCampaignId}/creators`)
      .send({
        creatorId: createdCreatorId,
        matchScore: 95,
        status: "DISCOVERED",
      });

    expect(res.status).toBe(201);
    expect(res.body.creatorId).toBe(createdCreatorId);
    expect(res.body.status).toBe("DISCOVERED");
  });

  it("PATCH /api/campaigns/:id/creators/:creatorId should advance pipeline status", async () => {
    const res = await request(app)
      .patch(`/api/campaigns/${createdCampaignId}/creators/${createdCreatorId}`)
      .send({
        status: "SHORTLISTED",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("SHORTLISTED");
  });

  it("POST /api/shortlists should create a new shortlist", async () => {
    const res = await request(app)
      .post("/api/shortlists")
      .send({
        name: "Top Fitness Candidates",
        userId: testUserId,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Top Fitness Candidates");
    createdShortlistId = res.body._id;
  });

  it("POST /api/shortlists/:id/creators should add creator to shortlist", async () => {
    const res = await request(app)
      .post(`/api/shortlists/${createdShortlistId}/creators`)
      .send({
        creatorId: createdCreatorId,
        notes: "High engagement Indian audience",
      });

    expect(res.status).toBe(200);
    expect(res.body.creators.some((c: { creatorId: string }) => c.creatorId === createdCreatorId)).toBe(true);
  });

  it("DELETE /api/shortlists/:id/creators/:creatorId should remove creator from shortlist", async () => {
    const res = await request(app)
      .delete(`/api/shortlists/${createdShortlistId}/creators/${createdCreatorId}`);

    expect(res.status).toBe(200);
  });

  it("POST /api/ai/outreach should generate an outreach message", async () => {
    const res = await request(app)
      .post("/api/ai/outreach")
      .send({
        creatorId: createdCreatorId,
        channel: "INSTAGRAM",
        campaign: {
          name: "FitPro Launch",
          brand: "FitPro",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(typeof res.body.message).toBe("string");
  });
});
