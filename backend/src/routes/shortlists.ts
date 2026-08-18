import { Router, type Request, type Response } from "express";
import Shortlist from "../models/Shortlist.js";
import User from "../models/User.js";
import {
  validateBody,
  shortlistCreateSchema,
  shortlistAddCreatorSchema,
} from "../middleware/validation.js";
import { validateObjectId } from "../middleware/objectId.js";
import { optionalAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const DEMO_USER_EMAIL = "demo@creatorhunter.app";

async function resolveUserId(reqUser?: { _id: unknown }, userIdBody?: string): Promise<string> {
  if (reqUser?._id) return String(reqUser._id);
  if (userIdBody) return userIdBody;
  const demoUser = await User.findOne({ email: DEMO_USER_EMAIL }).lean();
  if (!demoUser) throw new Error("Demo user not seeded — run `npm run seed`");
  return String(demoUser._id);
}

// GET /api/shortlists
router.get("/", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter = req.user ? { userId: req.user._id } : {};
    const shortlists = await Shortlist.find(filter).lean();
    res.json(shortlists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shortlists" });
  }
});

// POST /api/shortlists
router.post("/", optionalAuth, validateBody(shortlistCreateSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = await resolveUserId(req.user, req.body.userId);
    const shortlist = await Shortlist.create({ name: req.body.name, userId, creators: [] });
    res.status(201).json(shortlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create shortlist" });
  }
});

// POST /api/shortlists/:id/creators
router.post(
  "/:id/creators",
  validateObjectId("id", "creatorId"),
  validateBody(shortlistAddCreatorSchema),
  async (req: Request, res: Response) => {
    try {
      const { creatorId, notes } = req.body;

      const alreadyPresent = await Shortlist.exists({
        _id: req.params.id,
        "creators.creatorId": creatorId,
      });

      const shortlist = alreadyPresent
        ? await Shortlist.findById(req.params.id).lean()
        : await Shortlist.findByIdAndUpdate(
            req.params.id,
            { $push: { creators: { creatorId, notes } } },
            { returnDocument: "after" }
          ).lean();

      if (!shortlist) return res.status(404).json({ error: "Shortlist not found" });
      res.json(shortlist);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add creator to shortlist" });
    }
  }
);

// DELETE /api/shortlists/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const shortlist = await Shortlist.findByIdAndDelete(req.params.id);
    if (!shortlist) return res.status(404).json({ error: "Shortlist not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete shortlist" });
  }
});

// DELETE /api/shortlists/:id/creators/:creatorId
router.delete(
  "/:id/creators/:creatorId",
  validateObjectId("id", "creatorId"),
  async (req: Request, res: Response) => {
  try {
    const shortlist = await Shortlist.findByIdAndUpdate(
      req.params.id,
      { $pull: { creators: { creatorId: req.params.creatorId } } },
      { returnDocument: "after" }
    );
    if (!shortlist) return res.status(404).json({ error: "Shortlist not found" });
    res.json(shortlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove creator from shortlist" });
  }
});

export default router;
