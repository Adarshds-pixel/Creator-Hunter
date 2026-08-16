# Creator Hunter — MVP Development Plan

## 1. Project Overview

**Creator Hunter** is an AI-powered creator (influencer) discovery and outreach platform that helps brands and agencies find, evaluate, and contact the right creators for a campaign — replacing manual searching across Instagram/YouTube, spreadsheet tracking, and guesswork outreach with a single AI-assisted workflow.

The full product vision (see project PRD) covers a large set of modules — campaign pipelines, CRM, billing, admin panel, team roles, third-party integrations, and more. For this MVP/prototype phase, the team is deliberately scoping down to **one complete, fully-functional AI-powered workflow**, built with real depth rather than many shallow features. This keeps the prototype focused, demonstrable end-to-end, and buildable by a 5-person team in parallel tracks.

## 2. Scope

### In scope — the core workflow
**AI Search + Match → AI Outreach**, one connected pipeline:

1. User submits a natural-language creator brief (e.g. *"Find Indian fitness creators with 20K–500K followers, at least 3% engagement, primarily male audience, Bangalore/Hyderabad, budget under ₹30,000"*)
2. Backend uses an LLM to extract structured search filters from the free text
3. Backend queries the creator database with those filters, applying a relaxation strategy if too few results match
4. Backend computes a deterministic **Match Score** and precomputed **Authenticity Score** per creator
5. Top creators receive an AI-generated **Creator Intelligence Summary**
6. Results render as a ranked, animated creator grid
7. User opens a full **Creator Profile** (audience demographics, score breakdowns, AI summary)
8. User **shortlists** creators of interest
9. From a shortlisted creator, user generates a personalized **AI Outreach message** (email / Instagram DM / WhatsApp)

This covers PRD modules: AI Creator Search, Creator Discovery, Creator Intelligence Profile, a lightweight Fake Engagement/Authenticity signal, AI Creator Matching, Shortlists, and AI Outreach.

### Out of scope (for this phase)
Campaign pipeline management, Creator CRM, billing/subscriptions, admin panel, team roles & permissions, notifications, third-party platform integrations (Instagram/YouTube API, Gmail, WhatsApp Business), creator comparison tool. These can be considered for a later phase once the core workflow is validated.

## 3. Technology Stack

**Frontend**
- React (Vite) — plain React, no Next.js
- Tailwind CSS — styling system
- shadcn/ui (Radix-based primitives, copied into the repo) — Button, Dialog, Tabs, Card, Input, Skeleton
- Framer Motion — page transitions and micro-interactions
- Recharts — audience demographic charts
- lucide-react — icon set
- @tanstack/react-query — server state, caching, loading/error handling
- react-hook-form + zod — form handling & validation
- axios + react-router-dom v6

**Backend**
- Node.js + Express.js — REST API
- Mongoose — MongoDB ODM
- JWT (jsonwebtoken) + bcryptjs — authentication
- @google/genai — official Gemini SDK (the older `@google/generative-ai` package is deprecated and must not be used)

**Database**
- MongoDB — MongoDB Atlas free-tier (M0) cluster recommended for reliability over a local mongod instance

**AI / LLM**
- **Google Gemini API** — `gemini-2.5-flash` model (free tier: 1,500 requests/day, 1M TPM). Chosen for its generous no-cost quota and strong structured-output (schema-constrained JSON) support, ideal for a prototype with no committed budget.
- Structured output enforced via `responseMimeType: "application/json"` + `responseSchema` — the LLM's output is schema-constrained, not parsed from free text.

**Tooling**
- concurrently — run client + server together in dev
- @faker-js/faker — synthetic seed data generation
- randomuser.me API — realistic profile photos for seeded creators

## 4. System Architecture

