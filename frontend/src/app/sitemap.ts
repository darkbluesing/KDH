import type { MetadataRoute } from "next";

const FALLBACK_BASE_URL = "https://kpdh.world";

function getBaseUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_BASE_URL;
  return candidate.endsWith("/") ? candidate.slice(0, -1) : candidate;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
