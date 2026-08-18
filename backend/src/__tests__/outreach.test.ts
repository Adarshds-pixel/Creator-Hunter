import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../app.js";
import Creator from "../models/Creator.js";
import Campaign from "../models/Campaign.js";
import Outreach from "../models/Outreach.js";
import { connectTestDB, disconnectTestDB } from "./setup.js";

describe("Outreach and Dashboard Stats API", () => {
  let creatorId: string;
  let campaignId: string;
  let outreachId: string;

  beforeAll(async () => {
    await connectTestDB();

    const creator = await Creator.create({
      name: "Outreach Test Creator",
      username: "outreachtest99",
      platform: "Instagram",
      category: "Fitness",
      country: "India",
      city: "Mumbai",
      followers: 80000,
      engagementRate: 3.9,
      avgViews: 20000,
      authenticityScore: 88,
      estimatedCost: 25000,
      source: "TEST",
    });
    creatorId = String(creator._id);

    const campaign = await Campaign.create({
      name: "Outreach Test Campaign",
      brand: "TestBrand",
      budget: 200000,
      status: "ACTIVE",
      targetCategory: "Fitness",
    });
    campaignId = String(campaign._id);
  });

  afterAll(async () => {
    if (creatorId) await Creator.findByIdAndDelete(creatorId);
    if (campaignId) await Campaign.findByIdAndDelete(campaignId);
    if (outreachId) await Outreach.findByIdAndDelete(outreachId);
    await disconnectTestDB();
  });

  it("POST /api/outreach should create an outreach record and stamp sentAt when CONTACTED", async () => {
    const res = await request(app)
      .post("/api/outreach")
      .send({
        campaignId,
        creatorId,
        channel: "INSTAGRAM",
        message: "Hi! Loved your recent fitness content — would you be open to a collab?",
        status: "CONTACTED",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.status).toBe("CONTACTED");
    expect(res.body.sentAt).toBeTruthy();
    outreachId = res.body._id;
  });

  it("GET /api/outreach filtered by campaignId should return the created record", async () => {
    const res = await request(app).get(`/api/outreach?campaignId=${campaignId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((o: { _id: string }) => o._id === outreachId)).toBe(true);
  });

  it("PATCH /api/outreach/:id should transition status and stamp repliedAt", async () => {
    const res = await request(app)
      .patch(`/api/outreach/${outreachId}`)
      .send({ status: "REPLIED" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("REPLIED");
    expect(res.body.repliedAt).toBeTruthy();
  });

  it("PATCH /api/outreach/:id should 404 on an unknown id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).patch(`/api/outreach/${fakeId}`).send({ status: "REPLIED" });
    expect(res.status).toBe(404);
  });

  it("GET /api/stats/dashboard should return the aggregated dashboard shape", async () => {
    const res = await request(app).get("/api/stats/dashboard");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("kpis");
    expect(res.body).toHaveProperty("recentCampaigns");
    expect(res.body).toHaveProperty("outreachFunnel");
    expect(res.body).toHaveProperty("discoveryInsights");
    expect(res.body).toHaveProperty("categoryMix");
    expect(res.body).toHaveProperty("platformMix");
    expect(res.body).toHaveProperty("coverage");
    expect(typeof res.body.kpis.creatorsTotal).toBe("number");
    expect(Array.isArray(res.body.recentCampaigns)).toBe(true);
  });
});
