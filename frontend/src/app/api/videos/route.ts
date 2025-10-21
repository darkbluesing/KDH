import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

import { extractTikTokVideos, type StaticTikTokPayload } from "@/lib/tiktokStatic";
import type { VideoItem } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATIC_FILES = ["tiktok_live.json", "tiktok.json"] as const;

function shuffleItems<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function toLowerKeywords(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
}

function buildCandidatePaths(filename: string): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, "public", filename),
    path.join(cwd, "..", "frontend", "public", filename),
    path.join(cwd, "..", "public", filename),
  ];
}

async function readStaticPayload(filename: string): Promise<StaticTikTokPayload | null> {
  for (const candidate of buildCandidatePaths(filename)) {
    try {
      const fileContents = await fs.readFile(candidate, "utf-8");
      return JSON.parse(fileContents) as StaticTikTokPayload;
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== "ENOENT") {
        console.warn(`Unable to read TikTok cache file: ${candidate}`, nodeError);
      }
    }
  }
  return null;
}

async function loadStaticVideos(): Promise<{ videos: VideoItem[]; source: string | null }> {
  for (const filename of STATIC_FILES) {
    const payload = await readStaticPayload(filename);
    const videos = extractTikTokVideos(payload);
    if (videos.length) {
      return { videos, source: filename };
    }
  }
  return { videos: [], source: null };
}

function filterByKeywords(videos: VideoItem[], keywords: string[]): VideoItem[] {
  if (!keywords.length) {
    return videos;
  }

  const filtered = videos.filter((video) => {
    const haystack = [video.title, video.channelName, video.authorId, video.permalink]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });

  return filtered.length ? filtered : videos;
}

export async function GET(request: Request) {
  const { videos, source } = await loadStaticVideos();
  if (!videos.length) {
    return NextResponse.json({ error: "No cached TikTok videos available." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const keywords = toLowerKeywords(searchParams.get("q"));
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(Math.floor(limitParam), videos.length)) : videos.length;

  const filtered = filterByKeywords(videos, keywords);
  const randomized = shuffleItems(filtered);
  const payload = randomized.slice(0, limit);

  return NextResponse.json(
    {
      total: filtered.length,
      returned: payload.length,
      videos: payload,
      source,
      keywords: keywords.length ? keywords : undefined,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    }
  );
}
