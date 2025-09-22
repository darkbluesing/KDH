import type { VideoItem, VideoSource } from "@/lib/types";
import { MOCK_VIDEOS } from "@/lib/mockVideos";

/**
 * TODO: 실제 API 연동 시 HTTP 호출로 대체합니다.
 * 현재는 정적 모의 데이터를 반환합니다.
 */
export async function fetchVideosBySource(source: VideoSource): Promise<VideoItem[]> {
  if (source === "youtube") {
    return MOCK_VIDEOS.filter((video) => video.source === "youtube");
  }
  if (source === "instagram") {
    return MOCK_VIDEOS.filter((video) => video.source === "instagram");
  }
  return [];
}

export async function fetchCombinedVideos(): Promise<VideoItem[]> {
  return MOCK_VIDEOS;
}
