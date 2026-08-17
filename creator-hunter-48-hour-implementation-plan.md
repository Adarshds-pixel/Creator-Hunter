# Creator Hunter — 48-Hour Implementation Plan

## 1. Objective

Build a real, working vertical-slice MVP in 48 hours for a 5-person team.

### Core demo flow

```text
Create Campaign
      ↓
Natural Language Campaign Brief
      ↓
AI Extracts Requirements
      ↓
Search Creator Database
      ↓
Filter + Rank Creators
      ↓
Creator Profile & Analytics
      ↓
Compare Creators
      ↓
Shortlist
      ↓
Add to Campaign
      ↓
AI Personalized Outreach
      ↓
Track Outreach Status
      ↓
Campaign Pipeline
```

> Important: Since the team does not have Meta API access, do not make live Instagram scraping a dependency. Use a legitimately obtained/seeded creator dataset and design the data-ingestion layer so Instagram/other providers can be added later.

---

# 2. Recommended Stack

### Frontend + Backend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Database

- PostgreSQL
- Prisma ORM

### AI

- LLM API
- Structured JSON output

### Authentication

- Simple email/password authentication for MVP

### Deployment

- Vercel
- Managed PostgreSQL

### Don't use for this demo

- NestJS
- Redis
- Elasticsearch/OpenSearch
- Kafka
- RabbitMQ
- Kubernetes
- Microservices
- React Native
- Complex ML infrastructure

---

# 3. Team Division

| Developer | Responsibility |
|---|---|
| Developer 1 | Frontend |
| Developer 2 | Backend + Database |
| Developer 3 | AI |
| Developer 4 | Ranking + Analytics |
| Developer 5 | Data + Integration + QA |

---

# 4. Developer 1 — Frontend

## Owns

- Dashboard
- Creator search
- Filters
- Creator cards
- Creator profile
- Creator comparison
- Shortlists
- Campaign UI
- Outreach UI

---

# 5. Developer 2 — Backend + Database

## Owns

- Prisma
- PostgreSQL
- Database schema
- API routes
- Creator APIs
- Search APIs
- Campaign APIs
- Shortlist APIs
- Outreach APIs

---

# 6. Developer 3 — AI

## Owns

- Natural language → structured filters
- Creator AI analysis
- Campaign matching explanation
- AI recommendation
- Personalized outreach generation

---

# 7. Developer 4 — Ranking + Analytics

## Owns

- Creator score
- Campaign match score
- Engagement calculations
- Audience analysis
- Analytics calculations
- Charts/data aggregation

---

# 8. Developer 5 — Data + Integration + QA

## Owns

- Creator dataset
- Data ingestion
- Authentication
- Frontend/backend integration
- End-to-end testing
- Deployment
- Demo preparation
- Bug fixing

---

# 9. Folder Structure

```text
creator-hunter/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── dashboard/
│   │
│   ├── campaigns/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── creators/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── compare/
│   │       └── page.tsx
│   │
│   ├── shortlists/
│   │   └── page.tsx
│   │
│   └── api/
│       ├── creators/
│       ├── search/
│       ├── campaigns/
│       ├── shortlists/
│       ├── outreach/
│       └── ai/
│
├── components/
│   ├── dashboard/
│   ├── creators/
│   ├── campaigns/
│   ├── search/
│   ├── outreach/
│   └── ui/
│
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── ai.ts
│   ├── ranking.ts
│   ├── search.ts
│   └── validation.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── types/
│   ├── creator.ts
│   ├── campaign.ts
│   └── search.ts
│
├── public/
│
├── .env
├── package.json
└── README.md
```

---

# 10. Database Schema

## User

```text
User
----
id
name
email
passwordHash
company
role
createdAt
updatedAt
```

Roles:

```text
OWNER
ADMIN
CAMPAIGN_MANAGER
RESEARCHER
VIEWER
```

---

## Creator

```text
Creator
-------
id
name
username
platform
profileUrl
profileImage
bio

category
location
country
city
languages

followers
following
posts

avgLikes
avgComments
avgViews
engagementRate

audienceMale
audienceFemale

age18_24
age25_34
age35_44
age45Plus

audienceIndia
audienceUSA
audienceUAE
audienceUK
audienceOther

growthRate
estimatedCost

authenticityScore
audienceQualityScore

source
sourceId
lastSyncedAt

createdAt
updatedAt
```

