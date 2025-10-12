import type { AudioTrack } from "@/lib/types";
import { KDH_PLAYLIST } from "@/lib/mockPlaylist";
import { DEFAULT_YOUTUBE_PLAYLIST_ID } from "@/lib/envDefaults";
import { safeFetchJson } from "./videoService";

const YOUTUBE_PLAYLIST_ENDPOINT = "/api/youtube/playlist";

export async function fetchPlaylistTracks(): Promise<AudioTrack[]> {
  const playlistId = process.env.NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID ?? DEFAULT_YOUTUBE_PLAYLIST_ID;

  const data = await safeFetchJson<{ tracks: AudioTrack[] }>(
    `${YOUTUBE_PLAYLIST_ENDPOINT}?limit=25&playlistId=${encodeURIComponent(playlistId)}`,
    {
      cache: "no-store",
    }
  );

  if (data?.tracks?.length) {
    return data.tracks.map((track) => ({
      ...track,
      id: track.id ?? track.videoId,
    }));
  }

  return KDH_PLAYLIST;
}
