import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const searchQuerySchema = z.object({
  query: z.string().min(1),
  campaign: z.record(z.string(), z.any()).optional(),
});

export const creatorAnalysisSchema = z.object({
  creatorId: z.string().min(1),
  campaign: z.record(z.string(), z.any()).optional(),
});

export const outreachSchema = z.object({
  creatorId: z.string().min(1),
  campaign: z.record(z.string(), z.any()).optional(),
  channel: z.enum(["INSTAGRAM", "EMAIL", "WHATSAPP", "LINKEDIN"]),
});

export function validateBody(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }
    req.body = result.data;
    next();
  };
}
