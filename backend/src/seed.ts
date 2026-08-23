import "dotenv/config";
import mongoose from "mongoose";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import Creator from "./models/Creator.js";
import User from "./models/User.js";
import Campaign from "./models/Campaign.js";
import CampaignCreator, { type CampaignCreatorStatus } from "./models/CampaignCreator.js";
import Shortlist from "./models/Shortlist.js";
import Outreach from "./models/Outreach.js";
import { calculateMatchScore } from "./services/ranking.js";
import { estimateCreatorCost } from "./services/pricing.js";

const CATEGORIES = [
  "Fitness",
  "Gaming",
  "Technology",
  "Beauty",
  "Fashion",
  "Finance",
  "Food",
  "Travel",
  "Education",
  "Lifestyle",
];

const PLATFORMS = ["Instagram", "YouTube", "LinkedIn"] as const;

const INDIAN_CITIES = [
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
];

const INTERNATIONAL_LOCATIONS: { city: string; country: string }[] = [
  { city: "New York", country: "USA" },
  { city: "Los Angeles", country: "USA" },
  { city: "London", country: "UK" },
  { city: "Manchester", country: "UK" },
  { city: "Dubai", country: "UAE" },
  { city: "Abu Dhabi", country: "UAE" },
];

const CATEGORY_BIO: Record<string, string> = {
  Fitness: "Helping you build strength and consistency, one workout at a time.",
  Gaming: "Livestreams, walkthroughs, and everything gaming.",
  Technology: "Breaking down the latest in tech, gadgets, and software.",
  Beauty: "Makeup tutorials, skincare routines, and product reviews.",
  Fashion: "Style inspiration and outfit ideas for every season.",
  Finance: "Making personal finance and investing easy to understand.",
  Food: "Recipes, restaurant reviews, and everything delicious.",
  Travel: "Exploring the world one destination at a time.",
  Education: "Learning made simple — tips, tricks, and study hacks.",
  Lifestyle: "Sharing daily life, routines, and things I love.",
};

// One "job title" per category, picked per-creator — feeds the CreatorCard
// subtitle line the reference mockups show (e.g. "Fitness Coach").
const CATEGORY_TITLES: Record<string, string[]> = {
  Fitness: ["Fitness Coach", "Personal Trainer", "Yoga Instructor", "Strength Coach"],
  Gaming: ["Gaming Streamer", "Esports Creator", "Let's Play Host", "Game Reviewer"],
  Technology: ["Tech Reviewer", "Gadget Enthusiast", "Tech Educator", "Software Creator"],
  Beauty: ["Makeup Artist", "Beauty Influencer", "Skincare Specialist", "Beauty Educator"],
  Fashion: ["Fashion Stylist", "Style Influencer", "Fashion Blogger", "Outfit Curator"],
  Finance: ["Finance Educator", "Investment Creator", "Personal Finance Coach", "Money Mentor"],
  Food: ["Food Blogger", "Home Chef", "Recipe Creator", "Restaurant Reviewer"],
  Travel: ["Travel Creator", "Adventure Vlogger", "Travel Photographer", "Backpacking Guide"],
  Education: ["Education Creator", "Study Coach", "Online Tutor", "Learning Specialist"],
  Lifestyle: ["Lifestyle Creator", "Daily Vlogger", "Lifestyle Blogger", "Content Creator"],
};

