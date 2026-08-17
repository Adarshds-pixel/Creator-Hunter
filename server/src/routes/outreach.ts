import { Router, type Request, type Response } from "express";

const router = Router();

// Owned by Developer 2 (Backend + Database). Not implemented in this session.
router.get("/", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Not implemented: Developer 2 owns Outreach API" });
});

router.post("/", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Not implemented: Developer 2 owns Outreach API" });
});

router.patch("/:id", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Not implemented: Developer 2 owns Outreach API" });
});

export default router;
