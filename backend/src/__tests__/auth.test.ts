import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import User from "../models/User.js";
import { connectTestDB, disconnectTestDB } from "./setup.js";

describe("Authentication Endpoints", () => {
  beforeAll(async () => {
    await connectTestDB();
    await User.deleteMany({ email: /@testauth\.com$/ });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@testauth\.com$/ });
    await disconnectTestDB();
  });

  const testUser = {
    name: "Test Developer",
    email: "dev@testauth.com",
    password: "Password123!",
    company: "Test Agency",
    role: "CAMPAIGN_MANAGER",
  };

  it("should register a new user and return a JWT token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      name: testUser.name,
      email: testUser.email,
      company: testUser.company,
      role: testUser.role,
    });
  });

  it("should reject registration with duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it("should reject registration with invalid password (too short)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Short Pass",
        email: "short@testauth.com",
        password: "123",
      });

    expect(res.status).toBe(400);
  });

  it("should log in with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(testUser.email);
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: "WrongPassword!",
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("should reject login with unregistered email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent@testauth.com",
        password: "Password123!",
      });

    expect(res.status).toBe(401);
  });

  it("should return current user with valid Bearer token on /api/auth/me", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(testUser.email);
  });

  it("should reject /api/auth/me without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
