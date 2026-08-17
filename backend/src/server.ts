import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import creatorsRouter from "./routes/creators.js";
import campaignsRouter from "./routes/campaigns.js";
import shortlistsRouter from "./routes/shortlists.js";
import outreachRouter from "./routes/outreach.js";
import searchRouter from "./routes/search.js";
import aiRouter from "./routes/ai.js";
import statsRouter from "./routes/stats.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/creators", creatorsRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/shortlists", shortlistsRouter);
app.use("/api/outreach", outreachRouter);
app.use("/api/search", searchRouter);
app.use("/api/ai", aiRouter);
app.use("/api/stats", statsRouter);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// 404 for any unmatched API route.
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler: malformed JSON bodies become 400s, anything else 500s.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const isParseError = (err as { type?: string } | null)?.type === "entity.parse.failed";
  if (isParseError) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
