import type { VideoItem } from "./types";

const baseVideos = [
  {
    channelName: "Demon Hunters HQ",
    id: "dhhq-001",
    source: "youtube",
    thumbnailUrl: "/images/mock/youtube-01.jpg",
    title: "[LIVE] Demon Hunters World Premiere Stage",
    viewCount: 1842032,
  },
  {
    channelName: "@demonhunters.official",
    id: "insta-001",
    source: "instagram",
    thumbnailUrl: "/images/mock/insta-01.jpg",
    title: "네온 블레이드 안무 챌린지",
    viewCount: 562830,
  },
  {
    channelName: "Demon Hunters HQ",
    id: "dhhq-002",
    source: "youtube",
    thumbnailUrl: "/images/mock/youtube-02.jpg",
    title: "Behind the Scenes: Demon Hunters Night Parade",
    viewCount: 918203,
  },
  {
    channelName: "@demonhunters.official",
    id: "insta-002",
    source: "instagram",
    thumbnailUrl: "/images/mock/insta-02.jpg",
    title: "캐릭터 코스튬 메이크업 세션",
    viewCount: 302114,
  },
  {
    channelName: "Demon Hunters HQ",
    id: "dhhq-003",
    source: "youtube",
    thumbnailUrl: "/images/mock/youtube-03.jpg",
    title: "OST Recording Session with Neon Symphony",
    viewCount: 712228,
  },
] satisfies VideoItem[];

export const MOCK_VIDEOS: VideoItem[] = Array.from({ length: 140 }, (_, index) => {
  const seed = baseVideos[index % baseVideos.length];
  return {
    ...seed,
    id: `${seed.id}-${index}`,
    title: `${seed.title} #${index + 1}`,
    viewCount: seed.viewCount + index * 173,
  };
});

export const FEATURED_VIDEOS = MOCK_VIDEOS.slice(0, 4);
