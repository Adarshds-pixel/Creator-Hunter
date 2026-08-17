# Creator Hunter — Setup & Testing Manual

Covers everything built in the Hours 4-12 core-build pass: backend CRUD for
creators/campaigns/shortlists/outreach, the seed dataset, and the wired-up
Search & Discovery / Creator Intelligence / Campaigns & Outreach UI.

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
# GEMINI_API_KEY is optional — leave it blank to use the built-in keyword
# fallback for search/analysis/outreach, or set it to use real Gemini calls.
npm install

# 3. Frontend env — no required vars, Vite proxies /api to localhost:5000
cd ../frontend
npm install
```

## 2. Seed the database

```bash
cd backend
npm run seed
```

This clears and repopulates the `Creator` collection with ~400 varied fake
creators (10 categories, 8 Indian cities + US/UK/UAE locations, 3 platforms,
realistic follower/engagement/authenticity spread — not uniformly excellent),
and upserts one demo user (`demo@creatorhunter.app`) that shortlists attach to
since there's no login yet.

Re-run any time you want a fresh dataset — it's idempotent (clears first).

## 3. Run it

```bash
# terminal 1
cd backend && npm run dev      # http://localhost:5000

# terminal 2
cd frontend && npm run dev     # http://localhost:5173
```

Open `http://localhost:5173`. `GET http://localhost:5000/api/health` should
return `{"status":"ok"}`.

## 4. Automated checks (run these before any demo)

```bash
cd backend && npm run typecheck   # tsc --noEmit, must be clean
cd frontend && npm run build      # tsc -b && vite build, must be clean
cd frontend && npm run lint       # oxlint — 3 known exhaustive-deps warnings, no errors (see §7)
```

All three currently pass clean (warnings noted in §7 are expected, not bugs).

## 5. Manual UI walkthrough

Work through this in order — it mirrors the intended demo flow and exercises
every piece that was built.

1. **Dashboard** (`/dashboard`) — five stat tiles should show real numbers
   once you've created data below (Active Campaigns, Creators Discovered,
   Shortlisted, Outreach Sent, Replies). Right after a fresh seed, expect
   `Creators Discovered: 400` and everything else `0`.