// Per-category tag pool — 3-5 sampled per creator for the CreatorCard tag chips.
const CATEGORY_TAGS: Record<string, string[]> = {
  Fitness: ["Strength Training", "Muscle Building", "Home Workouts", "Weight Loss", "HIIT", "Yoga", "Flexibility", "Nutrition", "Bodybuilding", "Cardio", "Calisthenics"],
  Gaming: ["FPS", "RPG", "Speedrunning", "Esports", "Retro Gaming", "Mobile Gaming", "Walkthroughs", "Game Reviews", "Streaming", "Co-op"],
  Technology: ["Gadget Reviews", "Smartphones", "Laptops", "AI", "Coding", "Startups", "Unboxing", "Software", "Hardware", "Productivity Tools"],
  Beauty: ["Makeup Tutorials", "Skincare Routines", "Product Reviews", "K-Beauty", "Haircare", "Natural Beauty", "Editorial Makeup", "Anti-Aging"],
  Fashion: ["Street Style", "Outfit Ideas", "Sustainable Fashion", "Thrifting", "Seasonal Trends", "Capsule Wardrobe", "Accessories", "Formal Wear"],
  Finance: ["Investing", "Budgeting", "Stock Market", "Personal Finance", "Crypto", "Tax Tips", "Side Hustles", "Retirement Planning"],
  Food: ["Healthy Recipes", "Baking", "Street Food", "Vegan", "Meal Prep", "Restaurant Reviews", "Regional Cuisine", "Quick Recipes"],
  Travel: ["Budget Travel", "Solo Travel", "Luxury Travel", "Road Trips", "Hidden Gems", "Travel Tips", "Backpacking", "City Guides"],
  Education: ["Study Tips", "Exam Prep", "Language Learning", "STEM", "Career Advice", "Online Courses", "Productivity", "Test Strategies"],
  Lifestyle: ["Daily Routines", "Home Decor", "Minimalism", "Self Care", "Productivity", "Relationships", "Wellness", "Organization"],
};

// Name pools are keyed by region and drawn from together (not pooled
// globally) so a Hyderabad creator doesn't end up named "Sai Wilson" —
// first/last name always come from the same region as the creator's city.
const INDIAN_FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan",
  "Ananya", "Diya", "Saanvi", "Aadhya", "Kavya", "Myra", "Anika", "Ira", "Riya", "Navya",
];
const INDIAN_LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Kumar", "Singh", "Patel", "Reddy", "Nair", "Iyer", "Rao",
  "Khan", "Shah", "Mehta", "Joshi", "Chopra", "Malhotra",
];

const WESTERN_FIRST_NAMES = [
  "Liam", "Noah", "Oliver", "Elijah", "James", "Emma", "Olivia", "Ava", "Sophia", "Isabella",
];
const WESTERN_LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Taylor", "Anderson",
];

const ARABIC_FIRST_NAMES = ["Mohammed", "Ahmed", "Yusuf", "Fatima", "Aisha", "Zara"];
const ARABIC_LAST_NAMES = ["Khan", "Al Farsi", "Al Maktoum", "Hussain", "Rahman", "Malik"];

function nameForLocation(country: string): { first: string; last: string } {
  if (country === "India") return { first: pick(INDIAN_FIRST_NAMES), last: pick(INDIAN_LAST_NAMES) };
  if (country === "UAE") {
    return Math.random() < 0.6
      ? { first: pick(ARABIC_FIRST_NAMES), last: pick(ARABIC_LAST_NAMES) }
      : { first: pick(WESTERN_FIRST_NAMES), last: pick(WESTERN_LAST_NAMES) };
  }
  return { first: pick(WESTERN_FIRST_NAMES), last: pick(WESTERN_LAST_NAMES) };
}

