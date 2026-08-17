import { Router, type Request, type Response } from "express";
import Creator from "../models/Creator.js";
import {
  parseCreatorSearch,
  generateCreatorAnalysis,
  generateOutreach,
} from "../services/ai.js";
import { calculateMatchScore } from "../services/ranking.js";
import {
  validateBody,
  searchQuerySchema,
  creatorAnalysisSchema,
  outreachSchema,
} from "../middleware/validation.js";

const router = Router();

// POST /api/ai/parse-search — Member A
router.post("/parse-search", validateBody(searchQuerySchema), async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    const filters = await parseCreatorSearch(query);
    res.json(filters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to parse search query" });
  }
});

// POST /api/ai/creator-analysis — Member B
router.post(
  "/creator-analysis",
  validateBody(creatorAnalysisSchema),
  async (req: Request, res: Response) => {
    try {
      const { creatorId, campaign } = req.body;

      const creator = await Creator.findById(creatorId).lean();
      if (!creator) return res.status(404).json({ error: "Creator not found" });

      const { breakdown } = calculateMatchScore(creator, campaign || {});
      const analysis = await generateCreatorAnalysis(creator, campaign, breakdown);
      res.json(analysis);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate creator analysis" });
    }
  }
);

// POST /api/ai/outreach — Member C
router.post("/outreach", validateBody(outreachSchema), async (req: Request, res: Response) => {
  try {
    const { creatorId, campaign, channel } = req.body;

    const creator = await Creator.findById(creatorId).lean();
    if (!creator) return res.status(404).json({ error: "Creator not found" });

    const outreach = await generateOutreach(creator, campaign, channel);
    res.json(outreach);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate outreach message" });
  }
});

export default router;
