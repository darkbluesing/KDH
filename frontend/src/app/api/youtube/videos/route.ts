import { NextResponse } from "next/server";
import { DEFAULT_YOUTUBE_PLAYLIST_ID, DEFAULT_YOUTUBE_SEARCH_QUERY } from "@/lib/envDefaults";
import {
  YOUTUBE_API_BASE,
  filterShortFormVideos,
  type CandidateVideo,
  type ThumbnailCollection,
} from "../shortsFilter";

function shuffleItems<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

const EMPTY_THUMBNAILS: ThumbnailCollection = {};

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: ThumbnailCollection;
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
  nextPageToken?: string;
};

type YouTubePlaylistItem = {
  contentDetails?: { videoId?: string };
  snippet?: {
    title: string;
    channelTitle?: string;
    videoOwnerChannelTitle?: string;
    publishedAt?: string;
    thumbnails?: ThumbnailCollection;
  };
};

type YouTubePlaylistResponse = {
  items?: YouTubePlaylistItem[];
};

export async function GET(request: Request) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing YOUTUBE_API_KEY" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.max(1, Math.min(Number(searchParams.get("limit") ?? 50), 100));
  const maxResultsPerCall = 50;

  const envChannelId = process.env.YOUTUBE_CHANNEL_ID;
  const envPlaylistId = process.env.YOUTUBE_PLAYLIST_ID ?? DEFAULT_YOUTUBE_PLAYLIST_ID;
  const envSearchQuery = process.env.YOUTUBE_SEARCH_QUERY ?? DEFAULT_YOUTUBE_SEARCH_QUERY;

  const channelId = searchParams.get("channelId") ?? envChannelId;
  const sanitizedChannelId = channelId && /^UC[\w-]{22}$/.test(channelId) ? channelId : undefined;
  if (channelId && !sanitizedChannelId) {
    console.warn("Ignoring invalid YouTube channel ID", { channelId });
  }
  const primarySearchQuery = searchParams.get("q") ?? envSearchQuery;

  if (primarySearchQuery) {
    const performSearch = async (
      currentQuery: string,
      options: { disableChannelFilter?: boolean } = {}
    ) => {
      const baseParams: Record<string, string> = {
        key: apiKey,
        part: "snippet",
        type: "video",
        q: currentQuery,
        videoDuration: "short",
        maxResults: String(maxResultsPerCall),
        order: "viewCount",
      };

      if (!options.disableChannelFilter && sanitizedChannelId) {
        baseParams.channelId = sanitizedChannelId;
      }

      const desiredPageCount = Math.max(1, Math.ceil(limit / maxResultsPerCall));
      const collected: YouTubeSearchItem[] = [];
      let nextPageToken: string | undefined;

      for (let pageIndex = 0; pageIndex < desiredPageCount; pageIndex += 1) {
        if (pageIndex > 0 && !nextPageToken) {
          break;
        }

        const query = new URLSearchParams(baseParams);
        if (pageIndex > 0 && nextPageToken) {
          query.set("pageToken", nextPageToken);
        }

        const response = await fetch(`${YOUTUBE_API_BASE}/search?${query.toString()}`, {
          next: { revalidate: 60 },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          if (!collected.length) {
            return { error: { error: "Failed to fetch YouTube videos.", details: errorBody }, items: [] };
          }

          console.warn("YouTube search pagination call failed; returning partial results.", {
            status: response.status,
            errorBody,
          });
          break;
        }

        const data = (await response.json()) as YouTubeSearchResponse;
        if (data.items?.length) {
          collected.push(...data.items);
        }

        nextPageToken = data.nextPageToken;

        if (!nextPageToken || collected.length >= limit) {
          break;
        }
      }

      return { items: collected, error: null };
    };

    let searchResult = await performSearch(primarySearchQuery);

    if (searchResult.items.length === 0 && sanitizedChannelId) {
      console.warn("No results with channel filter; retrying without channel restriction.");
      searchResult = await performSearch(primarySearchQuery, { disableChannelFilter: true });
    }

    if (searchResult.items.length === 0) {
      console.warn("Primary search yielded no results; using fallback keyword.");
      searchResult = await performSearch("kpop shorts", { disableChannelFilter: true });
    }

    if (searchResult.error) {
      return NextResponse.json(searchResult.error, { status: 500 });
    }

    const candidates: CandidateVideo[] = searchResult.items
      .filter((item): item is { snippet: NonNullable<typeof item.snippet>; id: { videoId: string } } =>
        Boolean(item.snippet && item.id?.videoId)
      )
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channelName: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails ?? EMPTY_THUMBNAILS,
      }));

    const videos = await filterShortFormVideos(candidates, apiKey);
    const randomizedVideos = shuffleItems(videos);
    return NextResponse.json({ videos: randomizedVideos.slice(0, limit) });
  }

  const playlistId = searchParams.get("playlistId") ?? envPlaylistId;
  if (playlistId) {
    const playlistQuery = new URLSearchParams({
      key: apiKey,
      playlistId,
      part: "snippet,contentDetails",
      maxResults: String(limit),
    });

    const playlistResponse = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${playlistQuery.toString()}`, { next: { revalidate: 60 } });
    if (!playlistResponse.ok) {
      const errorBody = await playlistResponse.text();
      return NextResponse.json({ error: "Failed to fetch playlist.", details: errorBody }, { status: 500 });
    }

    const playlistData = (await playlistResponse.json()) as YouTubePlaylistResponse;
    const candidates: CandidateVideo[] = (playlistData.items ?? [])
      .filter(
        (item): item is { snippet: NonNullable<typeof item.snippet>; contentDetails: { videoId: string } } =>
          Boolean(item.snippet && item.contentDetails?.videoId)
      )
      .map((item) => ({
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        channelName: item.snippet.videoOwnerChannelTitle ?? item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails ?? EMPTY_THUMBNAILS,
      }));

    const videos = await filterShortFormVideos(candidates, apiKey);
    return NextResponse.json({ videos });
  }

  return NextResponse.json({ error: "Missing search query or playlistId" }, { status: 400 });
}