const TRACKED_COUNTRIES = ["India", "USA", "UAE", "UK", "Other"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function splitRemainder(parts: number, total: number): number[] {
  if (parts <= 0) return [];
  const cuts = Array.from({ length: parts }, () => Math.random());
  const sum = cuts.reduce((s, v) => s + v, 0) || 1;
  const shares = cuts.map((v) => round((v / sum) * total));
  const drift = round(total - shares.reduce((s, v) => s + v, 0));
  shares[shares.length - 1] = round(shares[shares.length - 1] + drift);
  return shares;
}

function pickFollowers(): number {
  const roll = Math.random();
  if (roll < 0.35) return Math.round(randomBetween(10_000, 50_000));
  if (roll < 0.7) return Math.round(randomBetween(50_000, 200_000));
  if (roll < 0.9) return Math.round(randomBetween(200_000, 1_000_000));
  return Math.round(randomBetween(1_000_000, 5_000_000));
}

function pickLocation(): { city: string; country: string } {
  if (Math.random() < 0.75) {
    return { city: pick(INDIAN_CITIES), country: "India" };
  }
  return pick(INTERNATIONAL_LOCATIONS);
}

// Samples 3-5 unique tags for a category (falls back to an empty pool
// gracefully if a category is somehow missing from CATEGORY_TAGS).
function sampleTags(category: string): string[] {
  const pool = CATEGORY_TAGS[category] ?? [];
  const n = Math.min(pool.length, 3 + Math.floor(Math.random() * 3)); // 3-5
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Staggers createdAt across the last `daysBack` days, skewed toward more
// recent days (sqrt transform on a uniform draw) so the Discovery Insights
// chart shows a genuine upward "+N this week" slope instead of flat noise —
// this staggering is what the reference mockup's own chart bug is fixing.
function randomCreatedAt(daysBack = 30): Date {
  const skewedFraction = 1 - Math.sqrt(Math.random()); // concentrated near 0 (recent)
  const msAgo = (skewedFraction * daysBack + Math.random()) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - msAgo);
}

// --- Avatar photos -----------------------------------------------------
// Downloaded once, served locally from frontend/public/creators/ (Vite
// serves this directory directly at the SPA origin — no backend static
// config needed, and no external hotlinking at runtime).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVATAR_DIR = path.resolve(__dirname, "../../frontend/public/creators");
const AVATAR_GENDERS = ["men", "women"] as const;
const AVATARS_PER_GENDER = 60; // 120 total, fixed/deterministic randomuser.me indices

async function downloadAvatars(): Promise<string[]> {
  await fsp.mkdir(AVATAR_DIR, { recursive: true });

  const paths: string[] = [];
  let downloaded = 0;
  let n = 1;

  for (const gender of AVATAR_GENDERS) {
    for (let i = 0; i < AVATARS_PER_GENDER; i++) {
      const filename = `${n}.jpg`;
      const targetPath = path.join(AVATAR_DIR, filename);
      const publicPath = `/creators/${filename}`;

      if (fs.existsSync(targetPath)) {
        paths.push(publicPath);
        n++;
        continue;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`https://randomuser.me/api/portraits/${gender}/${i}.jpg`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await fsp.writeFile(targetPath, buffer);
        paths.push(publicPath);
        downloaded++;
      } catch (err) {
        console.warn(`  avatar ${n} failed: ${(err as Error).message}`);
      }

      n++;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  const total = AVATAR_GENDERS.length * AVATARS_PER_GENDER;
  console.log(`Avatars: ${paths.length}/${total} available (${downloaded} downloaded this run).`);
  return paths;
}

function buildCreator(index: number, photoPool: string[]) {
  const category = pick(CATEGORIES);
  const platform = pick(PLATFORMS);
  const location = pickLocation();
  const followers = pickFollowers();

  const platformEngagement = platform === "LinkedIn" ? 1.8 : platform === "YouTube" ? 3.2 : 4.5;
  const sizePenalty = followers > 1_000_000 ? 0.6 : followers > 200_000 ? 0.8 : 1.0;
  const engagementRate = round(
    clampScore(platformEngagement * sizePenalty * randomBetween(0.7, 1.8)),
    1
  );

  const platformViewMultiplier = platform === "YouTube" ? 0.8 : platform === "Instagram" ? 0.4 : 0.15;
  const avgViews = Math.round(followers * platformViewMultiplier * randomBetween(0.6, 1.4));
  const avgLikes = Math.round(followers * (engagementRate / 100) * randomBetween(0.7, 1.1));
  const avgComments = Math.round(avgLikes * randomBetween(0.01, 0.05));

  const audienceMale = round(randomBetween(30, 70));
  const audienceFemale = round(100 - audienceMale);

  const [age18_24, age25_34, age35_44, age45Plus] = splitRemainder(4, 100);

  const homeCountry = (TRACKED_COUNTRIES as readonly string[]).includes(location.country)
    ? location.country
    : "Other";
  const homeShare = round(randomBetween(45, 85));
  const otherCountries = TRACKED_COUNTRIES.filter((c) => c !== homeCountry);
  const otherShares = splitRemainder(otherCountries.length, 100 - homeShare);
  const countryShare: Record<string, number> = { [homeCountry]: homeShare };
  otherCountries.forEach((c, i) => {
    countryShare[c] = otherShares[i];
  });

  const estimatedCost = estimateCreatorCost({ followers, engagementRate, platform, category });

  const isMediocre = Math.random() < 0.13;
  const authenticityScore = isMediocre
    ? Math.round(randomBetween(35, 59))
    : Math.round(randomBetween(60, 98));
  const audienceQualityScore = Math.round(clampScore(authenticityScore + randomBetween(-10, 10)));

  const { first: firstName, last: lastName } = nameForLocation(location.country);
  const name = `${firstName} ${lastName}`;
  const username = `${firstName}${lastName}${index}`.toLowerCase();

  return {
    name,
    username,
    platform,
    profileUrl: `https://${platform.toLowerCase()}.com/${username}`,
    profileImage: photoPool.length > 0 ? pick(photoPool) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    bio: CATEGORY_BIO[category],
    category,
    title: pick(CATEGORY_TITLES[category] ?? [category]),
    tags: sampleTags(category),
    verified: Math.random() < 0.65,
    location: `${location.city}, ${location.country}`,
    country: location.country,
    city: location.city,
    languages: location.country === "India" ? ["English", "Hindi"] : ["English"],
    followers,
    following: Math.round(randomBetween(100, 2000)),
    posts: Math.round(randomBetween(50, 3000)),
    avgLikes,
    avgComments,
    avgViews,
    engagementRate,
    audienceMale,
    audienceFemale,
    age18_24,
    age25_34,
    age35_44,
    age45Plus,
    audienceIndia: countryShare.India ?? 0,
    audienceUSA: countryShare.USA ?? 0,
    audienceUAE: countryShare.UAE ?? 0,
    audienceUK: countryShare.UK ?? 0,
    audienceOther: countryShare.Other ?? 0,
    growthRate: round(randomBetween(-2, 15), 1),
    estimatedCost,
    authenticityScore,
    audienceQualityScore,
    source: "DATASET",
    createdAt: randomCreatedAt(30),
  };
}

// Three realistic campaigns replacing the "dfvf"/"VGVH" test junk, with a
// staggered createdAt spread so Recent Campaigns/Recent Activity have real
// chronological variety instead of three identical timestamps.
function buildRealisticCampaigns() {
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return [
    {
      name: "Monsoon Fitness Push",
      brand: "FlexFit Wear",
      product: "Performance Activewear",
      description:
        "Recruiting fitness and lifestyle creators to promote the new monsoon activewear line across Instagram and YouTube.",
      budget: 350_000,
      targetCountry: "India",
      targetCategory: "Fitness",
      platform: "Instagram",
      minFollowers: 20_000,
      maxFollowers: 500_000,
      minEngagement: 3,
      status: "ACTIVE",
      createdAt: daysAgo(3),
    },
    {
      name: "Tech Launch: Pulse Earbuds",
      brand: "Pulse Audio",
      product: "Pulse Earbuds Gen 2",
      description: "Tech reviewers and unboxing creators for the Pulse Earbuds Gen 2 launch.",
      budget: 500_000,
      targetCategory: "Technology",
      platform: "YouTube",
      minFollowers: 50_000,
      status: "DRAFT",
      createdAt: daysAgo(10),
    },
    {
      name: "Festive Recipe Series",
      brand: "Masala Table",
      product: "Spice Kits",
      description: "Food creators building a festive-season recipe series featuring Masala Table spice kits.",
      budget: 180_000,
      targetCountry: "India",
      targetCategory: "Food",
      platform: "Instagram",
      status: "COMPLETED",
      createdAt: daysAgo(24),
    },
  ];
}

// Per-campaign pipeline shape: how many CampaignCreator rows, and a weighted
// stage distribution chosen so the computed progress % (see routes/campaigns.ts)
// lands in the right neighborhood for that campaign's status — genuinely
// computed from these rows, not a hardcoded percentage.
const CAMPAIGN_PIPELINE_PROFILES: { count: number; weights: [CampaignCreatorStatus, number][] }[] = [
  {
    // Monsoon Fitness Push — ACTIVE, well underway
    count: 120,
    weights: [
      ["DISCOVERED", 0.08],
      ["SHORTLISTED", 0.1],
      ["CONTACTED", 0.12],
      ["REPLIED", 0.12],
      ["NEGOTIATING", 0.15],
      ["APPROVED", 0.15],
      ["CONTENT_SUBMITTED", 0.13],
      ["COMPLETED", 0.15],
    ],
  },
  {
    // Tech Launch: Pulse Earbuds — DRAFT, early-stage only
    count: 80,
    weights: [
      ["DISCOVERED", 0.55],
      ["SHORTLISTED", 0.3],
      ["CONTACTED", 0.15],
    ],
  },
  {
    // Festive Recipe Series — COMPLETED
    count: 200,
    weights: [["COMPLETED", 1]],
  },
];

function pickWeighted<T extends string>(weights: [T, number][]): T {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [value, w] of weights) {
    if (roll < w) return value;
    roll -= w;
  }
  return weights[weights.length - 1][0];
}

// Assigns real creators (favoring each campaign's targetCategory) into the
// campaign's pipeline with real matchScores and a realistic stage spread —
// this is what makes Campaigns-page progress/reach/creator-count honest
// instead of zero across the board.
async function seedCampaignPipelines(insertedCampaigns: InstanceType<typeof Campaign>[]) {
  for (let i = 0; i < insertedCampaigns.length; i++) {
    const campaign = insertedCampaigns[i];
    const profile = CAMPAIGN_PIPELINE_PROFILES[i];
    if (!profile) continue;

    let candidates = campaign.targetCategory
      ? await Creator.find({ category: campaign.targetCategory }).limit(profile.count).lean()
      : [];
    if (candidates.length < profile.count) {
      const excludeIds = candidates.map((c) => c._id);
      const extra = await Creator.aggregate([
        { $match: { _id: { $nin: excludeIds } } },
        { $sample: { size: profile.count - candidates.length } },
      ]);
      candidates = candidates.concat(extra);
    }

    const rows = candidates.slice(0, profile.count).map((creator) => {
      const { matchScore } = calculateMatchScore(creator, campaign);
      return {
        campaignId: campaign._id,
        creatorId: creator._id,
        matchScore: Math.round(matchScore),
        status: pickWeighted(profile.weights),
      };
    });

    if (rows.length > 0) await CampaignCreator.insertMany(rows);
    console.log(`  ${campaign.name}: ${rows.length} pipeline rows seeded`);
  }
}

async function seed(count = 2500) {
  console.log("Wiping existing collections (Creator, Campaign, CampaignCreator, Shortlist, Outreach)...");
  await Promise.all([
    Creator.deleteMany({}),
    Campaign.deleteMany({}),
    CampaignCreator.deleteMany({}),
    Shortlist.deleteMany({}),
    Outreach.deleteMany({}),
  ]);

  console.log("Downloading creator avatars (idempotent — skips files already on disk)...");
  const photoPool = await downloadAvatars();

  console.log(`Generating ${count} creators...`);
  const creators = Array.from({ length: count }, (_, i) => buildCreator(i, photoPool));

  const BATCH_SIZE = 500;
  for (let i = 0; i < creators.length; i += BATCH_SIZE) {
    const batch = creators.slice(i, i + BATCH_SIZE);
    await Creator.insertMany(batch);
    console.log(`  inserted ${Math.min(i + BATCH_SIZE, creators.length)}/${count} creators`);
  }

  const campaigns = buildRealisticCampaigns();
  const insertedCampaigns = await Campaign.insertMany(campaigns);

  console.log("Seeding campaign pipelines (CampaignCreator rows)...");
  await seedCampaignPipelines(insertedCampaigns);

  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash("AdminPass123!", salt);

  await User.findOneAndUpdate(
    { email: "admin@creatorhunter.app" },
    {
      name: "Admin User",
      email: "admin@creatorhunter.app",
      passwordHash: adminHash,
      company: "Creator Hunter Inc",
      role: "ADMIN",
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log(
    `Seeded ${count} creators, ${campaigns.length} campaigns, ${photoPool.length} avatars, and the admin user.`
  );
}

export async function seedDatabase(count = 2500) {
  return seed(count);
}

async function runStandaloneSeed() {
  await connectDB();
  await seed(2500);
  await mongoose.disconnect();
  process.exit(0);
}

// If executed directly via node/tsx
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  runStandaloneSeed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
