# Creator Hunter — Setup & Testing Manual

Covers the full stack verification including backend CRUD, seed dataset, AI services, Authentication system, CSV exports, and the automated QA test suite.

---

## 1. One-time setup

```bash
# 1. MongoDB — any local instance works. If you don't have one, Docker is easiest:
docker run -d --name creator-hunter-mongo -p 27017:27017 mongo:7

# 2. Backend env
cd backend
cp .env.example .env
# .env needs at minimum:
#   MONGODB_URI=mongodb://localhost:27017/creator-hunter
#   PORT=5000
#   JWT_SECRET=creator-hunter-secret-key-dev-2026
# GEMINI_API_KEY is optional — leave it blank to use the built-in keyword
# fallback for search/analysis/outreach, or set it to use real Gemini calls.
npm install

# 3. Frontend env — no required vars, Vite proxies /api to localhost:5000
cd ../frontend
npm install
```

---

## 2. Seed the database

```bash
cd backend
npm run seed
```

This clears and repopulates:
- **500 Creator documents** across 10 categories (Fitness, Gaming, Technology, Beauty, Fashion, Finance, Food, Travel, Education, Lifestyle) with avatars, follower tiers, engagement rates, authenticity scores, and demographic shares.
- **Pre-seeded Demo User**:
  - Email: `demo@creatorhunter.app`
  - Password: `Password123!`
  - Role: `OWNER`
- **Pre-seeded Admin User**:
  - Email: `admin@creatorhunter.app`
  - Password: `AdminPass123!`
  - Role: `ADMIN`

---

## 3. Run it

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

Open `http://localhost:5173`. `GET http://localhost:5000/api/health` returns `{"status":"ok"}`.

---

## 4. Automated checks & Test Suite (QA Track)

```bash
# 1. Run full backend automated test suite (32 tests across auth, services, and core CRUD)
cd backend && npm test

# 2. Run backend TypeScript typecheck (must be 0 errors)
cd backend && npm run typecheck

# 3. Run frontend TypeScript build (must be 0 errors)
cd ../frontend && npm run build

# 4. Run frontend linter
cd ../frontend && npm run lint
```

All automated test suites and typechecks pass with **100% clean exit codes (0 errors)**.

---

## 5. Manual UI walkthrough & Demo Script

Work through this in order — it exercises every layer of the platform:

1. **Authentication** (`/login` / `/register`)
   - Visit `/login`. Click **"Demo User (Owner)"** quick-fill button, then click **Sign in**.
   - Confirm redirect to `/dashboard`. Observe that the navigation bar now displays the user avatar, name (`Demo User`), and `OWNER` role badge.
   - Click **Sign out** to test session clearance, or register a new account on `/register`.
2. **Dashboard** (`/dashboard`)
   - Displays real-time aggregation tiles: Active Campaigns, Creators Discovered, Shortlisted, Outreach Sent, Replies.
3. **Discover** (`/creators`)
   - Natural language search box: enter `Find Indian fitness creators with 50K to 500K followers and engagement above 4%` → results render with calculated `% match` badges.
   - Structured filter sidebar: filter by category, platform, min/max followers, min engagement.
   - Compare bar: select 2–4 creators and click **Compare** → navigates to side-by-side comparison table (`/creators/compare`).
   - One-click shortlist: click **Shortlist** on any card.
4. **Creator Profile** (`/creators/:id`)
   - Detailed creator overview, audience demographics (gender split, age distribution, country breakdown), engagement metrics, authenticity risk score.
   - AI Analysis tab: click **"Why is this creator a good fit?"** to generate summary, strengths, weaknesses, and recommendation.
5. **Campaigns & Pipeline** (`/campaigns` → `/campaigns/new` → `/campaigns/:id`)
   - Create a campaign (e.g. `Gaming Laptop Launch`, Budget ₹10,00,000).
   - In Campaign Detail, search and add creators to the pipeline.
   - Click **Advance** to move candidates through stages: `DISCOVERED` → `SHORTLISTED` → `CONTACTED` → `REPLIED` → `NEGOTIATING` → `APPROVED` → `COMPLETED`.
   - Click **Export Pipeline CSV** to download the roster in spreadsheet format.
6. **AI Outreach** (inside Campaign Detail)
   - On a shortlisted creator, click **Outreach**.
   - Pick a channel (Instagram DM, Email, WhatsApp, LinkedIn) and click **Generate Outreach**.
   - Review personalized AI pitch, copy to clipboard, and click **Send & Mark Contacted**.
7. **Shortlists** (`/shortlists`)
   - Create custom shortlists (e.g. `Bangalore Tech Creators`).
   - Remove creators or click **Export to CSV** to export the shortlist.

---

## 6. API reference

Base URL: `http://localhost:5000/api`

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register user (`name, email, password, company, role`) → returns `{token, user}` |
| POST | `/auth/login` | Login user (`email, password`) → returns `{token, user}` |
| GET | `/auth/me` | Protected route returning authenticated user profile |
| GET | `/health` | Healthcheck (`{status:"ok"}`) |
| GET | `/creators` | List creators with filters & pagination |
| GET | `/creators/:id` | Get single creator intelligence profile |
| POST | `/search/creators` | AI-parsed & ranked creator discovery (`{query, campaign?}`) |
| POST | `/ai/parse-search` | Parse natural query into structured filters |
| POST | `/ai/creator-analysis` | Generate creator strengths/weaknesses summary |
| POST | `/ai/outreach` | Generate personalized multi-channel outreach draft |
| GET / POST | `/campaigns` | List and create campaigns |
| GET / PATCH / DELETE | `/campaigns/:id` | Campaign detail, update, and cascade delete |
| POST / PATCH | `/campaigns/:id/creators` | Add and update pipeline stages for campaign creators |
| GET / POST | `/shortlists` | List and create shortlists |
| POST / DELETE | `/shortlists/:id/creators` | Add and remove creators from shortlist |
| GET / POST / PATCH | `/outreach` | Track outreach messages, delivery, and replies |
