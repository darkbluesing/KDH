export type VideoSource = "youtube" | "instagram";

export interface VideoItem {
  id: string;
  title: string;
  source: VideoSource;
  publishedAt?: string;
  channelName?: string;
  viewCount?: number;
  thumbnailUrl?: string;
}

export interface PlatformConfig {
  name: string;
  baseUrl: string;
  accentColor: string;
}
