import type { Request, Response, NextFunction } from "express";

// Owned by Developer 5 (Data + Integration + QA). Not implemented in this session.
export function requireAuth(_req: Request, res: Response, _next: NextFunction) {
  return res.status(501).json({ error: "Not implemented: Developer 5 owns authentication" });
}
