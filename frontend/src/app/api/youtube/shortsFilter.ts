import type { VideoItem } from "@/lib/types";

export const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const MAX_VIDEO_IDS_PER_REQUEST = 50;
const MAX_SHORT_DURATION_SECONDS = 75;

export type ThumbnailResource = {
  url?: string;
  width?: number;
  height?: number;
};

export type ThumbnailCollection = {
  default?: ThumbnailResource;
  medium?: ThumbnailResource;
  high?: ThumbnailResource;
  standard?: ThumbnailResource;
  maxres?: ThumbnailResource;
};

export type CandidateVideo = {
  id: string;
  title: string;
  channelName?: string;
  publishedAt?: string;
  thumbnails: ThumbnailCollection;
};

export type FilteredVideo = VideoItem;

const THUMBNAIL_PRIORITY: Array<keyof ThumbnailCollection> = [
  "maxres",
  "standard",
  "high",
  "medium",
  "default",
];

function pickBestThumbnail(thumbnails: ThumbnailCollection): ThumbnailResource | null {
  const orderedCandidates = THUMBNAIL_PRIORITY
    .map((key) => thumbnails[key])
    .filter((candidate): candidate is ThumbnailResource => Boolean(candidate?.url));

  if (!orderedCandidates.length) {
    return null;
  }

  const portraitCandidate = orderedCandidates.find(
    (candidate) => getOrientation(candidate) === "portrait"
  );

  return portraitCandidate ?? orderedCandidates[0];
}

function getOrientation(thumbnail: ThumbnailResource | null): "portrait" | "landscape" | "unknown" {
  if (!thumbnail) {
    return "unknown";
  }
  const { width, height } = thumbnail;
  if (typeof width !== "number" || typeof height !== "number") {
    return "unknown";
  }
  if (height > width) {
    return "portrait";
  }
  if (height < width) {
    return "landscape";
  }
  return "unknown";
}

function chunkIds(ids: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

function parseIsoDuration(duration: string | undefined): number {
  if (!duration) {
    return Number.POSITIVE_INFINITY;
  }
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }
  const [, hoursRaw, minutesRaw, secondsRaw] = match;
  const hours = hoursRaw ? Number(hoursRaw) : 0;
  const minutes = minutesRaw ? Number(minutesRaw) : 0;
  const seconds = secondsRaw ? Number(secondsRaw) : 0;
  return hours * 3600 + minutes * 60 + seconds;
}

async function fetchVideoDurations(videoIds: string[], apiKey: string): Promise<Map<string, number>> {
  const durations = new Map<string, number>();

  if (!videoIds.length) {
    return durations;
  }

  for (const idChunk of chunkIds(videoIds, MAX_VIDEO_IDS_PER_REQUEST)) {
    const query = new URLSearchParams({
      key: apiKey,
      part: "contentDetails",
      id: idChunk.join(","),
      maxResults: String(idChunk.length),
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/videos?${query.toString()}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      continue;
    }

    type VideosResponse = {
      items?: Array<{
        id?: string;
        contentDetails?: {
          duration?: string;
        };
      }>;
    };

    const data = (await response.json()) as VideosResponse;

    for (const item of data.items ?? []) {
      const id = item.id;
      if (!id) {
        continue;
      }
      const durationSeconds = parseIsoDuration(item.contentDetails?.duration);
      if (Number.isFinite(durationSeconds)) {
        durations.set(id, durationSeconds);
      }
    }
  }

  return durations;
}

export async function filterShortFormVideos(
  candidates: CandidateVideo[],
  apiKey: string
): Promise<FilteredVideo[]> {
  const prepared = candidates
    .map((candidate) => {
      const thumbnail = pickBestThumbnail(candidate.thumbnails);
      return thumbnail
        ? {
            candidate,
            thumbnail,
            orientation: getOrientation(thumbnail),
          }
        : null;
    })
    .filter(
      (item): item is {
        candidate: CandidateVideo;
        thumbnail: ThumbnailResource;
        orientation: "portrait" | "landscape" | "unknown";
      } => Boolean(item)
    );

  if (!prepared.length) {
    return [];
  }

  let durations: Map<string, number> | null = null;

  try {
    durations = await fetchVideoDurations(
      prepared.map((item) => item.candidate.id),
      apiKey
    );
  } catch (error) {
    console.warn("Failed to fetch video durations for shorts filter", error);
  }

  const hasDurationData = Boolean(durations && durations.size);

  return prepared
    .filter((item) => {
      const duration = durations?.get(item.candidate.id);

      if (hasDurationData) {
        if (typeof duration !== "number") {
          return false;
        }
        if (duration <= 0 || duration > MAX_SHORT_DURATION_SECONDS) {
          return false;
        }
        return true;
      }

      return true;
    })
    .map(({ candidate, thumbnail }) => ({
      id: candidate.id,
      title: candidate.title,
      source: "youtube" as const,
      channelName: candidate.channelName,
      publishedAt: candidate.publishedAt,
      thumbnailUrl: thumbnail.url ?? "",
      permalink: `https://www.youtube.com/watch?v=${candidate.id}`,
    }))
    .filter((video) => Boolean(video.thumbnailUrl));
}
