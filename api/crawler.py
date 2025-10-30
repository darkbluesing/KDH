"""TikTok crawling helpers used by the Flask app."""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import sys
import time
from dataclasses import asdict, dataclass
from typing import Iterable, List, Optional

from TikTokApi import TikTokApi

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.DEBUG, format="[%(levelname)s] %(message)s")


SEARCH_URL = "https://www.tiktok.com/api/search/general/full/"
WEB_SEARCH_CODE = '{"tiktok":{"client_params_x":{"search_engine":{"ies_mt_user_live_video_card_use_libra":1,"mt_search_general_user_live_video_card":1}},"search_server":{}}}'
MAX_PAGES = 50

def _build_params(keyword: str, cursor: int, count: int) -> dict:
    return {
        "keyword": keyword,
        "offset": cursor, # TikTok API uses 'offset' for cursor-based pagination in search
        "count": count, # Use the passed count
        "from_page": "search",
        "search_id": "some_search_id", # TikTok API often requires a search_id
        "source": "search_history",
        "web_search_code": WEB_SEARCH_CODE,
    }


@dataclass(slots=True)
class TikTokVideo:
    """Minimal metadata required to render a TikTok video embed."""

    video_id: str
    video_url: str
    author_id: str
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    download_url: Optional[str] = None
    play_url: Optional[str] = None


@dataclass(slots=True)
class CrawlerResult:
    """Container for crawler output used by the Flask layer."""

    videos: List[TikTokVideo]
    from_cache: bool
    error: Optional[str] = None
    next_cursor: Optional[int] = None


import redis


_CACHE: dict[str, dict[str, object]] = {}
CACHE_TTL = int(os.getenv("TIKTOK_CACHE_TTL", "1800"))  # seconds
DEFAULT_KEYWORD = os.getenv("TIKTOK_KEYWORD", "KPOP DEMON HUNTERS").split(',')

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)
    redis_client.ping()
    logger.info("Successfully connected to Redis at %s:%d", REDIS_HOST, REDIS_PORT)
except redis.exceptions.ConnectionError as e:
    logger.error("Could not connect to Redis at %s:%d. Caching will be disabled. Error: %s", REDIS_HOST, REDIS_PORT, e)
    redis_client = None


def _normalise_keywords(keywords: Optional[List[str]]) -> List[str]:
    if not keywords:
        return []
    return [k.strip() for k in keywords if k.strip()]


def _normalise_thumbnail(candidate: object) -> Optional[str]:
    """Extract the first usable thumbnail URL from TikTok's nested payload."""

    def _pick_from_mapping(mapping: dict) -> Optional[str]:
        values_to_try = [
            mapping.get("url"),
            mapping.get("thumbUrl"),
            mapping.get("thumb_url"),
            mapping.get("cover"),
            mapping.get("origin"),
            mapping.get("uri"),
            mapping.get("urlList"),
            mapping.get("url_list"),
            mapping.get("urls"),
        ]
        for value in values_to_try:
            normalised = _normalise_thumbnail(value)
            if normalised:
                return normalised
        return None

    if isinstance(candidate, str):
        candidate = candidate.strip()
        return candidate or None

    if isinstance(candidate, dict):
        return _pick_from_mapping(candidate)

    if isinstance(candidate, (list, tuple, set)):
        for item in candidate:
            normalised = _normalise_thumbnail(item)
            if normalised:
                return normalised
        return None

    return None


