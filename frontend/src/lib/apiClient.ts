import axios from "axios";
import type { Creator, CreatorAnalysis } from "../types/creator";
import type { Campaign } from "../types/campaign";
import type { SearchFilters } from "../types/search";
import type { CampaignCreator, CampaignCreatorStatus } from "../types/campaignCreator";
import type { Outreach, OutreachStatusType } from "../types/outreach";
import type { Shortlist } from "../types/shortlist";
import type { User, AuthResponse } from "../types/user";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("creator_hunter_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---

export function loginUser(payload: { email: string; password: string }): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/login", payload).then((res) => res.data);
}

export function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  company?: string;
  role?: string;
}): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/register", payload).then((res) => res.data);
}

export function fetchCurrentUser(): Promise<{ user: User }> {
  return apiClient.get<{ user: User }>("/auth/me").then((res) => res.data);
}

export interface SearchResponse {
  filters: SearchFilters;
  results: Creator[];
}

export function searchCreators(query: string, campaign?: Partial<Campaign>): Promise<SearchResponse> {
  return apiClient.post<SearchResponse>("/search/creators", { query, campaign }).then((res) => res.data);
}

export function fetchCreatorAnalysis(
  creatorId: string,
  campaign?: Partial<Campaign>
): Promise<CreatorAnalysis> {
  return apiClient
    .post<CreatorAnalysis>("/ai/creator-analysis", { creatorId, campaign })
    .then((res) => res.data);
}

export interface OutreachResponse {
  message: string;
}

export function generateOutreachMessage(
  creatorId: string,
  campaign: Partial<Campaign> | undefined,
  channel: string
): Promise<OutreachResponse> {
  return apiClient
    .post<OutreachResponse>("/ai/outreach", { creatorId, campaign, channel })
    .then((res) => res.data);
}

// --- Creators ---

export interface CreatorListFilters {
  category?: string;
  country?: string;
  city?: string;
  platform?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minEngagement?: number;
}

export interface CreatorSetStats {
  count: number;
  avgEngagementRate: number;
  categories: number;
  cities: number;
  thisWeekCount: number;
  verifiedPercent: number;
}

export interface CreatorListResponse {
  creators: Creator[];
  total: number;
  stats: CreatorSetStats;
}

export function fetchCreators(
  filters: CreatorListFilters = {},
  page = 1,
  limit = 24
): Promise<CreatorListResponse> {
  const params = { ...filters, page, limit };
  return apiClient.get<CreatorListResponse>("/creators", { params }).then((res) => res.data);
}

// --- Dashboard stats ---

export interface DashboardStats {
  kpis: {
    creatorsTotal: number;
    avgEngagementRate: number;
    shortlistedCount: number;
    outreachSentCount: number;
    repliesCount: number;
    creatorsThisWeek: number;
  };
  recentCampaigns: Campaign[];
  outreachFunnel: { discovered: number; shortlisted: number; contacted: number; replied: number };
  discoveryInsights: { date: string; count: number }[];
  recentActivity: {
    type: "campaign" | "shortlist" | "outreach";
    label: string;
    entityName: string;
    createdAt: string;
  }[];
  categoryMix: { category: string; count: number }[];
  platformMix: { platform: string; count: number }[];
  followerTierMix: { tier: string; count: number }[];
  coverage: { creators: number; cities: number; categories: number };
}

export function fetchDashboardStats(): Promise<DashboardStats> {
  return apiClient.get<DashboardStats>("/stats/dashboard").then((res) => res.data);
}

export function fetchCreator(id: string, campaignId?: string): Promise<Creator> {
  return apiClient
    .get<Creator>(`/creators/${id}`, { params: campaignId ? { campaignId } : undefined })
    .then((res) => res.data);
}

export function createCreator(payload: Partial<Creator>): Promise<Creator> {
  return apiClient.post<Creator>("/creators", payload).then((res) => res.data);
}

// --- Campaigns ---

