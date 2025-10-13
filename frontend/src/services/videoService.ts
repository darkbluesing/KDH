import type { VideoItem, VideoSource } from "@/lib/types";
import { MOCK_VIDEOS } from "@/lib/mockVideos";
import { extractTikTokVideos, type StaticTikTokPayload } from "@/lib/tiktokStatic";

const YOUTUBE_VIDEOS_ENDPOINT = "/api/youtube/videos";
const TIKTOK_API_ENDPOINT = "/api/videos";
const TIKTOK_STATIC_SOURCES = ["/tiktok_live.json", "/tiktok.json"];

const YOUTUBE_FALLBACK = MOCK_VIDEOS.filter((video) => video.source === "youtube");
const TIKTOK_FALLBACK = MOCK_VIDEOS.filter((video) => video.source === "tiktok");

type CacheEntry = {
  expiresAt: number;
  payload: VideoItem[];
};

const combinedCache = new Map<string, CacheEntry>();
const COMBINED_CACHE_TTL = 2 * 60 * 1000;

const DEFAULT_FETCH_LIMIT = 100;

const DEFAULT_TIKTOK_KEYWORDS = ["kpopdemonhunters","huntrix","kpdh","kpdemonhunters","kpopdemonhuntersedit","huntrixedit","huntrixcover","kpopdemonhuntersfanart","kpopdemonhuntersrumi","kpopdemonhunterszoey","kpopdemonhuntersmira","kpopdemonhuntersjinu","kpopfantasy","demonhunters","kpopanimation","kpopviral","kpoptiktok","fyp","viral","trending"];

function shuffleItems<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function interleaveCollections(primary: VideoItem[], secondary: VideoItem[]): VideoItem[] {
  const maxLength = Math.max(primary.length, secondary.length);
  const result: VideoItem[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < maxLength; index += 1) {
    const first = primary[index];
    const second = secondary[index];

    if (first) {
      const key = `${first.source}:${first.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(first);
      }
    }

    if (second) {
      const key = `${second.source}:${second.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(second);
      }
    }
  }

  return result;
}

export async function safeFetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(input, init);
    if (!response.ok) {
      console.warn("safeFetchJson: Request failed", { input, status: response.status });
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("safeFetchJson: Request error", { input, error });
    return null;
  }
}

async function fetchTikTokFromApi(limit: number, keywords: string[]): Promise<VideoItem[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (keywords.length > 0) {
    params.set("q", keywords.join(","));
  }

  const data = await safeFetchJson<{ videos: VideoItem[] }>(`${TIKTOK_API_ENDPOINT}?${params.toString()}`);
  if (data?.videos?.length) {
    return data.videos.filter((video) => video.source === "tiktok" && Boolean(video.id));
  }

  return fetchTikTokFromStatic();
}

async function fetchTikTokFromStatic(): Promise<VideoItem[]> {
  for (const path of TIKTOK_STATIC_SOURCES) {
    const data = await safeFetchJson<StaticTikTokPayload>(path, { cache: "no-store" });
    const videos = extractTikTokVideos(data);
    if (videos.length) {
      return videos;
    }
  }

  return TIKTOK_FALLBACK;
}

export async function fetchVideosBySource(source: VideoSource): Promise<VideoItem[]> {
  if (source === "youtube") {
    const data = await safeFetchJson<{ videos: VideoItem[] }>(`${YOUTUBE_VIDEOS_ENDPOINT}?limit=${DEFAULT_FETCH_LIMIT}`);
    if (data?.videos?.length) {
      return data.videos;
    }
    return YOUTUBE_FALLBACK;
  }

  if (source === "tiktok") {
    return fetchTikTokFromApi(DEFAULT_FETCH_LIMIT, DEFAULT_TIKTOK_KEYWORDS);
  }

  return MOCK_VIDEOS.filter((video) => video.source === source);
}

export async function fetchCombinedVideos(): Promise<VideoItem[]> {
  const cacheKey = "combined:default";
  const now = Date.now();
  const cached = combinedCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }

  let [youtubeData, tiktokVideos] = await Promise.all([
    safeFetchJson<{ videos: VideoItem[] }>(`${YOUTUBE_VIDEOS_ENDPOINT}?limit=${DEFAULT_FETCH_LIMIT}`),
    fetchTikTokFromApi(DEFAULT_FETCH_LIMIT, DEFAULT_TIKTOK_KEYWORDS),
  ]);

  if (!tiktokVideos.length) {
    tiktokVideos = await fetchTikTokFromStatic();
  }

  const youtubeVideos = youtubeData?.videos ?? [];

  const youtubePool = youtubeVideos.length ? youtubeVideos : YOUTUBE_FALLBACK;
  const tiktokPool = tiktokVideos.length ? tiktokVideos : TIKTOK_FALLBACK;

  const interleaved = interleaveCollections(youtubePool, tiktokPool);
  const combined = interleaved.length ? interleaved : shuffleItems(MOCK_VIDEOS);

  combinedCache.set(cacheKey, {
    expiresAt: now + COMBINED_CACHE_TTL,
    payload: combined,
  });

  return combined;
}
