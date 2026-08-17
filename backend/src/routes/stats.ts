import { Router, type Request, type Response } from "express";
import { getDashboardStats } from "../services/stats.js";

const router = Router();

// GET /api/stats/dashboard
router.get("/dashboard", async (_req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
});

export default router;