```
┌──────────────┐        REST/JSON (JWT auth)         ┌──────────────────┐
│   React SPA   │  ───────────────────────────────▶  │   Express API     │
│  (Vite, port  │  ◀───────────────────────────────  │  (Node, port 5000) │
│   5173)        │                                     └────────┬─────────┘
└──────────────┘                                               │
                                                                 │ Mongoose
                                        ┌────────────────────────┼────────────────────────┐
                                        │                                                  │
                              ┌─────────▼──────────┐                          ┌────────────▼──────────┐
                              │   MongoDB Atlas       │                          │   Google Gemini API     │
                              │ (Users, Creators,      │                          │ (filter extraction,     │
                              │  Shortlists,            │                          │  summaries, outreach     │
                              │  Outreach)               │                          │  generation)               │
                              └─────────────────────────┘                          └───────────────────────────┘
```

**Backend layering** (routes → controllers → services → models):
- **Routes**: define HTTP endpoints, attach auth middleware
- **Controllers**: parse requests, call services, shape responses — thin, no business logic
- **Services**: all business logic lives here — `aiService` (Gemini integration), `fallbackParser` (non-LLM backup), `scoringService` (Match/Authenticity formulas), `searchService` (query building + relaxation)
- **Models**: Mongoose schemas

This separation means the AI provider, the scoring algorithm, and the query logic are each independently testable and swappable without touching route/controller code.

**Frontend architecture**: page components under `pages/`, feature-scoped component folders (`search/`, `creator/`, `outreach/`), all server communication routed through react-query hooks (`useSearch`, `useCreator`, `useShortlist`) calling a single axios client with a JWT interceptor, and auth state held in a lightweight `AuthContext`.

## 5. Application Workflow (Request Flow)

1. **Search**: Client `POST /api/search {query}` → controller calls `aiService.extractSearchFilters(query)` (Gemini, schema-constrained JSON; falls back to `fallbackParser` on error/timeout) → `searchService` builds an indexed MongoDB query from the filters, applying the relaxation ladder if results are too sparse → `scoringService.computeMatchScore()` runs per candidate → results sorted by Match Score, top 30 returned with `relaxationApplied` metadata.
2. **Profile**: Client `GET /api/creators/:id` → returns full creator document including cached AI summary (or triggers `POST /api/creators/:id/summary` for an explicit live regenerate).
3. **Shortlist**: Client `POST/DELETE /api/shortlist/:creatorId` → upserts/removes a `Shortlist` document tied to the authenticated user.
4. **Outreach**: Client `POST /api/outreach {creatorId, channel, campaignContext}` → `aiService.generateOutreachMessage()` (Gemini, schema-constrained; falls back to a template on error) → upserted into `Outreach`, returned to client; cached per (user, creator, channel) so reopening the modal doesn't regenerate.

## 6. Data Models (Mongoose)

**User**: `name`, `email` (unique), `passwordHash` (bcrypt, `select: false`), timestamps.

**Creator** (central schema):
```
name, handle, platform (Instagram | YouTube | Both), category (12-value enum),
profileImageUrl, bio, country (default "India"), city,
followerCount, engagementRate, avgLikes, avgComments, avgViews,
audienceGenderSplit {male, female, other},
audienceAgeSplit {13-17, 18-24, 25-34, 35-44, 45+},
audienceTopCountries [{country, percentage}],
pricing {postPrice, storyPrice, reelPrice, currency},
contact {email, instagramDm, whatsapp},
authenticitySignals {engagementConsistency, growthPatternScore, audienceQualityScore},
authenticityScore,        // computed from signals — see §8
aiSummary {text, generatedAt, sourceHash}
```
Compound index: `{category, country, followerCount}`.

**Shortlist**: `userId`, `creatorId`, `notes`. Unique compound index `{userId, creatorId}`. Modeled as its own collection (not an array on User) so lookups stay indexed and independent of document size.

**Outreach**: `userId`, `creatorId`, `channel` (email | instagram_dm | whatsapp), `campaignContext {brandName, productDescription, goal}`, `subject`, `message`, `edited`. Unique compound index `{userId, creatorId, channel}` — one current draft per channel, upserted on regenerate.

