import { Router, type Request, type Response } from "express";
import Campaign from "../models/Campaign.js";
import CampaignCreator from "../models/CampaignCreator.js";
import Creator from "../models/Creator.js";
import {
  validateBody,
  campaignCreateSchema,
  campaignUpdateSchema,
  campaignCreatorAddSchema,
  campaignCreatorUpdateSchema,
} from "../middleware/validation.js";
import { validateObjectId } from "../middleware/objectId.js";

const router = Router();

// GET /api/campaigns
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const filter = typeof status === "string" && status ? { status } : {};
    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 }).lean();
    res.json(campaigns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// POST /api/campaigns
router.post("/", validateBody(campaignCreateSchema), async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.create(req.body);
    res.status(201).json(campaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// GET /api/campaigns/:id — enriched with the campaign's CampaignCreator rows,
// each merged with its Creator document, so the pipeline UI has everything it needs.
router.get("/:id", validateObjectId("id"), async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const campaignCreators = await CampaignCreator.find({ campaignId: campaign._id }).lean();
    const creatorIds = campaignCreators.map((cc) => cc.creatorId);
    const creators = await Creator.find({ _id: { $in: creatorIds } }).lean();
    const creatorById = new Map(creators.map((c) => [String(c._id), c]));

    const mergedCreators = campaignCreators.map((cc) => ({
      ...cc,
      creator: creatorById.get(String(cc.creatorId)) ?? null,
    }));

    res.json({ ...campaign, creators: mergedCreators });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

// PATCH /api/campaigns/:id
router.patch("/:id", validateObjectId("id"), validateBody(campaignUpdateSchema), async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

// DELETE /api/campaigns/:id
router.delete("/:id", validateObjectId("id"), async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    await CampaignCreator.deleteMany({ campaignId: campaign._id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

// POST /api/campaigns/:id/creators
router.post(
  "/:id/creators",
  validateObjectId("id", "creatorId"),
  validateBody(campaignCreatorAddSchema),
  async (req: Request, res: Response) => {
    try {
      const campaign = await Campaign.findById(req.params.id).lean();
      if (!campaign) return res.status(404).json({ error: "Campaign not found" });

      const { creatorId, matchScore, status } = req.body;

      // Unique index on (campaignId, creatorId) backstops an upsert, so
      // re-adding an already-discovered creator updates it instead of creating
      // a duplicate row.
      const campaignCreator = await CampaignCreator.findOneAndUpdate(
        { campaignId: campaign._id, creatorId },
        {
          $set: {
            campaignId: campaign._id,
            creatorId,
            matchScore: matchScore ?? 0,
            status: status ?? "DISCOVERED",
          },
        },
        { upsert: true, returnDocument: "after" }
      );

      res.status(201).json(campaignCreator);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add creator to campaign" });
    }
  }
);

// PATCH /api/campaigns/:id/creators/:creatorId
router.patch(
  "/:id/creators/:creatorId",
  validateObjectId("id", "creatorId"),
  validateBody(campaignCreatorUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const campaignCreator = await CampaignCreator.findOneAndUpdate(
        { campaignId: req.params.id, creatorId: req.params.creatorId },
        req.body,
        { returnDocument: "after" }
      );
      if (!campaignCreator) return res.status(404).json({ error: "Campaign creator not found" });
      res.json(campaignCreator);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update campaign creator" });
    }
  }
);

export default router;
