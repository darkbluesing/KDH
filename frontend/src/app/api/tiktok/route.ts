import { NextResponse } from "next/server";
import type { VideoItem } from "@/lib/types";

const DEFAULT_BACKEND_URL = "http://localhost:5001/api/videos";
const TIKTOK_BACKEND_API_URL =
  process.env.TIKTOK_BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_TIKTOK_BACKEND_API_URL ??
  DEFAULT_BACKEND_URL;
const PAGE_SIZE = 12;

type BackendVideo = {
  authorId?: string;
  author_id?: string;
  download_url?: string | null;
  mediaUrl?: string | null;
  play_url?: string | null;
  thumbnail_url?: string | null;
  title?: string | null;
  video_id?: string | null;
  video_url?: string | null;
};

type BackendResponse = {
  error?: string;
  next_cursor?: number | null;
  videos?: BackendVideo[];
};

function normaliseTikTokVideo(input: BackendVideo): VideoItem | null {
  const id = input.video_id ?? undefined;
  if (!id) {
    return null;
  }

  const rawAuthor = input.author_id ?? input.authorId ?? "";
  const authorId = rawAuthor.replace(/^@/, "");
  const permalink = input.video_url ?? undefined;
  const mediaUrl = input.mediaUrl ?? input.play_url ?? input.download_url ?? permalink;

  return {
    id,
    title: input.title ?? "TikTok Clip",
    source: "tiktok",
    authorId,
    channelName: authorId ? `@${authorId}` : undefined,
    thumbnailUrl: input.thumbnail_url ?? undefined,
    permalink,
    mediaUrl,
  } satisfies VideoItem;
}

export async function GET(request: Request) {
  if (!TIKTOK_BACKEND_API_URL) {
    return NextResponse.json({ error: "TikTok backend URL is not configured." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 200));
  const keywordParam = searchParams.get("q")?.trim();

  const collected: BackendVideo[] = [];
  let cursor: number | null = null;

  while (collected.length < limit) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (keywordParam) {
      params.set("q", keywordParam);
    }
    if (cursor !== null) {
      params.set("cursor", String(cursor));
    }

    const response = await fetch(`${TIKTOK_BACKEND_API_URL}?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      const statusText = response.statusText || "TikTok backend error";
      return NextResponse.json({ error: statusText }, { status: response.status });
    }

    const payload = (await response.json()) as BackendResponse;
    const batch = payload.videos ?? [];

    collected.push(...batch);

    if (!batch.length || payload.next_cursor == null) {
      break;
    }

    cursor = payload.next_cursor;
  }

  const normalised = collected
    .slice(0, limit)
    .map(normaliseTikTokVideo)
    .filter((video): video is VideoItem => Boolean(video));

  return NextResponse.json({ videos: normalised });
}