## 7. API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Create user, return JWT |
| POST | `/api/auth/login` | No | Verify credentials, return JWT |
| GET | `/api/auth/me` | Yes | Current user from JWT |
| POST | `/api/search` | Yes | NL query → filters → scored/ranked results |
| GET | `/api/creators/:id` | Yes | Full profile incl. cached AI summary |
| POST | `/api/creators/:id/summary` | Yes | Explicit regenerate (live Gemini call) |
| GET / POST / DELETE | `/api/shortlist[/:creatorId]` | Yes | List / add / remove |
| POST | `/api/outreach` | Yes | Generate or reuse outreach draft |
| GET | `/api/outreach/:creatorId` | Yes | Fetch cached drafts for all channels |
| PATCH | `/api/outreach/:id` | Yes | Save manual edit to a draft |

## 8. Core Algorithms

Weights are centralized as named constants in `server/src/config/scoringWeights.js` — no inline magic numbers. Every score function returns `{score, breakdown}` for transparency in the UI.

**Authenticity Score** (computed once at seed/update time, from raw signals — not hand-entered):
```
engagementPlausibility = how closely engagementRate matches the expected band
                          for the creator's follower tier (nano/micro/mid/macro)

authenticityScore =
  0.40 * engagementPlausibility +
  0.20 * engagementConsistency +
  0.20 * growthPatternScore +
  0.20 * audienceQualityScore
```

**Match Score** (computed per search, per candidate, in application code):
```
weights: engagement 0.25, audienceGender 0.15, location 0.15, budget 0.20, authenticity 0.25

engagementScore      = creator's engagementRate vs. the filter's minimum, scaled 0-100
audienceGenderScore  = creator's matching-gender % vs. requested threshold, scaled 0-100
locationScore        = 100 (city match) / 70 (country match only) / 20 (no match)
budgetScore          = 100 well under budget, sliding down through budget, sharp penalty over
authenticity         = creator.authenticityScore (precomputed)

matchScore = weighted sum, rounded, clamped 0–100
```
Unspecified filter fields use a neutral default (60–70) rather than zeroing that component out.

**Query relaxation ladder** (triggers when results < 8): (1) expand follower range ±20% → (2) drop city, keep country → (3) lower engagement minimum toward a 1% floor → (4) raise budget tolerance +15% → (5) demote audience gender from a hard filter to a scoring-only factor. The applied steps are returned to the client so the UI can explain why results were broadened.

**Design rationale**: scoring runs as a JavaScript reduce over a bounded, indexed-query candidate pool (~200 docs) rather than a MongoDB aggregation pipeline or a per-creator LLM call — simpler to test, debug, and reason about, with no meaningful performance cost at this data scale.

## 9. AI Integration (`server/src/services/aiService.js`)

Three functions, one clean interface, provider-swappable:

- **`extractSearchFilters(text)`** — Gemini call with `responseSchema` enforcing a fixed JSON shape (platform, category, country, city[], followerMin/Max, engagementMin, audienceGender, budgetMax, keywords[]). Prompt instructs default country "India", category restricted to the fixed 12-value enum, and phrase-to-number conversion for follower/engagement/budget ranges.
- **`generateCreatorSummary(creator)`** — plain-text prompt producing a 60–90 word professional summary (niche, standout stat, audience composition, authenticity note). Cached on `Creator.aiSummary` with a `sourceHash` for invalidation; regenerated only on explicit request or for newly-surfaced creators, never batch-run across the full dataset.
- **`generateOutreachMessage({creator, campaignContext, channel})`** — `responseSchema`-enforced `{subject?, message}`; tone and length vary by channel (email = subject + short CTA body; DM/WhatsApp = 2–3 casual sentences).

**Reliability**: every call is wrapped with an 8–10s timeout and try/catch. On failure:
- Filter extraction → `fallbackParser.js`, a regex/keyword-based extractor producing the same output shape
- Summary/outreach → deterministic string templates built from raw creator/campaign fields

Every AI-powered feature therefore has a non-LLM deterministic fallback, so a rate limit or connectivity issue never breaks the workflow.

## 10. Seed Data Strategy

