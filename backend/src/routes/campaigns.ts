import { Router, type Request, type Response } from "express";
import Campaign from "../models/Campaign.js";
import CampaignCreator, { CAMPAIGN_CREATOR_STATUSES } from "../models/CampaignCreator.js";
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

// Normalize against COMPLETED's index, not the array's last entry — REJECTED
// sits after COMPLETED in the enum but isn't "further along" the pipeline,
// it's a different terminal branch. Treat REJECTED as equally "resolved"
// (same index as COMPLETED) rather than letting it silently deflate every
// campaign's progress toward a status that was never actually the goal.
const COMPLETED_INDEX = CAMPAIGN_CREATOR_STATUSES.indexOf("COMPLETED");

function stageProgressIndex(status: string): number {
  if (status === "REJECTED") return COMPLETED_INDEX;
  const idx = CAMPAIGN_CREATOR_STATUSES.indexOf(status as (typeof CAMPAIGN_CREATOR_STATUSES)[number]);
  return idx === -1 ? 0 : idx;
}

// GET /api/campaigns
// Enriched with per-campaign creatorsCount/reach/progress, joined from
// CampaignCreator + Creator — the card grid needs real numbers, not a
// second round-trip per card. progress = avg pipeline-stage index / max
// stage index across that campaign's CampaignCreator rows (0 when there
// are none yet — an honest empty state, not hidden).
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const filter = typeof status === "string" && status ? { status } : {};
    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 }).lean();

    const campaignIds = campaigns.map((c) => c._id);
    const ccRows = await CampaignCreator.find({ campaignId: { $in: campaignIds } })
      .select("campaignId creatorId status")
      .lean();

    const creatorIds = [...new Set(ccRows.map((cc) => String(cc.creatorId)))];
    const creators = await Creator.find({ _id: { $in: creatorIds } }).select("followers").lean();
    const followersById = new Map(creators.map((c) => [String(c._id), c.followers ?? 0]));

    const rowsByCampaign = new Map<string, typeof ccRows>();
    for (const cc of ccRows) {
      const key = String(cc.campaignId);
      const list = rowsByCampaign.get(key) ?? [];
      list.push(cc);
      rowsByCampaign.set(key, list);
    }

    const enriched = campaigns.map((c) => {
      const rows = rowsByCampaign.get(String(c._id)) ?? [];
      const creatorsCount = rows.length;
      const reach = rows.reduce((sum, r) => sum + (followersById.get(String(r.creatorId)) ?? 0), 0);
      const progress = creatorsCount
        ? Math.round(
            (100 * rows.reduce((sum, r) => sum + stageProgressIndex(r.status), 0)) /
              (creatorsCount * COMPLETED_INDEX)
          )
        : 0;
      return { ...c, creatorsCount, reach, progress };
    });

    res.json(enriched);
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
