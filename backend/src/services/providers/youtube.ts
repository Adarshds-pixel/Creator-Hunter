const API_BASE = "https://www.googleapis.com/youtube/v3";
const REQUEST_TIMEOUT_MS = 10_000;
const RECENT_UPLOADS = 10;

export class ProviderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface ChannelResponse {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      description?: string;
      customUrl?: string;
      country?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    statistics?: {
      subscriberCount?: string;
      videoCount?: string;
      viewCount?: string;
    };
    contentDetails?: {
      relatedPlaylists?: { uploads?: string };
    };
  }>;
}

interface PlaylistResponse {
  items?: Array<{ contentDetails?: { videoId?: string } }>;
}

interface VideosResponse {
  items?: Array<{
    statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  }>;
}

type CreatorPayload = {
  name: string;
  username: string;
  platform: string;
  profileUrl: string;
  profileImage?: string;
  bio?: string;
  category: string;
  tags: string[];
  verified: boolean;
  country?: string;
  languages: string[];
  followers: number;
  following: number;
  posts: number;
  avgLikes: number;
  avgComments: number;
  avgViews: number;
  engagementRate: number;
  growthRate: number;
  estimatedCost: number;
  authenticityScore: number;
  audienceQualityScore: number;
  source: "YOUTUBE";
  sourceId: string;
  lastSyncedAt: Date;
};

const ISO_COUNTRY_NAMES: Record<string, string> = {
  IN: "India",
  US: "USA",
  AE: "UAE",
  GB: "UK",
};

function requireApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new ProviderError(
      "YOUTUBE_API_KEY is not configured on the server",
      500
    );
  }
  return key;
}

async function callApi<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    throw new ProviderError("Could not reach the YouTube API", 502);
  }

  if (res.status === 403) {
    throw new ProviderError("YouTube API rejected the request — check the API key and quota", 502);
  }
  if (!res.ok) {
    throw new ProviderError(`YouTube API error (${res.status})`, 502);
  }
  return (await res.json()) as T;
}

