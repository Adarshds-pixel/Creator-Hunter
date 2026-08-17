import { Types } from "mongoose";
import type { Request, Response, NextFunction } from "express";

// Guards route params that must be valid MongoDB ObjectIds. Without this,
// malformed ids reach Mongoose queries, throw a CastError, and surface as 500s.
export function validateObjectId(...params: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const param of params) {
      const value = req.params[param];
      if (typeof value === "string" && value && !Types.ObjectId.isValid(value)) {
        return res.status(400).json({ error: `Invalid ${param}: ${value}` });
      }
    }
    next();
  };
}