---

# 11. Campaign

```text
Campaign
--------
id
name
brand
product
description

budget

targetCountry
targetCity
targetCategory

minFollowers
maxFollowers
minEngagement

targetAgeMin
targetAgeMax
targetGender

platform

startDate
endDate

status

createdById

createdAt
updatedAt
```

---

# 12. CampaignCreator

```text
CampaignCreator
---------------
id
campaignId
creatorId

matchScore

status

notes

createdAt
updatedAt
```

Statuses:

```text
DISCOVERED
SHORTLISTED
CONTACTED
REPLIED
NEGOTIATING
APPROVED
CONTENT_SUBMITTED
COMPLETED
REJECTED
```

---

# 13. Shortlist

```text
Shortlist
---------
id
name
userId
createdAt
```

```text
ShortlistCreator
----------------
id
shortlistId
creatorId
notes
createdAt
```

---

# 14. Outreach

```text
Outreach
--------
id
campaignId
creatorId

channel

message

status

sentAt
repliedAt

createdAt
updatedAt
```

Channels:

```text
INSTAGRAM
EMAIL
WHATSAPP
LINKEDIN
```

Statuses:

```text
DRAFT
CONTACTED
REPLIED
INTERESTED
NEGOTIATING
REJECTED
NO_RESPONSE
```

---

# 15. API Structure

## Creator APIs

```http
GET    /api/creators
GET    /api/creators/:id
POST   /api/creators
```

---

## Search API

```http
POST /api/search/creators
```

Example request:

```json
{
  "query": "Find Indian fitness creators with 50K to 500K followers and engagement above 4%"
}
```

Example response:

```json
{
  "filters": {
    "category": "fitness",
    "country": "India",
    "minFollowers": 50000,
    "maxFollowers": 500000,
    "minEngagement": 4
  },
  "results": []
}
```

---

# 16. AI APIs

## Parse Search

```http
POST /api/ai/parse-search
```

Input:

```json
{
  "query": "Find Indian gaming creators above 100K followers"
}
```

Output:

```json
{
  "category": "gaming",
  "country": "India",
  "minFollowers": 100000
}
```

---

## Creator Analysis

```http
POST /api/ai/creator-analysis
```

Input:

```json
{
  "creatorId": "creator_id"
}
```

Output:

```json
{
  "summary": "Strong fit for Indian technology campaigns.",
  "strengths": [
    "High engagement",
    "Strong Indian audience"
  ],
  "weaknesses": [
    "Higher estimated pricing"
  ],
  "recommendation": "Recommended"
}
```

---

## Outreach Generation

```http
POST /api/ai/outreach
```

Input:

```json
{
  "creatorId": "creator_id",
  "campaignId": "campaign_id",
  "channel": "INSTAGRAM"
}
```

Output:

```json
{
  "message": "Hi Rahul, we've been following your recent gaming content..."
}
```

---

# 17. Campaign APIs

```http
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/:id
PATCH  /api/campaigns/:id
DELETE /api/campaigns/:id
```

Add creator:

```http
POST /api/campaigns/:id/creators
```

Update creator status:

```http
PATCH /api/campaigns/:id/creators/:creatorId
```

---

# 18. Shortlist APIs

```http
GET    /api/shortlists
POST   /api/shortlists

POST   /api/shortlists/:id/creators
DELETE /api/shortlists/:id/creators/:creatorId
```

---

# 19. Outreach APIs

```http
GET   /api/outreach
POST  /api/outreach
PATCH /api/outreach/:id
```

Example:

```http
PATCH /api/outreach/123
```

```json
{
  "status": "CONTACTED"
}
```

---

# 20. Ranking Algorithm

Don't let the LLM determine the numerical ranking.

Use a deterministic algorithm.

```text
Match Score =

Audience Fit       × 0.30
Engagement         × 0.20
Content Relevance  × 0.20
Location Fit       × 0.10
Follower Fit       × 0.10
Price Fit          × 0.10
```

Example:

```text
Audience Fit       94
Engagement         88
Content Relevance  97
Location Fit       100
Follower Fit       91
Price Fit          85
```

Result:

```text
Match Score: 93.4
```

---

# 21. AI Search Architecture

```text
User
 │
 │ "Find Indian fitness creators..."
 ▼
LLM
 │
 │ Structured filters
 ▼
Validation
 │
 ▼
PostgreSQL
 │
 ▼
Ranking Algorithm
 │
 ▼
Top Creators
```

