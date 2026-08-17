import { Router, type Request, type Response } from "express";
import Creator from "../models/Creator.js";
import { validateBody, creatorCreateSchema } from "../middleware/validation.js";
import { validateObjectId } from "../middleware/objectId.js";

const router = Router();

interface CreatorListFilter {
  category?: string;
  country?: string;
  city?: string;
  platform?: string;
  followers?: { $gte?: number; $lte?: number };
  engagementRate?: { $gte: number };
}

function parseNumberParam(value: unknown): number | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

// GET /api/creators
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, country, city, platform } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 24));

    const filter: CreatorListFilter = {};
    if (typeof category === "string" && category) filter.category = category;
    if (typeof country === "string" && country) filter.country = country;
    if (typeof city === "string" && city) filter.city = city;
    if (typeof platform === "string" && platform) filter.platform = platform;

    const minFollowers = parseNumberParam(req.query.minFollowers);
    const maxFollowers = parseNumberParam(req.query.maxFollowers);
    if (minFollowers != null || maxFollowers != null) {
      filter.followers = {};
      if (minFollowers != null) filter.followers.$gte = minFollowers;
      if (maxFollowers != null) filter.followers.$lte = maxFollowers;
    }

    const minEngagement = parseNumberParam(req.query.minEngagement);
    if (minEngagement != null) filter.engagementRate = { $gte: minEngagement };

    const [creators, total] = await Promise.all([
      Creator.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Creator.countDocuments(filter),
    ]);

    res.json({ creators, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch creators" });
  }
});

// GET /api/creators/:id
router.get("/:id", validateObjectId("id"), async (req: Request, res: Response) => {
  try {
    const creator = await Creator.findById(req.params.id).lean();
    if (!creator) return res.status(404).json({ error: "Creator not found" });
    res.json(creator);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch creator" });
  }
});

// POST /api/creators
router.post("/", validateBody(creatorCreateSchema), async (req: Request, res: Response) => {
  try {
    const creator = await Creator.create(req.body);
    res.status(201).json(creator);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create creator" });
  }
});

export default router;