2. **Discover** (`/creators`)
   - Search box: try `Find Indian fitness creators with 50K to 500K
     followers and engagement above 4%` — results should render, each with
     a `% match` badge.
   - Filters panel: pick a category/country/platform and click **Apply
     Filters** — a separate, unranked result set should replace the grid
     (no match-score badge, since it's not AI-ranked).
   - Check 2-4 creator checkboxes → a "Compare" bar appears → click
     **Compare** → lands on `/creators/compare?ids=...` with a comparison
     table.
   - Click **Shortlist** on a card → button flips to "Added". Confirm on
     `/shortlists` that a "My Shortlist" entry now contains that creator.
   - Click **View profile** on any card.
3. **Creator Profile** (`/creators/:id`)
   - Overview / Audience / Engagement / Authenticity tabs should all show
     real numbers (no more "placeholder" text).
   - AI Analysis tab → click **Why is this creator a good fit?** → summary/
     strengths/weaknesses/recommendation render.
   - **Add to shortlist** button in the header works the same as the card.
4. **Campaigns** (`/campaigns/new` → `/campaigns` → `/campaigns/:id`)
   - Create a campaign (name is the only required field).
   - You're redirected to its detail page. Use the **Add creators to this
     campaign** search box (type a category name) → **Add** a couple of
     results → they appear in the `DISCOVERED` column.
   - Click **Advance** repeatedly to move a creator through
     DISCOVERED → SHORTLISTED → CONTACTED → ... → COMPLETED.
   - Once a creator is in `SHORTLISTED`, an **Outreach** button appears →
     click it → the Outreach panel mounts below the board.
5. **Outreach** (inline panel on Campaign Detail)
   - **Generate Outreach** → drafts a message.
   - **Send & Mark Contacted** → persists it, moves status to `CONTACTED`,
     shows status-transition buttons (Mark Replied / Interested / etc).
6. **Shortlists** (`/shortlists`)
   - Create a new named shortlist via the form.
   - Remove a creator from any shortlist via **Remove**.
7. Go back to **Dashboard** — all five tiles should now be non-zero.

## 6. API reference (for direct curl/Postman testing)

Base URL: `http://localhost:5000/api`

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | `{status:"ok"}` |
| GET | `/creators?category=&country=&city=&platform=&minFollowers=&maxFollowers=&minEngagement=&page=&limit=` | `{creators, total}` |
| GET | `/creators/:id` | 404 if missing |
| POST | `/creators` | body: `{name, username, platform, category, ...}` |
| POST | `/search/creators` | body: `{query, campaign?}` — AI-parsed + ranked |
| POST | `/ai/parse-search` | body: `{query}` — filters only, no DB query |
| POST | `/ai/creator-analysis` | body: `{creatorId, campaign?}` |
| POST | `/ai/outreach` | body: `{creatorId, campaign?, channel}` — drafts only, doesn't persist |
| GET | `/campaigns?status=` | list |
| POST | `/campaigns` | body: `{name, ...}` — name is the only required field |
| GET | `/campaigns/:id` | enriched: `{...campaign, creators: CampaignCreator[]}`, each with a merged `creator` object |
| PATCH | `/campaigns/:id` | partial update |
| DELETE | `/campaigns/:id` | cascades: also deletes its CampaignCreator rows |
| POST | `/campaigns/:id/creators` | body: `{creatorId, matchScore?, status?}` — re-adding an existing creator updates it instead of erroring |
| PATCH | `/campaigns/:id/creators/:creatorId` | body: `{status?, notes?}` |
| GET | `/shortlists` | list (no auth, so this is everyone's) |
| POST | `/shortlists` | body: `{name, userId?}` — falls back to the seeded demo user if `userId` omitted |
| POST | `/shortlists/:id/creators` | body: `{creatorId, notes?}` — deduped by creatorId |
| DELETE | `/shortlists/:id/creators/:creatorId` | |
| GET | `/outreach?campaignId=&status=` | list |
| POST | `/outreach` | body: `{campaignId, creatorId, channel, message, status?}` — sets `sentAt` if created as `CONTACTED` |
| PATCH | `/outreach/:id` | body: `{status}` — auto-sets `sentAt`/`repliedAt` on the relevant transitions |

Example — the milestone query:

```bash
curl -X POST http://localhost:5000/api/search/creators \
  -H "Content-Type: application/json" \
  -d '{"query":"Find Indian fitness creators with 50K to 500K followers and engagement above 4%"}'
```

## 7. What was actually tested (this pass)

- **Typecheck/build/lint**: server `tsc --noEmit` clean; client `tsc -b && vite build` clean;
  client `oxlint` clean except 3 `exhaustive-deps` warnings (not errors) in
  `CreatorCompare.tsx`, `Shortlists.tsx`, `CampaignDetail.tsx` — each is a
  `useEffect` intentionally keyed on a primitive id/string rather than the
  full derived array/function, which is the correct pattern here, not a bug.
- **Every endpoint above** exercised directly via curl: successful paths,
  404s on missing documents, 400s on failed validation (missing required
  fields, invalid enum values), and the cascade delete (deleting a campaign
  removes its `CampaignCreator` rows — verified by direct collection count).
- **Fallback NL parser** (`fallbackParseSearch`, used when `GEMINI_API_KEY`
  is unset) checked against varied phrasings: category+city+platform+range
  ("Beauty influencers in Mumbai on Instagram under 50k followers"),
  "between X and Y", "above N%", platform-only queries — all correctly
  extracted.
- **Database state** confirmed clean after testing: 400 seeded creators, 1
  demo user, 0 leftover test campaigns/shortlists/outreach.
- **Not tested this pass** (no browser automation available in this
  session): actual clicking-through of the React UI. Section 5 above is a
  step-by-step script for you to do that manually — everything it exercises
  is backed by API calls already confirmed working, but the UI rendering,
  state transitions, and click handlers themselves haven't been visually
  verified.

## 8. Known limitations (by design, not bugs)

- No authentication — every route is open, shortlists aren't scoped to a
  real logged-in user (they all share the seeded demo user).
- `GEMINI_API_KEY` is blank by default — search/analysis/outreach run on
  the keyword-fallback path, not real Gemini output, until you set it.
- `GET /creators/:id` with a malformed (non-ObjectId) id returns `500`, not
  `400` — matches the minimal error handling already used elsewhere in the
  codebase (`search.ts`, `ai.ts`), not a regression.