The LLM understands the request.

PostgreSQL determines what creators match.

Your ranking algorithm determines their order.

---

# 22. Creator Dataset

Prepare approximately:

```text
500–1,000 creators
```

Categories:

```text
Fitness
Gaming
Technology
Beauty
Fashion
Finance
Food
Travel
Education
Lifestyle
```

Locations:

```text
Bangalore
Mumbai
Delhi
Hyderabad
Chennai
Pune
Kolkata
Ahmedabad
```

Platforms:

```text
Instagram
YouTube
LinkedIn
```

Make the data varied.

Don't make every creator have excellent metrics.

---

# 23. Hour 0–4 — Project Setup

## All developers

### Hour 0

- Create Git repository
- Create Next.js project
- Create branches
- Decide API contracts
- Decide database schema

Branches:

```text
main

dev/frontend
dev/backend
dev/ai
dev/analytics
dev/data
```

### Hour 1

Developer 2:
- PostgreSQL
- Prisma

Developer 1:
- Layout
- Navigation

Developer 3:
- AI service

Developer 4:
- Ranking service

Developer 5:
- Dataset preparation

### Hours 2–4

Set up:

```text
Next.js
TypeScript
Tailwind
Prisma
PostgreSQL
Zod
LLM SDK
Authentication
```

### End of Hour 4

Must have:

```text
✓ Next.js running
✓ PostgreSQL connected
✓ Prisma working
✓ Git workflow working
✓ Basic UI
✓ Environment variables configured
```

---

# 24. Hours 4–12 — Core System

## Developer 1

Build:

```text
Dashboard
Creator Search
Creator Card
Creator Profile Skeleton
```

Priority:

```text
Search → Results → Profile
```

## Developer 2

Build:

```text
Prisma schema
Migrations
Creator CRUD
Campaign CRUD
```

APIs:

```http
GET /api/creators
GET /api/creators/:id
POST /api/campaigns
GET /api/campaigns
```

## Developer 3

Implement:

```text
parseCreatorSearch()
generateCreatorAnalysis()
generateOutreach()
```

## Developer 4

Implement:

```text
engagementScore()
audienceScore()
locationScore()
priceScore()
followerScore()
calculateMatchScore()
```

## Developer 5

Prepare/import:

```text
500–1,000 creators
```

Ensure categories, locations, follower counts, engagement and audience data vary realistically.

---

# 25. Hours 12–18 — Connect Everything

Connect:

```text
Frontend
   ↓
POST /api/search/creators
   ↓
AI Filter Parser
   ↓
PostgreSQL
   ↓
Ranking
   ↓
Frontend
```

The following should work:

> Find Indian fitness creators with 50K–500K followers and engagement above 4%.

### Milestone #1

At Hour 18:

**Natural-language search → real DB results → real ranking must work.**

If this doesn't work, stop adding features and fix it.

---

# 26. Hours 18–24 — Creator Intelligence

## Developer 1

Finish:

```text
Overview
Audience
Engagement
Authenticity
AI Analysis
```

## Developer 2

Build:

```text
Shortlist APIs
Campaign Creator APIs
```

## Developer 3

Connect:

```text
Creator
 ↓
AI
 ↓
Summary
Strengths
Weaknesses
Recommendation
```

## Developer 4

Build:

```text
Audience charts
Engagement metrics
Growth chart
Creator score
```

## Developer 5

Test:

```text
Search
Profile
API
Database
```

Fix bad data.

---

# 27. Hours 24–30 — Campaigns

Build:

```text
Create Campaign
      ↓
Campaign Details
      ↓
Add Creators
      ↓
Campaign Pipeline
```

Campaign example:

```text
Gaming Laptop Launch

Budget: ₹10,00,000

Target:
Indian gamers

Age:
18–30

Platforms:
YouTube + Instagram
```

---

# 28. Hours 30–36 — AI Outreach

Flow:

```text
Creator
   ↓
Campaign
   ↓
Generate Outreach
   ↓
AI
   ↓
Personalized Message
```

Then:

```text
Copy
Mark Contacted
```

Status:

```text
SHORTLISTED
      ↓
CONTACTED
```

---

# 29. Hours 36–40 — Shortlist + Comparison

## Shortlist

Implement:

```text
Add
Remove
Notes
```

## Comparison

