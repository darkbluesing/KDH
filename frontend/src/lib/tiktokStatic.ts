import type { VideoItem } from "./types";

const DEFAULT_AUTHOR_HANDLE = "kpopdemonhunters";
const TIKTOK_THUMBNAIL_PROXY = "/api/tiktok-thumbnail";

function buildTikTokThumbnail(permalink?: string | null, fallbackUrl?: string | null): string | undefined {
  if (permalink) {
    try {
      return `${TIKTOK_THUMBNAIL_PROXY}?permalink=${encodeURIComponent(permalink)}`;
    } catch (error) {
      console.warn("tiktokStatic: failed to encode TikTok permalink", { permalink, error });
    }
  }

  if (fallbackUrl) {
    try {
      return `${TIKTOK_THUMBNAIL_PROXY}?src=${encodeURIComponent(fallbackUrl)}`;
    } catch (error) {
      console.warn("tiktokStatic: failed to encode TikTok thumbnail fallback", { fallbackUrl, error });
      return fallbackUrl ?? undefined;
    }
  }

  return undefined;
}

export type TikTokLiveEntry = {
  video_id?: string | number;
  video_url?: string;
  permalink?: string;
  author_id?: string;
  thumbnail_url?: string;
  title?: string;
  caption?: string;
  play_url?: string;
  download_url?: string;
  media_url?: string;
};

export type TikTokLegacyEntry = {
  permalink?: string;
  thumbnail_url?: string;
  caption?: string;
  media_url?: unknown;
};

export type StaticTikTokPayload = {
  fetched_at?: number;
  count?: number;
  videos?: TikTokLiveEntry[];
  reels?: TikTokLegacyEntry[];
};

function sanitiseIdFromUrl(url?: string | null): string | null {
  if (!url) {
    return null;
  }
  const match = /video\/(\d+)/.exec(url);
  return match ? match[1] : url.trim() || null;
}

function normaliseTitle(title?: string | null, fallback?: string): string {
  if (typeof title === "string" && title.trim()) {
    return title.trim().slice(0, 140);
  }
  if (typeof fallback === "string" && fallback.trim()) {
    return fallback.trim().slice(0, 140);
  }
  return "TikTok Clip";
}

function mapLiveEntry(entry: TikTokLiveEntry): VideoItem | null {
  const primaryId =
    typeof entry.video_id === "number"
      ? entry.video_id.toString()
      : typeof entry.video_id === "string"
        ? entry.video_id.trim()
        : "";
  const derivedId = primaryId || sanitiseIdFromUrl(entry.video_url ?? entry.permalink);
  if (!derivedId) {
    return null;
  }

  const authorId = entry.author_id?.replace(/^@/, "");
  const finalAuthorId = authorId && authorId.trim() ? authorId.trim() : undefined;
  const permalink = (entry.video_url ?? entry.permalink ?? "").trim() ||
    (finalAuthorId ? `https://www.tiktok.com/@${finalAuthorId}/video/${derivedId}` : null);

  const mediaUrl =
    entry.play_url ??
    entry.download_url ??
    (typeof entry.media_url === "string" ? entry.media_url : undefined) ??
    undefined;

  return {
    id: derivedId,
    title: normaliseTitle(entry.title, entry.caption),
    source: "tiktok",
    channelName: finalAuthorId ? `@${finalAuthorId}` : `@${DEFAULT_AUTHOR_HANDLE}`,
    authorId: finalAuthorId ?? DEFAULT_AUTHOR_HANDLE,
    thumbnailUrl: buildTikTokThumbnail(permalink ?? undefined, entry.thumbnail_url),
    permalink: permalink ?? undefined,
    mediaUrl: mediaUrl ?? permalink ?? undefined,
  } satisfies VideoItem;
}

function mapLegacyEntry(entry: TikTokLegacyEntry): VideoItem | null {
  const permalink = entry.permalink?.trim();
  if (!permalink) {
    return null;
  }
  const derivedId = sanitiseIdFromUrl(permalink);
  if (!derivedId) {
    return null;
  }

  const mediaUrl = typeof entry.media_url === "string" ? entry.media_url : undefined;

  return {
    id: derivedId,
    title: normaliseTitle(entry.caption),
    source: "tiktok",
    channelName: `@${DEFAULT_AUTHOR_HANDLE}`,
    authorId: DEFAULT_AUTHOR_HANDLE,
    thumbnailUrl: buildTikTokThumbnail(permalink, entry.thumbnail_url),
    permalink,
    mediaUrl: mediaUrl ?? permalink,
  } satisfies VideoItem;
}

export function extractTikTokVideos(payload: StaticTikTokPayload | null | undefined): VideoItem[] {
  if (!payload) {
    return [];
  }

  const seen = new Set<string>();
  const videos: VideoItem[] = [];

  if (Array.isArray(payload.videos)) {
    for (const entry of payload.videos) {
      const mapped = mapLiveEntry(entry);
      if (mapped && !seen.has(mapped.id)) {
        seen.add(mapped.id);
        videos.push(mapped);
      }
    }
  }

  if (Array.isArray(payload.reels)) {
    for (const entry of payload.reels) {
      const mapped = mapLegacyEntry(entry);
      if (mapped && !seen.has(mapped.id)) {
        seen.add(mapped.id);
        videos.push(mapped);
      }
    }
  }

  return videos;
}