// Accepts full URLs (@handle, /channel/UC..., /c/Name, /user/Name) or a bare
// @handle / channel id and returns { kind, value } for channels.list.
function parseChannelRef(input: string): { kind: "id" | "handle" | "username"; value: string } {
  const raw = input.trim();
  if (!raw) throw new ProviderError("Enter a YouTube channel URL or handle");

  let path = raw;
  try {
    if (/^https?:\/\//i.test(raw)) {
      const parsed = new URL(raw);
      if (!/(^|\.)youtube\.com$/i.test(parsed.hostname)) {
        throw new ProviderError("Not a youtube.com URL");
      }
      path = parsed.pathname;
    }
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError("Could not parse that channel URL");
  }

  const channelMatch = path.match(/\/channel\/(UC[\w-]+)/i);
  if (channelMatch) return { kind: "id", value: channelMatch[1] };

  const handleMatch = path.match(/\/@([\w.-]+)/);
  if (handleMatch) return { kind: "handle", value: `@${handleMatch[1]}` };

  const customMatch = path.match(/\/(?:c|user)\/([\w.-]+)/i);
  if (customMatch) return { kind: "username", value: customMatch[1] };

  const bare = raw.replace(/^https?:\/\/[^/]+\/?/i, "").replace(/^\//, "");
  if (/^UC[\w-]{20,}$/.test(bare)) return { kind: "id", value: bare };
  if (/^@[\w.-]+$/.test(raw)) return { kind: "handle", value: raw };

  if (bare && !bare.includes("/")) return { kind: "username", value: bare };

  throw new ProviderError("Could not find a channel reference in that input");
}

async function resolveChannel(input: string): Promise<NonNullable<ChannelResponse["items"]>[number]> {
  const ref = parseChannelRef(input);
  const params: Record<string, string> = {
    part: "snippet,statistics,contentDetails",
    key: requireApiKey(),
  };

  if (ref.kind === "id") params.id = ref.value;
  else if (ref.kind === "handle") params.forHandle = ref.value;
  else params.forUsername = ref.value;

  let data = await callApi<ChannelResponse>("channels", params);
  let item = data.items?.[0];

  // /c/ and /user/ legacy URLs don't always map to forUsername — retry as a handle.
  if (!item && ref.kind !== "id") {
    const retryParams: Record<string, string> = {
      part: "snippet,statistics,contentDetails",
      key: params.key,
      forHandle: ref.value.startsWith("@") ? ref.value : `@${ref.value}`,
    };
    data = await callApi<ChannelResponse>("channels", retryParams);
    item = data.items?.[0];
  }

  if (!item) throw new ProviderError("No YouTube channel found for that URL/handle");
  return item;
}

async function fetchRecentUploadStats(uploadsPlaylistId: string): Promise<{
  avgViews: number;
  avgLikes: number;
  avgComments: number;
}> {
  const playlist = await callApi<PlaylistResponse>("playlistItems", {
    part: "contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: String(RECENT_UPLOADS),
    key: requireApiKey(),
  });

  const videoIds = (playlist.items ?? [])
    .map((item) => item.contentDetails?.videoId)
    .filter((id): id is string => Boolean(id));

  if (videoIds.length === 0) return { avgViews: 0, avgLikes: 0, avgComments: 0 };

  const videos = await callApi<VideosResponse>("videos", {
    part: "statistics",
    id: videoIds.join(","),
    key: requireApiKey(),
  });

  const stats = (videos.items ?? []).map((v) => ({
    views: Number(v.statistics?.viewCount ?? 0),
    likes: Number(v.statistics?.likeCount ?? 0),
    comments: Number(v.statistics?.commentCount ?? 0),
  }));
  if (stats.length === 0) return { avgViews: 0, avgLikes: 0, avgComments: 0 };

  const sum = (pick: (s: (typeof stats)[number]) => number) =>
    Math.round(stats.reduce((acc, s) => acc + pick(s), 0) / stats.length);

  return { avgViews: sum((s) => s.views), avgLikes: sum((s) => s.likes), avgComments: sum((s) => s.comments) };
}

export async function importYouTubeProfile(input: string): Promise<CreatorPayload> {
  const channel = await resolveChannel(input);
  const snippet = channel.snippet ?? {};
  const statistics = channel.statistics ?? {};

  const followers = Number(statistics.subscriberCount ?? 0);
  const uploadsPlaylist = channel.contentDetails?.relatedPlaylists?.uploads;
  const recent = uploadsPlaylist
    ? await fetchRecentUploadStats(uploadsPlaylist)
    : { avgViews: 0, avgLikes: 0, avgComments: 0 };

  // Engagement relative to audience size; likes+comments are the only public signals.
  const interactions = recent.avgLikes + recent.avgComments;
  const engagementRate = followers > 0 ? Number(((interactions / followers) * 100).toFixed(2)) : 0;

  const estimatedCost = Math.max(5000, Math.round(followers * 0.15 / 1000) * 1000);

  const username = (snippet.customUrl ?? channel.id).replace(/^@/, "");
  const thumbnail =
    snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url ?? undefined;

  return {
    name: snippet.title ?? channel.id,
    username,
    platform: "YouTube",
    profileUrl: snippet.customUrl
      ? `https://www.youtube.com/${snippet.customUrl}`
      : `https://www.youtube.com/channel/${channel.id}`,
    profileImage: thumbnail,
    bio: snippet.description?.slice(0, 400),
    category: "Lifestyle",
    tags: [],
    verified: false,
    country: snippet.country ? ISO_COUNTRY_NAMES[snippet.country] : undefined,
    languages: ["English"],
    followers,
    following: 0,
    posts: Number(statistics.videoCount ?? 0),
    avgLikes: recent.avgLikes,
    avgComments: recent.avgComments,
    avgViews: recent.avgViews,
    engagementRate,
    growthRate: 0,
    estimatedCost,
    authenticityScore: 70,
    audienceQualityScore: 70,
    source: "YOUTUBE",
    sourceId: channel.id,
    lastSyncedAt: new Date(),
  };
}
