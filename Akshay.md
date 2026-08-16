# Creator Hunter — Prototype Plan (Due Wednesday, Aug 19, 2026)

Team (all equal roles ): Akshay (AI search & outreach + pricing page), Adarsh (design system & dashboard), Kiran (discovery & profile), Vishwa (shortlist & comparison), Abhiram (campaigns & outreach tracking)

This is **not** the full PRD — it's the trimmed set of features we can realistically build and demo by Wednesday, split 5 ways.

---

## 1. Tech Stack (fast + looks good)

- **Framework:** Next.js (App Router) + React
- **Styling/UI:** Tailwind CSS + shadcn/ui (pre-built polished components — cards, tabs, dialogs, tables, badges)
- **Icons:** lucide-react
- **State:** React Context (shortlist, campaigns, outreach status shared across pages)
- **Data:** Mock JSON dataset (`/data/creators.json`, ~80-100 fake creators), no real backend/DB. Edits (shortlist, pipeline stage, outreach status) persist to `localStorage` so the demo feels real.
- **AI:** Claude/OpenAI API called from a Next.js API route (key stays server-side), used for:
  1. Parsing a natural-language search query into filters
  2. Generating a personalized outreach message
  Each has a canned-template fallback in case the live API call fails during the demo.
- **Deploy:** Vercel, so there's a shareable link for the demo instead of running locally.

---

## 2. The 11 Features We're Building

1. Landing / login (simple, mock auth is fine)
2. Dashboard (stats + quick actions)
3. AI Creator Search (natural language → filtered results)
4. Creator Discovery grid (Creator Card component)
5. Creator Profile page (audience, engagement, authenticity, AI summary)
6. Shortlists (create list, add/remove/notes)
7. Creator Comparison (2-3 creators side by side + AI recommendation line)
8. Campaign creation + pipeline (Discovered → Shortlisted → Contacted → ... → Completed)
9. AI Outreach message generator
10. Outreach tracking (contacted/replied/interested/rejected)
11. Pricing / Plans page (Free / Pro / Agency / Enterprise cards — static display only, no real checkout or payment processing)

Everything else in the PRD (CRM, real billing/checkout logic, admin panel, integrations, fraud detection ML, team roles, mobile app) is out of scope for Wednesday.

---

## 3. Who Owns What

### Akshay — AI Search, Outreach & Pricing Page
- Set up the mock data schema (`creators.json`, `campaigns.json`, `outreach.json`) since the AI features consume it directly
- Build the two AI API routes: search-query parser, outreach message generator (+ fallback templates)
- Own **Feature 3 (AI Search)**, **Feature 9 (AI Outreach Generator)**, and **Feature 11 (Pricing/Plans page)**

### Adarsh — Design system, Landing, Dashboard
- Own the visual design system: colors, fonts, spacing, shadcn/ui theme config (see Section 5) — everyone else's screens plug into this
- Build the shared Navbar/Sidebar layout shell used by every page
- **Feature 1 (Landing/Login)** + **Feature 2 (Dashboard)**

### Kiran — Discovery & Profile
- Build the reusable **Creator Card** component (photo, name, platform, followers, engagement, score, actions) — this gets reused by Vishwa in shortlist/comparison, so agree on its props with Vishwa on Day 0
- **Feature 4 (Discovery grid)** + **Feature 5 (Creator Profile page)**

### Vishwa — Shortlists & Comparison
- **Feature 6 (Shortlists)** + **Feature 7 (Creator Comparison)**
- Depends on Kiran's Creator Card component — sync early

### Abhiram — Campaigns & Outreach Tracking
- **Feature 8 (Campaign creation + pipeline board)** + **Feature 10 (Outreach tracking)**

### Shared (everyone)
- Everyone merges their own branch into `main` themselves — no single person is responsible for resolving everyone else's conflicts
- Repo setup, Vercel deployment, and demo-script rehearsal happen together as a team on Wednesday morning

---

## 4. Timeline

**Today, Sun Aug 16 (setup):**
- Akshay: scaffold repo, push to GitHub, data schema ready first since every other screen builds against it
- Everyone: agree on Creator Card props + data shape, set up local dev env

**Mon Aug 17:**
- Adarsh: design system + Navbar/Sidebar shell + Dashboard + Landing skeleton
- Kiran: Creator Card + Discovery grid (static data)
- Vishwa: Shortlist page skeleton (CRUD against localStorage)
- Abhiram: Campaign creation form + pipeline board skeleton
- Akshay: mock data loader wired up, first working AI API call, Pricing page skeleton

**Tue Aug 18:**
- Everyone wires up real interactivity: search → filtered results, add-to-shortlist from cards, comparison selection, drag/move pipeline stages, "generate outreach" button
- Akshay: finish both AI features, plug into Kiran's discovery page and Abhiram's outreach flow, finish Pricing page
- Evening: integration checkpoint — everyone merges their branch into `main` together

**Wed Aug 19 (due day):**
- Morning: bug bash, check mobile/responsive layout, loading & empty states, visual consistency pass
- Team deploys to Vercel together, rehearses the demo walkthrough (Section 6)
- Submit

---

## 5. Design Direction ("beautiful, attractive" frontend)

- **Palette:** indigo/violet primary (`#6366F1`), teal/emerald accent for good scores, amber/red for risk — neutral slate grays for backgrounds/text
- **Typography:** Inter or Poppins, clear size hierarchy
- **Components:** rounded-2xl cards, soft shadows, subtle hover elevation, gradient CTA buttons, authenticity/match scores shown as circular progress rings or colored pills
- **Motion:** light Framer Motion fade/slide on page load and card hover — subtle, not flashy
- **Consistency rule:** everyone builds with shadcn/ui primitives (Card, Badge, Button, Tabs, Dialog, Table) and Adarsh's shared theme tokens. No one hand-rolls a competing button/card style — this is what keeps 5 people's screens looking like one product.

---

## 6. Demo Walkthrough (rehearse this Wednesday morning)

Dashboard → AI Search ("Find Indian fitness creators, 20K-500K followers, Bangalore") → Results grid → Open a Creator Profile → Add to Shortlist → Compare 2-3 shortlisted creators → Create a Campaign → Generate an AI outreach message for a creator → Move them through the pipeline → Show outreach tracking status → View pricing plans.
