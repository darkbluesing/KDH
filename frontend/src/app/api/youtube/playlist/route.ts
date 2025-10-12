import { NextResponse } from "next/server";
import { DEFAULT_YOUTUBE_PLAYLIST_ID } from "@/lib/envDefaults";
import {
  YOUTUBE_API_BASE,
  filterShortFormVideos,
  type CandidateVideo,
  type ThumbnailCollection,
} from "../shortsFilter";

const DEFAULT_MAX_RESULTS = 25;

export async function GET(request: Request) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const defaultPlaylistId =
    process.env.YOUTUBE_PLAYLIST_ID ??
    process.env.NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID ??
    DEFAULT_YOUTUBE_PLAYLIST_ID;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing YOUTUBE_API_KEY environment variable." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get("playlistId") ?? defaultPlaylistId;

  if (!playlistId) {
    return NextResponse.json({ error: "Missing playlistId." }, { status: 400 });
  }

  const maxResultsParam = Number(searchParams.get("limit") ?? DEFAULT_MAX_RESULTS);
  const maxResults = Math.max(1, Math.min(Number.isFinite(maxResultsParam) ? maxResultsParam : DEFAULT_MAX_RESULTS, 50));

  const query = new URLSearchParams({
    key: apiKey,
    playlistId,
    part: "snippet,contentDetails",
    maxResults: String(maxResults),
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${query.toString()}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return NextResponse.json(
      {
        error: "Failed to fetch YouTube playlist items.",
        details: errorBody,
      },
      { status: response.status }
    );
  }

  type YouTubePlaylistItem = {
    contentDetails?: { videoId?: string };
    snippet?: {
      title: string;
      channelTitle?: string;
      publishedAt?: string;
      videoOwnerChannelTitle?: string;
      thumbnails?: ThumbnailCollection;
    };
  };

  type YouTubePlaylistResponse = {
    items?: YouTubePlaylistItem[];
  };

  const data = (await response.json()) as YouTubePlaylistResponse;

  const candidates: CandidateVideo[] = (data.items ?? [])
    .filter((item): item is Required<YouTubePlaylistItem> => Boolean(item?.contentDetails?.videoId && item?.snippet))
    .map((item) => ({
      id: item.contentDetails!.videoId!,
      title: item.snippet!.title,
      channelName: item.snippet!.videoOwnerChannelTitle ?? item.snippet!.channelTitle,
      publishedAt: item.snippet!.publishedAt,
      thumbnails: item.snippet!.thumbnails ?? {},
    }));

  const shortsOnly = await filterShortFormVideos(candidates, apiKey);

  const tracks = shortsOnly.map((video) => ({
    id: video.id,
    videoId: video.id,
    title: video.title,
    artist: video.channelName ?? "K-POP Demon Hunters",
    thumbnailUrl: video.thumbnailUrl,
    publishedAt: video.publishedAt,
  }));

  return NextResponse.json({ tracks });
}
