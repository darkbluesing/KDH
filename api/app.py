"""Flask application serving TikTok video grid."""
from __future__ import annotations

import os
from dataclasses import asdict
from typing import List, Optional

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

from crawler import DEFAULT_KEYWORD, CrawlerResult, get_tiktok_videos

app = Flask(__name__)
CORS(app)

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


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "1") == "1"
    port = int(os.getenv("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=debug_mode)