export function fetchCampaigns(status?: string): Promise<Campaign[]> {
  return apiClient
    .get<Campaign[]>("/campaigns", { params: status ? { status } : undefined })
    .then((res) => res.data);
}

export function createCampaign(payload: Partial<Campaign>): Promise<Campaign> {
  return apiClient.post<Campaign>("/campaigns", payload).then((res) => res.data);
}

export interface CampaignDetailResponse extends Campaign {
  creators: CampaignCreator[];
}

export function fetchCampaign(id: string): Promise<CampaignDetailResponse> {
  return apiClient.get<CampaignDetailResponse>(`/campaigns/${id}`).then((res) => res.data);
}

export function updateCampaign(id: string, payload: Partial<Campaign>): Promise<Campaign> {
  return apiClient.patch<Campaign>(`/campaigns/${id}`, payload).then((res) => res.data);
}

export function deleteCampaign(id: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/campaigns/${id}`).then((res) => res.data);
}

export function addCreatorToCampaign(
  campaignId: string,
  payload: { creatorId: string; matchScore?: number; status?: CampaignCreatorStatus }
): Promise<CampaignCreator> {
  return apiClient
    .post<CampaignCreator>(`/campaigns/${campaignId}/creators`, payload)
    .then((res) => res.data);
}

export function updateCampaignCreator(
  campaignId: string,
  creatorId: string,
  payload: { status?: CampaignCreatorStatus; notes?: string }
): Promise<CampaignCreator> {
  return apiClient
    .patch<CampaignCreator>(`/campaigns/${campaignId}/creators/${creatorId}`, payload)
    .then((res) => res.data);
}

// --- Shortlists ---

export function fetchShortlists(): Promise<Shortlist[]> {
  return apiClient.get<Shortlist[]>("/shortlists").then((res) => res.data);
}

export function createShortlist(name: string): Promise<Shortlist> {
  return apiClient.post<Shortlist>("/shortlists", { name }).then((res) => res.data);
}

export function addCreatorToShortlist(
  shortlistId: string,
  creatorId: string,
  notes?: string
): Promise<Shortlist> {
  return apiClient
    .post<Shortlist>(`/shortlists/${shortlistId}/creators`, { creatorId, notes })
    .then((res) => res.data);
}

export function removeCreatorFromShortlist(shortlistId: string, creatorId: string): Promise<Shortlist> {
  return apiClient
    .delete<Shortlist>(`/shortlists/${shortlistId}/creators/${creatorId}`)
    .then((res) => res.data);
}

export function deleteShortlist(shortlistId: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/shortlists/${shortlistId}`).then((res) => res.data);
}

const DEFAULT_SHORTLIST_NAME = "My Shortlist";

// Convenience used by CreatorCard/CreatorProfile's one-click "Add to shortlist" —
// there's no shortlist-picker UI yet, so this reuses (or creates) a single default list.
export async function addCreatorToDefaultShortlist(creatorId: string, notes?: string): Promise<Shortlist> {
  const shortlists = await fetchShortlists();
  const target = shortlists[0] ?? (await createShortlist(DEFAULT_SHORTLIST_NAME));
  return addCreatorToShortlist(target._id, creatorId, notes);
}

// --- Outreach ---

export function fetchOutreach(campaignId?: string): Promise<Outreach[]> {
  return apiClient
    .get<Outreach[]>("/outreach", { params: campaignId ? { campaignId } : undefined })
    .then((res) => res.data);
}

export function createOutreach(payload: {
  campaignId: string;
  creatorId: string;
  channel: string;
  message: string;
  status?: OutreachStatusType;
}): Promise<Outreach> {
  return apiClient.post<Outreach>("/outreach", payload).then((res) => res.data);
}

export function updateOutreachStatus(id: string, status: OutreachStatusType): Promise<Outreach> {
  return apiClient.patch<Outreach>(`/outreach/${id}`, { status }).then((res) => res.data);
}

// --- CSV Export Utility ---

export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header] ?? "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
