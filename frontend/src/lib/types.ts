export type VideoSource = "youtube" | "tiktok";

export interface VideoItem {
  id: string;
  title: string;
  source: VideoSource;
  publishedAt?: string;
  channelName?: string;
  viewCount?: number;
  thumbnailUrl?: string;
  permalink?: string;
  mediaUrl?: string;
  authorId?: string;
}

export interface AdItem {
  id: number;
  url: string;
  image: string;
  title: string;
  cta: string;
}

export interface PlatformConfig {
  name: string;
  baseUrl: string;
  accentColor: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  duration?: number;
  thumbnailUrl?: string;
  publishedAt?: string;
}