- **200 creators**, generated with `@faker-js/faker` plus weighted constant tables (not pure random) for realistic distribution: platform mix (IG 55% / YouTube 25% / Both 20%), 12 weighted categories, India-city-weighted locations, follower tiers on a long-tail curve (nano 30%, micro 35%, mid 25%, macro 8%, mega 2%), engagement rates generated from the same tier bands the scoring service uses.
- **Authenticity signal distribution**: ~80% clean signals, ~15% one anomaly, ~5% multiple anomalies — produces a believable score spread instead of every creator scoring 90+.
- **Photos**: `randomuser.me` API, hot-linked URLs (mostly Indian nationality, some international mix).
- **Pricing**: derived from follower count × category multiplier × randomized noise.
- `seedCreators.js` imports the real `computeAuthenticityScore()` from `scoringService.js` (not a duplicate), so seeded scores are genuinely computed, not faked. Run via `npm run seed`. An optional `--with-summaries` flag pre-generates cached AI summaries for a small set of featured creators.

## 11. Frontend Pages & Components

**Design direction**: modern, dark-mode-first AI-product aesthetic — gradient hero (purple/blue/pink), glass-surface cards, Framer Motion transitions and micro-interactions, staged loading states (not plain spinners), real Recharts data visualization for audience demographics.

**Pages**: `LandingPage` (product pitch, animated hero, feature highlights), `LoginPage` / `RegisterPage` (glass-card forms), `SearchPage` (natural-language input → `StagedAILoader` → editable `FilterChipBar` + relaxation banner → animated `CreatorGrid`), `CreatorProfilePage` (`ScoreGauge` for Match/Authenticity with breakdown on hover, `AudienceCharts`, pricing, AI summary panel, shortlist toggle, outreach entry point), `ShortlistPage`, `OutreachModal` (campaign context form → `ChannelTabs` → editable draft with Copy/Regenerate).

**`StagedAILoader`**: since search is a single API call, the "Understanding your request → Searching database → Ranking creators" sequence is staged client-side with a minimum visible duration per step, while the real request runs underneath — communicates the AI pipeline's multiple stages without needing streaming/SSE infrastructure.

## 12. Repository Structure

```
creator-hunter/
├── package.json                  # root dev script (concurrently client+server)
├── Adarsh Plan.md                # this document
├── README.md
├── client/                       # Vite + React
│   └── src/
│       ├── pages/
│       ├── components/{ui,layout,search,creator,outreach}/
│       ├── context/AuthContext.jsx
│       ├── hooks/                # useSearch, useCreator, useShortlist
│       └── lib/                  # apiClient.js, format.js
└── server/                       # Express + Mongoose
    └── src/
        ├── server.js / app.js
        ├── config/                # db.js, scoringWeights.js, categories.js, cities.js
        ├── models/                # User, Creator, Shortlist, Outreach
        ├── routes/ + controllers/
        ├── services/              # aiService, fallbackParser, scoringService, searchService
        ├── middleware/            # auth.middleware.js, errorHandler.js
        ├── seed/                  # generateCreator.js, seedCreators.js, data/
        └── scripts/               # testScoring.js, testGemini.js
```

## 13. Team & Task Division (5 Members)

Work is organized into 5 parallel tracks, one owned per team member, so the team can build simultaneously rather than sequentially. Each owner is responsible for their module end-to-end (implementation + basic verification) and coordinates with adjacent tracks at integration points.