def _extract_videos(data_block: Iterable[dict[str, object]]) -> list[TikTokVideo]:
    videos: list[TikTokVideo] = []
    for entry in data_block:
        if not isinstance(entry, dict):
            continue
        if entry.get("type") != 1:  # non-video results (users, ads, etc.)
            continue
        item = entry.get("item") or {}
        video_id = str(item.get("id") or "").strip()
        if not video_id:
            continue
        author = item.get("author") or {}
        author_id = str(author.get("uniqueId") or author.get("id") or "unknown")
        video_meta = item.get("video") or {}
        cover = _normalise_thumbnail(
            video_meta.get("originCover") or video_meta.get("cover") or video_meta.get("dynamicCover")
        )
        download_url = (
            video_meta.get("downloadAddr")
            or video_meta.get("downloadAddrH265")
            or video_meta.get("downloadAddrWatermark")
        )
        play_url = (
            video_meta.get("playAddr")
            or video_meta.get("playAddrH265")
            or video_meta.get("playApiHref")
        )
        videos.append(
            TikTokVideo(
                video_id=video_id,
                video_url=f"https://www.tiktok.com/@{author_id}/video/{video_id}",
                author_id=author_id,
                thumbnail_url=cover,
                title=item.get("desc") or None,
                download_url=download_url,
                play_url=play_url,
            )
        )
    return videos


async def _fetch_tiktok_videos_async(keywords: List[str], num_videos: int, *, initial_cursor: Optional[int] = None) -> tuple[List[TikTokVideo], Optional[int]]:
    logger.info("Calling _fetch_tiktok_videos_async for keywords: %s, num_videos: %d", keywords, num_videos)
    all_videos: list[TikTokVideo] = []
    seen_ids: set[str] = set()
    last_cursor: Optional[int] = initial_cursor

    async with TikTokApi() as api:
        await api.create_sessions(num_sessions=1, sleep_after=3)

        for keyword in keywords:
            cursor = initial_cursor if initial_cursor is not None else 0
            page = 0

            while len(all_videos) < num_videos and page < MAX_PAGES:
                params = _build_params(keyword, cursor, num_videos) # Pass num_videos as count
                try:
                    response = await api.make_request(url=SEARCH_URL, params=params)
                    logger.debug("TikTok API raw response for keyword '%s': %s", keyword, response)
                except Exception as exc:  # noqa: BLE001
                    logger.error("Request to TikTok search failed for keyword '%s': %s", keyword, exc)
                    return [], None # Return empty list and None cursor on error

                if not isinstance(response, dict):
                    logger.warning("Unexpected TikTok response type for keyword '%s': %s", keyword, type(response))
                    return [], None # Return empty list and None cursor on unexpected response

                data_block = response.get("data") or []
                logger.debug("TikTok API data_block for keyword '%s': %s", keyword, data_block)
                new_videos_from_batch = []
                for video in _extract_videos(data_block):
                    if video.video_id in seen_ids:
                        continue
                    seen_ids.add(video.video_id)
                    new_videos_from_batch.append(video)

                all_videos.extend(new_videos_from_batch)

                logger.info(
                    "Fetched %d/%d TikTok videos (page %d, keyword='%s')",
                    len(all_videos),
                    num_videos,
                    page + 1,
                    keyword,
                )

                page += 1
                has_more = bool(response.get("has_more"))
                if not has_more:
                    logger.info("TikTok search has no more pages (keyword='%s')", keyword)
                    break

                next_cursor = response.get("cursor")
                if next_cursor is None or next_cursor == cursor:
                    logger.info("TikTok returned stagnant cursor for keyword '%s'; stopping pagination.", keyword)
                    break
                cursor = int(next_cursor)
                last_cursor = cursor # Update last_cursor with the latest cursor
            
            if len(all_videos) >= num_videos: # If we've reached the overall limit, stop
                break

    return all_videos[:num_videos], last_cursor


def _run_async(keywords: List[str], num_videos: int, *, initial_cursor: Optional[int]) -> tuple[List[TikTokVideo], Optional[int]]:
    try:
        return asyncio.run(_fetch_tiktok_videos_async(keywords, num_videos, initial_cursor=initial_cursor))
    except RuntimeError as exc:
        if "event loop" not in str(exc).lower():
            raise
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(
            _fetch_tiktok_videos_async(keywords, num_videos, initial_cursor=initial_cursor)
        )
    except Exception:
        # In case of any other exception during async execution, return empty list and None cursor
        return [], None


