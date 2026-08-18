import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  calculateMatchScore,
  engagementScore,
  audienceScore,
  locationScore,
  priceScore,
  followerScore,
} from "../services/ranking.js";
import { JWT_SECRET } from "../middleware/auth.js";
import { parseCreatorSearch, generateCreatorAnalysis, generateOutreach } from "../services/ai.js";

describe("Scoring & Ranking Engine (Developer 4 & QA)", () => {
  const sampleCreator = {
    category: "Fitness",
    platform: "Instagram",
    country: "India",
    city: "Bangalore",
    followers: 100000,
    engagementRate: 5.2,
    estimatedCost: 25000,
    audienceMale: 65,
    audienceFemale: 35,
    audienceIndia: 78,
    age18_24: 45,
    age25_34: 40,
    age35_44: 10,
    age45Plus: 5,
  };

  const sampleCampaign = {
    targetCategory: "Fitness",
    platform: "Instagram",
    targetCountry: "India",
    targetCity: "Bangalore",
    minFollowers: 50000,
    maxFollowers: 200000,
    minEngagement: 3.5,
    budget: 30000,
    targetGender: "MALE",
  };

  it("should calculate high engagement score when creator exceeds min requirement", () => {
    const score = engagementScore(sampleCreator, sampleCampaign);
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it("should score audience accurately for demographic and country match", () => {
    const score = audienceScore(sampleCreator, sampleCampaign);
    expect(score).toBeGreaterThan(60);
  });

  it("should score location accurately for city and country match", () => {
    const score = locationScore(sampleCreator, sampleCampaign);
    expect(score).toBe(100);
  });

  it("should score price appropriately against campaign budget", () => {
    const score = priceScore(sampleCreator, sampleCampaign);
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it("should score follower count accurately within min/max bounds", () => {
    const score = followerScore(sampleCreator, sampleCampaign);
    expect(score).toBe(100);
  });

  it("should compute an overall campaign match score with full breakdown", () => {
    const result = calculateMatchScore(sampleCreator, sampleCampaign);
    expect(result.matchScore).toBeGreaterThanOrEqual(75);
    expect(result.breakdown).toHaveProperty("engagement");
    expect(result.breakdown).toHaveProperty("audience");
    expect(result.breakdown).toHaveProperty("contentRelevance");
    expect(result.breakdown).toHaveProperty("location");
    expect(result.breakdown).toHaveProperty("follower");
    expect(result.breakdown).toHaveProperty("price");
  });
});

describe("AI Search & Fallback Engine (Developer 3 & QA)", () => {
  it("should parse natural language search queries into structured filters via fallback keywords", async () => {
    const query = "Find Indian fitness creators with 50K to 500K followers and engagement above 4%";
    const filters = await parseCreatorSearch(query);

    expect(filters.category).toBe("Fitness");
    expect(filters.country).toBe("India");
    expect(filters.minFollowers).toBe(50000);
    expect(filters.maxFollowers).toBe(500000);
    expect(filters.minEngagement).toBe(4);
  });

  it("should provide structured creator analysis fallback", async () => {
    const creator = {
      name: "Rohan Gupta",
      category: "Technology",
      platform: "YouTube",
    };
    const breakdown = {
      engagement: 85,
      audience: 90,
      contentRelevance: 95,
      location: 100,
      follower: 80,
      price: 75,
    };
    const analysis = await generateCreatorAnalysis(creator, undefined, breakdown);

    expect(analysis).toHaveProperty("summary");
    expect(analysis).toHaveProperty("strengths");
    expect(analysis).toHaveProperty("weaknesses");
    expect(analysis).toHaveProperty("recommendation");
    expect(Array.isArray(analysis.strengths)).toBe(true);
  });

  it("should generate personalized outreach template fallback for Instagram/Email", async () => {
    const creator = {
      name: "Diya Sharma",
      category: "Beauty",
      platform: "Instagram",
    };
    const campaign = {
      name: "Glow Skin Launch",
    };

    const res = await generateOutreach(creator, campaign, "Instagram DM");
    expect(res.message).toContain("Diya");
    expect(res.message).toContain("Glow Skin Launch");
  });
});

describe("JWT & Bcrypt Security Layer (Developer 5 / Abhi & QA)", () => {
  it("should hash and verify passwords with bcrypt", async () => {
    const rawPassword = "SecretPassword123!";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    expect(hash).not.toBe(rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare("WrongPassword", hash);
    expect(isWrongMatch).toBe(false);
  });

  it("should sign and verify valid JWT authentication tokens", () => {
    const payload = { userId: "user_12345", email: "test@creatorhunter.app", role: "CAMPAIGN_MANAGER" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    expect(typeof token).toBe("string");

    const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("should reject expired or invalid tokens", () => {
    const expiredToken = jwt.sign({ userId: "123" }, JWT_SECRET, { expiresIn: "-1s" });
    expect(() => jwt.verify(expiredToken, JWT_SECRET)).toThrow();

    const tamperedToken = "invalid.token.structure";
    expect(() => jwt.verify(tamperedToken, JWT_SECRET)).toThrow();
  });
});