Compare 2–4 creators:

```text
                 A       B       C

Followers       250K    410K    180K
Engagement      5.2%    2.8%    6.1%
Avg Views       90K     110K    75K
Authenticity    94      82      97
Match           91%     87%     95%
Est. Cost       ₹30K    ₹40K    ₹22K
```

---

# 30. Hours 40–44 — Polish

No new major features.

### Developer 1

- UI polish
- Responsive fixes
- Loading states
- Empty states

### Developer 2

- API bugs
- Validation
- Database issues

### Developer 3

- AI prompts
- Error handling
- Response formatting

### Developer 4

- Scoring accuracy
- Analytics
- Charts

### Developer 5

- Integration testing
- Deployment
- Demo data

---

# 31. Hours 44–46 — Deployment

Deploy:

```text
Frontend/API → Vercel
Database     → Managed PostgreSQL
```

Configure:

```text
DATABASE_URL
LLM_API_KEY
AUTH_SECRET
```

Run:

```bash
npx prisma migrate deploy
```

Seed production data.

---

# 32. Hours 46–48 — Demo Lock

At Hour 46:

```text
FREEZE FEATURES
```

Only fix:

```text
Bugs
UI issues
Data issues
Deployment issues
```

---

# 33. Final Demo Flow

## Step 1 — Dashboard

```text
Active Campaigns        12
Creators Discovered   1,248
Shortlisted             86
Outreach Sent           42
Replies                 17
```

## Step 2 — Create Campaign

```text
Gaming Laptop Launch

₹10 lakh

Indian gaming creators

100K–500K followers

18–30 audience

YouTube + Instagram
```

## Step 3 — AI Search

User enters:

> Find the best gaming creators for this campaign.

AI extracts requirements.

## Step 4 — Results

```text
127 creators found

#1 Creator A     96%
#2 Creator B     94%
#3 Creator C     92%
```

## Step 5 — Creator Profile

```text
Creator Score: 94

Followers: 320K
Engagement: 6.2%
Avg Views: 140K

Audience:
India 84%
18–24 43%
25–34 36%

Authenticity: 93
```

## Step 6 — AI Explanation

Click:

**Why is this creator a good fit?**

AI explains:

```text
Strong fit because:

• 84% of audience is Indian
• Majority of audience is 18–34
• Engagement is above campaign benchmark
• Content strongly matches gaming
• Estimated cost fits campaign budget
```

## Step 7 — Compare

Select 3 creators.

Show metrics and recommendation.

## Step 8 — Shortlist

Click:

**Add to Campaign**

## Step 9 — AI Outreach

Click:

**Generate Outreach**

Show personalized message.

## Step 10 — Contact

Click:

**Mark as Contacted**

Pipeline changes:

```text
Shortlisted → Contacted
```

---

# 34. Definition of Done

- [ ] User can register/login
- [ ] Dashboard works
- [ ] Creator database contains 500+ records
- [ ] Natural-language search works
- [ ] AI extracts filters
- [ ] Filters query PostgreSQL
- [ ] Results are ranked
- [ ] Creator profile works
- [ ] Audience analytics work
- [ ] Creator score works
- [ ] AI creator analysis works
- [ ] Creator comparison works
- [ ] Shortlist persists
- [ ] Campaign creation works
- [ ] Creators can be added to campaigns
- [ ] Campaign pipeline works
- [ ] AI outreach works
- [ ] Outreach status persists
- [ ] Dashboard statistics update
- [ ] Production deployment works
- [ ] Demo dataset is loaded
- [ ] Full demo flow has been rehearsed

---

# 35. Data Source Architecture

Because you don't currently have Meta API access, keep the data layer provider-independent:

```text
              Data Ingestion Layer
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Dataset        Meta       Provider
       Provider      Future       Future
          │            │            │
          └────────────┼────────────┘
                       ▼
                 Creator DB
                       ▼
              Creator Hunter
```

Current:

```text
source = "DATASET"
```

Future:

```text
source = "INSTAGRAM"
```

This prevents Instagram integration from becoming a blocker.

---

# 36. Final Product Positioning

> **"Creator Hunter turns a campaign brief into a ranked list of suitable creators, explains why they're a fit, lets the team shortlist them, and generates personalized outreach — all from one workflow."**

Don't try to demonstrate the entire PRD.

Demonstrate a **real end-to-end workflow** where every click actually changes data.