def get_tiktok_videos(
    keywords: Optional[List[str]] = None,
    num_videos: int = 200,
    *,
    force_refresh: bool = False,
    cursor: Optional[int] = None,
) -> CrawlerResult:
    logger.info("Calling get_tiktok_videos with keywords: %s, num_videos: %d", keywords, num_videos)
    keywords = _normalise_keywords(keywords or DEFAULT_KEYWORD)
    if not keywords:
        raise ValueError("Keywords list must not be empty")

    # Cache key will now be based on sorted keywords and cursor
    normalized_key = "tiktok:" + "_".join(sorted([k.lower() for k in keywords])) + (f"_cursor_{cursor}" if cursor is not None else "")
    
    if not force_refresh and redis_client:
        try:
            cached_data = redis_client.get(normalized_key)
            if cached_data:
                logger.info("Serving TikTok results for '%s' from Redis cache", ", ".join(keywords))
                cached_entry = json.loads(cached_data)
                videos = [TikTokVideo(**v) for v in cached_entry["videos"]]
                return CrawlerResult(videos=videos, from_cache=True, next_cursor=cached_entry.get("next_cursor"))
        except redis.exceptions.RedisError as e:
            logger.error("Redis GET operation failed: %s", e)
        except json.JSONDecodeError as e:
            logger.error("Failed to decode JSON from Redis cache: %s", e)


    logger.info("Bypassing cache for TikTok results for '%s'", ", ".join(keywords))
    try:
        videos, next_cursor = _run_async(keywords, num_videos, initial_cursor=cursor)
        if videos:
            if redis_client:
                try:
                    videos_as_dicts = [asdict(v) for v in videos]
                    cache_payload = {
                        "videos": videos_as_dicts,
                        "next_cursor": next_cursor,
                    }
                    redis_client.set(normalized_key, json.dumps(cache_payload), ex=CACHE_TTL)
                except redis.exceptions.RedisError as e:
                    logger.error("Redis SET operation failed: %s", e)

            return CrawlerResult(videos=videos, from_cache=False, next_cursor=next_cursor)

        error_message = f"no video results for keywords: {', '.join(keywords)}"
        return CrawlerResult(videos=[], from_cache=False, next_cursor=next_cursor, error=error_message)
    except Exception as e:
        logger.error("An error occurred during TikTok crawling: %s", e, exc_info=True)
        return CrawlerResult(videos=[], from_cache=False, error=str(e))


def _parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch TikTok videos via TikTokApi")
    parser.add_argument("keywords", nargs="*", default=DEFAULT_KEYWORD, help="Search keywords (comma-separated)")
    parser.add_argument("--count", type=int, default=200, help="Max videos to fetch")
    parser.add_argument("--refresh", action="store_true", help="Bypass in-memory cache")
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = _parse_args(argv)
    # If keywords are passed as a single string (e.g., from shell), split them
    if isinstance(args.keywords, str):
        keywords_list = args.keywords.split(',')
    else:
        keywords_list = args.keywords

    result = get_tiktok_videos(keywords_list, num_videos=args.count, force_refresh=args.refresh)

    payload = {
        "keywords": keywords_list,
        "total": len(result.videos),
        "from_cache": result.from_cache,
        "videos": [asdict(video) for video in result.videos],
    }
    if result.error:
        payload["error"] = result.error

    # Determine the path to the frontend/public directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(os.path.dirname(script_dir), "frontend", "public", "tiktok_live.json")

    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        logger.info(f"Successfully wrote {len(result.videos)} videos to {output_path}")
    except IOError as e:
        logger.error(f"Failed to write to {output_path}: {e}")
        return 1

    return 0 if result.videos else 1 if result.error else 0


if __name__ == "__main__":
    raise SystemExit(main())
