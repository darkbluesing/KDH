import { NextResponse } from "next/server";

const ALLOWED_HOSTNAME_PATTERN = /^(?:[a-z0-9-]+\.)*(?:tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com)$/i;

function getValidatedSource(url: string | null): URL | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return null;
    }
    if (!ALLOWED_HOSTNAME_PATTERN.test(parsed.hostname)) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn("tiktok-thumbnail: invalid URL", { url, error });
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceUrl = getValidatedSource(searchParams.get("src"));

  if (!sourceUrl) {
    return NextResponse.json({ error: "Invalid or disallowed TikTok thumbnail URL" }, { status: 400 });
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Referer: "https://www.tiktok.com/",
      },
    });
  } catch (error) {
    console.error("tiktok-thumbnail: fetch error", { url: sourceUrl.href, error });
    return NextResponse.json({ error: "Unable to reach TikTok CDN" }, { status: 502 });
  }

  if (!upstreamResponse.ok) {
    console.warn("tiktok-thumbnail: upstream failure", {
      url: sourceUrl.href,
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
    });
    return NextResponse.json({ error: "TikTok CDN rejected request" }, { status: upstreamResponse.status });
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
