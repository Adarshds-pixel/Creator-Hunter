import { Router, type Request, type Response } from "express";
import Outreach from "../models/Outreach.js";
import {
  validateBody,
  outreachCreateSchema,
  outreachUpdateSchema,
} from "../middleware/validation.js";
import { validateObjectId } from "../middleware/objectId.js";

const router = Router();

const REPLIED_LIKE = new Set(["REPLIED", "INTERESTED", "NEGOTIATING"]);

// GET /api/outreach
router.get("/", async (req: Request, res: Response) => {
  try {
    const { campaignId, status } = req.query;
    const filter: Record<string, string> = {};
    if (typeof campaignId === "string" && campaignId) filter.campaignId = campaignId;
    if (typeof status === "string" && status) filter.status = status;

    const outreach = await Outreach.find(filter).sort({ createdAt: -1 }).lean();
    res.json(outreach);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch outreach" });
  }
});

// POST /api/outreach
router.post("/", validateBody(outreachCreateSchema), async (req: Request, res: Response) => {
  try {
    const payload = { ...req.body };
    if (payload.status === "CONTACTED") payload.sentAt = new Date();
    const outreach = await Outreach.create(payload);
    res.status(201).json(outreach);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create outreach" });
  }
});

// PATCH /api/outreach/:id
router.patch("/:id", validateObjectId("id"), validateBody(outreachUpdateSchema), async (req: Request, res: Response) => {
  try {
    const current = await Outreach.findById(req.params.id);
    if (!current) return res.status(404).json({ error: "Outreach not found" });

    const { status } = req.body;
    current.status = status;
    if (status === "CONTACTED" && !current.sentAt) current.sentAt = new Date();
    if (REPLIED_LIKE.has(status) && !current.repliedAt) current.repliedAt = new Date();

    await current.save();
    res.json(current);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update outreach" });
  }
});

export default router;
