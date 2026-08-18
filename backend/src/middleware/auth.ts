import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { type IUser } from "../models/User.js";

export const JWT_SECRET = process.env.JWT_SECRET || "creator-hunter-secret-key-dev-2026";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required. Missing or invalid Bearer token." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication token missing." });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ error: "User not found or token expired." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
        const user = await User.findById(decoded.userId).select("-passwordHash");
        if (user) {
          req.user = user;
        }
      }
    }
  } catch {
    // Ignore error for optional authentication
  }
  next();
}