| Member | Title | Responsibilities | Key Deliverables |
|---|---|---|---|
| **Kiran** | **Backend Developer** | Express app setup, all Mongoose schemas, JWT auth (register/login/me), password hashing, auth middleware, error handling, seed data generation script | `models/`, `routes/auth.routes.js`, `middleware/auth.middleware.js`, `seed/` |
| **Adarsh** | **AI/ML Engineer** | Gemini API integration (`aiService.js`), prompt design for all 3 AI calls, `fallbackParser.js`, Match Score & Authenticity Score algorithm design and implementation, query relaxation ladder | `services/aiService.js`, `services/fallbackParser.js`, `services/scoringService.js`, `services/searchService.js` |
| **Akshay** | **Frontend Developer — UI/UX & Search** | Vite/Tailwind project setup, design system (colors, typography, shadcn primitives), Landing page, Auth pages, Search page, `StagedAILoader`, `FilterChipBar`, `CreatorGrid`/`CreatorCard` | `pages/LandingPage`, `pages/SearchPage`, `components/search/`, `components/creator/CreatorCard.jsx` |
| **Vishwaradhya** | **Frontend Developer — Data Visualization** | Creator Profile page, `ScoreGauge`, `AudienceCharts` (Recharts), Shortlist page, react-query hooks, axios client + JWT interceptor | `pages/CreatorProfilePage`, `pages/ShortlistPage`, `hooks/`, `lib/apiClient.js` |
| **Abhiram** | **QA & Integration Engineer** | Outreach modal, channel tabs, campaign context form, end-to-end integration across all tracks, responsive/polish pass, Postman/Thunder Client collection, README & documentation | `components/outreach/`, integration fixes, `README.md`, API test collection |

*Assignments above are a suggested starting point sized for even workload — the team can freely reassign based on individual interest or skill.*

Kiran and Adarsh form the backend pair and should sync on the `Creator` schema shape early (Adarsh's scoring functions depend on the fields Kiran defines). Akshay, Vishwaradhya, and Abhiram form the frontend group and should agree on the shared design system and API contract (from §7) before diverging into their own pages.

## 14. Development Phases

**Phase 1 — Setup & Foundation**
All members scaffold in parallel: Kiran sets up Express + MongoDB Atlas connection; Adarsh obtains a Gemini API key and drafts prompt schemas; Akshay, Vishwaradhya, and Abhiram set up the Vite client, Tailwind config, routing, and shared design tokens/components.

**Phase 2 — Core Feature Development**
Each member builds their owned module against the agreed API contract, using mock/stub data where a dependency isn't ready yet:
- Kiran: schemas, auth, seed script (target: 200 creators seeded with computed authenticity scores)
- Adarsh: `aiService` + `fallbackParser` + `scoringService`/`searchService`, verified via `testGemini.js` / `testScoring.js`
- Akshay: Landing, Auth pages, Search page + staged loader (against mock search responses)
- Vishwaradhya: Profile page + charts, Shortlist page (against mock creator data)
- Abhiram: Outreach modal (against mock outreach responses)

**Phase 3 — Integration**
Replace mocks with real API calls end-to-end; Abhiram leads integration testing across the full workflow (search → profile → shortlist → outreach).

**Phase 4 — Testing, Polish & Documentation**
Responsive pass (desktop/tablet/mobile breakpoints), empty/error states, loading-state timing, scoring smoke tests, Gemini fallback verification (test with the API key intentionally disabled), final README with setup instructions and architecture overview.

## 15. Verification & QA Checklist

- **Scoring smoke tests** (`server/src/scripts/testScoring.js`): hand-picked cases asserting score ranges (e.g. in-budget + city match + high engagement → >85; 3x over-budget → <40 regardless of other factors)
- **Gemini reliability test** (`server/src/scripts/testGemini.js`): run filter extraction against several example briefs; then disable `GEMINI_API_KEY` and confirm `fallbackParser` returns a structurally valid result instead of throwing
- **API collection**: one example request per endpoint, checked into `server/`, used for manual QA
- **Per-member acceptance**: each member's deliverables should be independently testable before integration (e.g. Kiran's seed script produces sane data; Adarsh's `/api/search` returns sorted, sane-looking scores via Postman)
- **Final QA pass**: responsive breakpoints, dark-mode contrast, all loading states visible ≥300ms, relaxation ladder triggers and displays correctly on a narrow filter set

## 16. Key Files Reference

- `server/src/services/scoringService.js` — Match Score / Authenticity Score formulas
- `server/src/services/aiService.js` — Gemini integration boundary
- `server/src/services/fallbackParser.js` — non-LLM fallback logic
- `server/src/seed/seedCreators.js` + `generateCreator.js` — the 200-creator dataset
- `server/src/models/Creator.js` — schema anchoring search, scoring, profile, and outreach
- `client/src/components/search/StagedAILoader.jsx` — visual centerpiece of the search experience
