import { Router, type Request, type Response } from "express";
import { searchCreators } from "../services/search.js";
import { validateBody, searchQuerySchema } from "../middleware/validation.js";

const router = Router();

// POST /api/search/creators
router.post("/creators", validateBody(searchQuerySchema), async (req: Request, res: Response) => {
  try {
    const { query, campaign } = req.body;

    const { filters, results } = await searchCreators(query, campaign);
    res.json({ filters, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
