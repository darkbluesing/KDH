"""Flask application serving TikTok video grid."""
from __future__ import annotations

import os
import sys
from dataclasses import asdict, dataclass
from typing import List, Optional

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

from crawler import DEFAULT_KEYWORD, CrawlerResult, get_tiktok_videos

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

app = Flask(__name__)
CORS(app)

@dataclass(slots=True)
class YouTubeVideo:
    """Minimal metadata required to render a a YouTube video embed."""

    video_id: str
    video_url: str
    author_id: str
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    channel_name: Optional[str] = None

def get_youtube_videos(query: str, limit: int = 100) -> list[YouTubeVideo]:
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        print("YOUTUBE_API_KEY environment variable not set.", file=sys.stderr)
        return []

    youtube = build("youtube", "v3", developerKey=api_key)
    videos: list[YouTubeVideo] = []

    try:
        search_response = youtube.search().list(
            q=query,
            type="video",
            part="id,snippet",
            maxResults=limit,
            videoEmbeddable="true",
        ).execute()

        for search_result in search_response.get("items", []):
            video_id = search_result["id"]["videoId"]
            title = search_result["snippet"]["title"]
            channel_name = search_result["snippet"]["channelTitle"]
            thumbnail_url = search_result["snippet"]["thumbnails"]["high"]["url"]
            
            videos.append(
                YouTubeVideo(
                    video_id=video_id,
                    video_url=f"https://www.youtube.com/watch?v={video_id}",
                    author_id=search_result["snippet"]["channelId"],
                    thumbnail_url=thumbnail_url,
                    title=title,
                    channel_name=channel_name,
                )
            )
    except HttpError as e:
        print(f"An HTTP error {e.resp.status} occurred:\n{e.content}", file=sys.stderr)
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)

    return videos



def _serialize_videos(result: CrawlerResult) -> list[dict[str, object]]:
    videos = []
    for video in result.videos:
        video_dict = asdict(video)
        # The frontend expects a `mediaUrl` field for direct video playback.
        video_dict["mediaUrl"] = video_dict.get("play_url") or video_dict.get("download_url")
        video_dict["authorId"] = video.author_id
        videos.append(video_dict)
    return videos


@app.route("/")
def index():
    keyword = _resolve_keyword(request.args.get("q"))
    result = get_tiktok_videos(keyword)
    return render_template(
        "index.html",
        keyword=keyword,
        videos=result.videos,
        total=len(result.videos),
        from_cache=result.from_cache,
        error_message=result.error,
    )


@app.route("/refresh")
def refresh():
    keyword = _resolve_keyword(request.args.get("q"))
    result = get_tiktok_videos(keyword, force_refresh=True)
    return render_template(
        "index.html",
        keyword=keyword,
        videos=result.videos,
        total=len(result.videos),
        from_cache=result.from_cache,
        error_message=result.error,
    )


def _resolve_keyword(raw_keywords: Optional[str]) -> List[str]:
    if raw_keywords:
        keywords = [k.strip() for k in raw_keywords.split(',') if k.strip()]
    else:
        keywords = []
    return keywords or DEFAULT_KEYWORD


@app.route("/api/videos")
def api_videos():
    keywords = _resolve_keyword(request.args.get("q"))
    limit = int(request.args.get("limit", 100))
    force_refresh = request.args.get("force_refresh", "false").lower() == "true"
    app.logger.info(f"force_refresh: {force_refresh}")
    result = get_tiktok_videos(keywords, num_videos=limit, force_refresh=force_refresh)
    return jsonify({
        "keyword": keywords,
        "total": len(result.videos),
        "from_cache": result.from_cache,
        "videos": _serialize_videos(result),
    })


@app.route("/api/youtube/videos")
def api_youtube_videos():
    query = _resolve_keyword(request.args.get("q"))
    limit = int(request.args.get("limit", 100)) # Default limit to 100

    youtube_videos = get_youtube_videos(query, limit=limit)

    # Convert YouTubeVideo objects to a format compatible with frontend's VideoItem
    # Assuming VideoItem expects 'source', 'id', 'title', 'thumbnailUrl', 'permalink', 'channelName'
    serialized_videos = []
    for video in youtube_videos:
        serialized_videos.append({
            "id": video.video_id,
            "title": video.title,
            "source": "youtube",
            "channelName": video.channel_name,
            "thumbnailUrl": video.thumbnail_url,
            "permalink": video.video_url,
            "mediaUrl": video.video_url, # For YouTube, mediaUrl can be the video_url
        })

    payload = {
        "keyword": query,
        "total": len(serialized_videos),
        "videos": serialized_videos,
    }
    return jsonify(payload), 200


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "1") == "1"
    port = int(os.getenv("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
