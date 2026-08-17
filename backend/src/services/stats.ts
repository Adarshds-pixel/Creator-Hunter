import Creator from "../models/Creator.js";
import Campaign from "../models/Campaign.js";
import CampaignCreator from "../models/CampaignCreator.js";
import Shortlist from "../models/Shortlist.js";
import Outreach from "../models/Outreach.js";

const FOLLOWER_TIER_BOUNDARIES = [1_000, 20_000, 200_000, 2_000_000, 10_000_001];
const FOLLOWER_TIER_LABELS: Record<number, string> = {
  1_000: "Nano (1K-20K)",
  20_000: "Mid (20K-200K)",
  200_000: "Large (200K-2M)",
  2_000_000: "Mega (2M+)",
};

interface CountRow {
  _id: string | null;
  count: number;
}

function toDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Zero-fills every day in the last `days` days so the Discovery Insights
// chart shows a true 30-day series, not just the days that happen to have data.
function zeroFillDaily(rows: CountRow[], days: number): { date: string; count: number }[] {
  const byDay = new Map(rows.map((r) => [r._id, r.count]));
  const out: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = toDayString(d);
    out.push({ date: key, count: byDay.get(key) ?? 0 });
  }
  return out;
}

function countRowsToMix(rows: CountRow[], key: string): { [key: string]: string | number }[] {
  return rows
    .filter((r) => r._id != null)
    .map((r) => ({ [key]: r._id as string, count: r.count }));
}

export async function getDashboardStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    facetResult,
    shortlists,
    campaignCreatorCounts,
    recentCampaigns,
    recentShortlists,
    recentOutreach,
    outreachSentCount,
    repliesCount,
  ] = await Promise.all([
    Creator.aggregate([
      {
        $facet: {
          totals: [{ $group: { _id: null, count: { $sum: 1 }, avgEngagement: { $avg: "$engagementRate" } } }],
          thisWeek: [{ $match: { createdAt: { $gte: sevenDaysAgo } } }, { $count: "count" }],
          categoryMix: [
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          platformMix: [
            { $group: { _id: "$platform", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          followerTiers: [
            {
              $bucket: {
                groupBy: "$followers",
                boundaries: FOLLOWER_TIER_BOUNDARIES,
                default: "Other",
                output: { count: { $sum: 1 } },
              },
            },
          ],
          cities: [{ $match: { city: { $ne: null } } }, { $group: { _id: "$city" } }, { $count: "count" }],
          categoriesDistinct: [{ $group: { _id: "$category" } }, { $count: "count" }],
          dailyInsights: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]),
    Shortlist.find().lean(),
    CampaignCreator.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Campaign.find().sort({ createdAt: -1 }).limit(5).lean(),
    Shortlist.find().sort({ createdAt: -1 }).limit(8).lean(),
    Outreach.find().sort({ createdAt: -1 }).limit(8).lean(),
    Outreach.countDocuments({ status: { $ne: "DRAFT" } }),
    Outreach.countDocuments({ status: "REPLIED" }),
  ]);

  const facet = facetResult[0] ?? {};
  const totals = facet.totals?.[0] ?? { count: 0, avgEngagement: 0 };
  const thisWeekCount = facet.thisWeek?.[0]?.count ?? 0;
  const citiesCount = facet.cities?.[0]?.count ?? 0;
  const categoriesCount = facet.categoriesDistinct?.[0]?.count ?? 0;

  const followerTierMix = (facet.followerTiers ?? []).map((row: CountRow) => ({
    tier: typeof row._id === "number" ? (FOLLOWER_TIER_LABELS[row._id] ?? String(row._id)) : "Other",
    count: row.count,
  }));

  const shortlistedCount = shortlists.reduce((sum, s) => sum + (s.creators?.length ?? 0), 0);

  const campaignCreatorMap = new Map(campaignCreatorCounts.map((r: CountRow) => [r._id, r.count]));
  const sumStatuses = (statuses: string[]) =>
    statuses.reduce((sum, s) => sum + (campaignCreatorMap.get(s) ?? 0), 0);
  const ALL_CC_STATUSES = [
    "DISCOVERED",
    "SHORTLISTED",
    "CONTACTED",
    "REPLIED",
    "NEGOTIATING",
    "APPROVED",
    "CONTENT_SUBMITTED",
    "COMPLETED",
    "REJECTED",
  ];
  const outreachFunnel = {
    discovered: sumStatuses(ALL_CC_STATUSES),
    shortlisted: sumStatuses(ALL_CC_STATUSES.filter((s) => s !== "DISCOVERED")),
    contacted: sumStatuses(["CONTACTED", "REPLIED", "NEGOTIATING", "APPROVED", "CONTENT_SUBMITTED", "COMPLETED"]),
    replied: sumStatuses(["REPLIED", "NEGOTIATING", "APPROVED", "CONTENT_SUBMITTED", "COMPLETED"]),
  };

  const recentActivity = [
    ...recentCampaigns.map((c) => ({
      type: "campaign" as const,
      label: "Campaign created",
      entityName: c.name,
      createdAt: (c as { createdAt?: Date }).createdAt ?? new Date(),
    })),
    ...recentShortlists.map((s) => ({
      type: "shortlist" as const,
      label: "Shortlist created",
      entityName: s.name,
      createdAt: (s as { createdAt?: Date }).createdAt ?? new Date(),
    })),
    ...recentOutreach.map((o) => ({
      type: "outreach" as const,
      label: o.status === "REPLIED" ? "Creator replied" : "Outreach sent",
      entityName: o.channel,
      createdAt: (o as { createdAt?: Date }).createdAt ?? new Date(),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return {
    kpis: {
      creatorsTotal: totals.count,
      avgEngagementRate: Math.round((totals.avgEngagement ?? 0) * 10) / 10,
      shortlistedCount,
      outreachSentCount,
      repliesCount,
      creatorsThisWeek: thisWeekCount,
    },
    recentCampaigns,
    outreachFunnel,
    discoveryInsights: zeroFillDaily(facet.dailyInsights ?? [], 30),
    recentActivity,
    categoryMix: countRowsToMix(facet.categoryMix ?? [], "category"),
    platformMix: countRowsToMix(facet.platformMix ?? [], "platform"),
    followerTierMix,
    coverage: {
      creators: totals.count,
      cities: citiesCount,
      categories: categoriesCount,
    },
  };
}

// Stats for the current filtered result set on Discover — cheap aggregation
// against whatever filter the caller already applied, not the whole DB.
export async function getFilteredCreatorStats(filter: Record<string, unknown>) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [agg, categories, cities, thisWeekCount, verifiedCount] = await Promise.all([
    Creator.aggregate([
      { $match: filter },
      { $group: { _id: null, count: { $sum: 1 }, avgEngagement: { $avg: "$engagementRate" } } },
    ]),
    Creator.distinct("category", filter),
    Creator.distinct("city", filter),
    Creator.countDocuments({ ...filter, createdAt: { $gte: sevenDaysAgo } }),
    Creator.countDocuments({ ...filter, verified: true }),
  ]);
  const row = agg[0] ?? { count: 0, avgEngagement: 0 };
  const count = row.count as number;
  return {
    count,
    avgEngagementRate: Math.round((row.avgEngagement ?? 0) * 10) / 10,
    categories: categories.length,
    cities: cities.filter(Boolean).length,
    thisWeekCount,
    verifiedPercent: count > 0 ? Math.round((verifiedCount / count) * 100) : 0,
  };
}
