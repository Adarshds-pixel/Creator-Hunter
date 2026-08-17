// Originally slated for Developer 5 (Data + Integration + QA); implemented here
// since an empty Creator collection blocks testing every other slice.
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import Creator from "./models/Creator.js";
import User from "./models/User.js";

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

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan",
  "Ananya", "Diya", "Saanvi", "Aadhya", "Kavya", "Myra", "Anika", "Ira", "Riya", "Navya",
  "Liam", "Noah", "Oliver", "Elijah", "James", "Emma", "Olivia", "Ava", "Sophia", "Isabella",
  "Mohammed", "Ahmed", "Yusuf", "Fatima", "Aisha", "Zara",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Kumar", "Singh", "Patel", "Reddy", "Nair", "Iyer", "Rao",
  "Khan", "Shah", "Mehta", "Joshi", "Chopra", "Malhotra",
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Taylor", "Anderson",
];

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

// Splits `total` into `parts` random non-negative shares that sum back to `total`.
function splitRemainder(parts: number, total: number): number[] {
  if (parts <= 0) return [];
  const cuts = Array.from({ length: parts }, () => Math.random());
  const sum = cuts.reduce((s, v) => s + v, 0) || 1;
  const shares = cuts.map((v) => round((v / sum) * total));
  const drift = round(total - shares.reduce((s, v) => s + v, 0));
  shares[shares.length - 1] = round(shares[shares.length - 1] + drift);
  return shares;
}

// Weighted follower-count bucket so the dataset isn't uniformly huge.
function randomFollowers(): number {
  const roll = Math.random();
  if (roll < 0.45) return Math.round(randomBetween(1_000, 20_000)); // nano
  if (roll < 0.8) return Math.round(randomBetween(20_000, 200_000)); // mid
  if (roll < 0.95) return Math.round(randomBetween(200_000, 2_000_000)); // large
  return Math.round(randomBetween(2_000_000, 10_000_000)); // mega
}

function buildCreator(index: number) {
  const category = pick(CATEGORIES);
  const platform = pick(PLATFORMS);
  const isIndian = Math.random() < 0.65;
  const location = isIndian
    ? { city: pick(INDIAN_CITIES), country: "India" }
    : pick(INTERNATIONAL_LOCATIONS);

  const followers = randomFollowers();

  // Smaller creators tend to have higher engagement; add noise so it isn't deterministic.
  const baseEngagement =
    followers < 20_000
      ? randomBetween(4, 9)
      : followers < 200_000
        ? randomBetween(2.5, 6)
        : followers < 2_000_000
          ? randomBetween(1.5, 4)
          : randomBetween(0.5, 2.5);
  const engagementRate = round(Math.max(0.1, baseEngagement + randomBetween(-0.5, 0.5)), 2);

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

  const estimatedCost = Math.round(
    followers *
      randomBetween(0.15, 0.6) *
      (platform === "YouTube" ? 1.3 : 1) *
      (category === "Finance" || category === "Technology" ? 1.2 : 1)
  );

  const isMediocre = Math.random() < 0.13;
  const authenticityScore = isMediocre
    ? Math.round(randomBetween(35, 59))
    : Math.round(randomBetween(60, 98));
  const audienceQualityScore = Math.round(clampScore(authenticityScore + randomBetween(-10, 10)));

  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const username = `${firstName}${lastName}${index}`.toLowerCase();

  return {
    name,
    username,
    platform,
    profileUrl: `https://${platform.toLowerCase()}.com/${username}`,
    bio: CATEGORY_BIO[category],
    category,
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
  };
}

async function seed() {
  await connectDB();

  await Creator.deleteMany({});
  const count = 400;
  const creators = Array.from({ length: count }, (_, i) => buildCreator(i));
  await Creator.insertMany(creators);

  await User.findOneAndUpdate(
    { email: "demo@creatorhunter.app" },
    {
      name: "Demo User",
      email: "demo@creatorhunter.app",
      passwordHash: "seed-placeholder-not-a-real-hash",
      role: "OWNER",
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log(`Seeded ${count} creators and 1 demo user.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
