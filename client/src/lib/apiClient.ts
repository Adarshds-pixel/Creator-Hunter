import axios from "axios";
import type { Creator, CreatorAnalysis } from "../types/creator";
import type { Campaign } from "../types/campaign";
import type { SearchFilters } from "../types/search";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

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
