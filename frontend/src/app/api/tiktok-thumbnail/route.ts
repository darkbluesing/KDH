import { NextResponse } from "next/server";

const ALLOWED_CDN_HOST_PATTERN = /^(?:[a-z0-9-]+\.)*(?:tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com)$/i;
const ALLOWED_PERMALINK_HOST_PATTERN = /^(?:www\.)?tiktok\.com$/i;
const TIKTOK_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function normalisePermalink(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = new URL(raw);
    if (!ALLOWED_PERMALINK_HOST_PATTERN.test(parsed.hostname)) {
      return null;
    }
    if (!/\/video\//.test(parsed.pathname)) {
      return null;
    }
    parsed.hash = "";
    return parsed.toString();
  } catch (error) {
    console.warn("tiktok-thumbnail: invalid permalink", { raw, error });
    return null;
  }
}

function normaliseCdnUrl(raw: string | undefined): URL | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") {
      return null;
    }
    if (!ALLOWED_CDN_HOST_PATTERN.test(parsed.hostname)) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn("tiktok-thumbnail: invalid CDN URL", { raw, error });
    return null;
  }
}

async function fetchThumbnailFromOembed(permalink: string): Promise<URL | null> {
  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(permalink)}`, {
      headers: {
        "User-Agent": TIKTOK_USER_AGENT,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("tiktok-thumbnail: failed to fetch oEmbed", {
        permalink,
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const data = (await response.json()) as { thumbnail_url?: string };
    return normaliseCdnUrl(data.thumbnail_url);
  } catch (error) {
    console.error("tiktok-thumbnail: error calling oEmbed", { permalink, error });
    return null;
  }
}

async function fetchImageBuffer(sourceUrl: URL): Promise<Response | null> {
  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": TIKTOK_USER_AGENT,
        Referer: "https://www.tiktok.com/",
      },
    });

    if (!response.ok) {
      console.warn("tiktok-thumbnail: upstream failure", {
        url: sourceUrl.href,
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    return response;
  } catch (error) {
    console.error("tiktok-thumbnail: fetch error", { url: sourceUrl.href, error });
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const permalink = normalisePermalink(searchParams.get("permalink"));
  let sourceUrl = normaliseCdnUrl(searchParams.get("src") ?? undefined);

  if (!sourceUrl && permalink) {
    sourceUrl = await fetchThumbnailFromOembed(permalink);
  }

  if (!sourceUrl) {
    return NextResponse.json({ error: "Unable to resolve TikTok thumbnail" }, { status: 400 });
  }

  const upstreamResponse = await fetchImageBuffer(sourceUrl);
  if (!upstreamResponse) {
    return NextResponse.json({ error: "TikTok CDN rejected request" }, { status: 502 });
  }

  const contentType = upstreamResponse.headers.get("content-type") ?? "image/jpeg";
  const etag = upstreamResponse.headers.get("etag");
  const buffer = await upstreamResponse.arrayBuffer();

  const response = new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
      ...(etag ? { ETag: etag } : {}),
    },
  });

  return response;
}
