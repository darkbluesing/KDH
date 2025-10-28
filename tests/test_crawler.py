import unittest
from unittest.mock import AsyncMock, patch
import asyncio
import time # Import time module
from crawler import _normalise_keywords, _extract_videos, get_tiktok_videos, TikTokVideo, CrawlerResult, DEFAULT_KEYWORD, _CACHE

class TestCrawler(unittest.TestCase):

    def setUp(self):
        # Clear the cache before each test to ensure test isolation
        _CACHE.clear()

    def test_normalise_keywords(self):
        self.assertEqual(_normalise_keywords(None), [])
        self.assertEqual(_normalise_keywords([]), [])
        self.assertEqual(_normalise_keywords(["  kpop  ", "demon hunters "]), ["kpop", "demon hunters"])
        self.assertEqual(_normalise_keywords(["", "  "]), [])
        self.assertEqual(_normalise_keywords(["kpop"]), ["kpop"])

    def test_extract_videos(self):
        # Test with empty data block
        self.assertEqual(_extract_videos([]), [])

        # Test with mixed data (non-video and video)
        data_block = [
            {"type": 2, "item": {"id": "user1"}}, # Non-video
            {
                "type": 1,
                "item": {
                    "id": "7000000000000000001",
                    "desc": "Test Video 1",
                    "author": {"uniqueId": "testuser1"},
                    "video": {
                        "cover": "http://example.com/cover1.jpg",
                        "downloadAddr": "http://example.com/video1.mp4",
                        "playAddr": "http://example.com/play1.mp4",
                    },
                },
            },
            {
                "type": 1,
                "item": {
                    "id": "7000000000000000002",
                    "desc": "Test Video 2",
                    "author": {"id": "testuser2"},
                    "video": {
                        "cover": "http://example.com/cover2.jpg",
                        "playAddr": "http://example.com/play2.mp4",
                    },
                },
            },
            {
                "type": 1,
                "item": {
                    "id": "7000000000000000005",
                    "desc": "Test Video 5",
                    "author": {"uniqueId": "testuser5"},
                    "video": {
                        "originCover": {
                            "urlList": [
                                "http://example.com/cover5-primary.jpg",
                                "http://example.com/cover5-secondary.jpg",
                            ]
                        },
                        "downloadAddr": "http://example.com/video5.mp4",
                    },
                },
            },
            {
                "type": 1,
                "item": { # Missing video ID
                    "desc": "Invalid Video",
                    "author": {"uniqueId": "invaliduser"},
                    "video": {},
                },
            },
        ]
        videos = _extract_videos(data_block)
        self.assertEqual(len(videos), 3)
        self.assertEqual(videos[0].video_id, "7000000000000000001")
        self.assertEqual(videos[0].title, "Test Video 1")
        self.assertEqual(videos[0].author_id, "testuser1")
        self.assertEqual(videos[0].thumbnail_url, "http://example.com/cover1.jpg")
        self.assertEqual(videos[0].download_url, "http://example.com/video1.mp4")
        self.assertEqual(videos[0].play_url, "http://example.com/play1.mp4")

        self.assertEqual(videos[1].video_id, "7000000000000000002")
        self.assertEqual(videos[1].title, "Test Video 2")
        self.assertEqual(videos[1].author_id, "testuser2")
        self.assertEqual(videos[1].thumbnail_url, "http://example.com/cover2.jpg")
        self.assertIsNone(videos[1].download_url)
        self.assertEqual(videos[1].play_url, "http://example.com/play2.mp4")

        self.assertEqual(videos[2].video_id, "7000000000000000005")
        self.assertEqual(videos[2].author_id, "testuser5")
        self.assertEqual(videos[2].thumbnail_url, "http://example.com/cover5-primary.jpg")

    @patch('crawler._run_async')
    def test_get_tiktok_videos_success(self, mock_run_async):
        mock_run_async.return_value = ([
            TikTokVideo(
                video_id="7000000000000000003",
                video_url="https://www.tiktok.com/@mockuser3/video/7000000000000000003",
                author_id="mockuser3",
                title="Mock Video 3",
                play_url="http://mock.com/play3.mp4",
            ),
        ], None)

        result = get_tiktok_videos(keywords=["test"], num_videos=1)
        self.assertIsInstance(result, CrawlerResult)
        self.assertEqual(len(result.videos), 1)
        self.assertEqual(result.videos[0].video_id, "7000000000000000003")
        self.assertFalse(result.from_cache)
        self.assertIsNone(result.error)
        mock_run_async.assert_called_once()

    @patch('crawler._run_async')
    def test_get_tiktok_videos_no_results(self, mock_run_async):
        mock_run_async.return_value = ([], None)

        result = get_tiktok_videos(keywords=["noresults"], num_videos=1)
        self.assertIsInstance(result, CrawlerResult)
        self.assertEqual(len(result.videos), 0)
        self.assertFalse(result.from_cache)
        self.assertIsNotNone(result.error)
        self.assertIn("no video results", result.error)
        mock_run_async.assert_called_once()

    @patch('crawler._run_async')
    def test_get_tiktok_videos_exception(self, mock_run_async):
        mock_run_async.side_effect = Exception("API Error")

        result = get_tiktok_videos(keywords=["error"], num_videos=1)
        self.assertIsInstance(result, CrawlerResult)
        self.assertEqual(len(result.videos), 0)
        self.assertFalse(result.from_cache)
        self.assertIsNotNone(result.error)
        self.assertIn("API Error", result.error)
        mock_run_async.assert_called_once()

    @patch('crawler._run_async')
    def test_get_tiktok_videos_cache_hit(self, mock_run_async):
        # Manually populate the cache for the test with the correct key
        _CACHE["cached"] = {
            "videos": [
                TikTokVideo(
                    video_id="7000000000000000004",
                    video_url="https://www.tiktok.com/@mockuser4/video/7000000000000000004",
                    author_id="mockuser4",
                    title="Cached Video 4",
                    play_url="http://mock.com/play4.mp4",
                ),
            ],
            "timestamp": time.time() + 1000, # Ensure it's not expired
            "next_cursor": None
        }

        result = get_tiktok_videos(keywords=["cached"], num_videos=1, force_refresh=False)
        self.assertIsInstance(result, CrawlerResult)
        self.assertEqual(len(result.videos), 1)
        self.assertTrue(result.from_cache)
        self.assertIsNone(result.error)
        mock_run_async.assert_not_called() # _run_async should not be called on cache hit

    @patch('crawler.DEFAULT_KEYWORD', []) # Patch DEFAULT_KEYWORD to be empty
    def test_get_tiktok_videos_value_error_empty_keywords(self):
        with self.assertRaises(ValueError) as cm:
            get_tiktok_videos(keywords=[])
        self.assertIn("Keywords list must not be empty", str(cm.exception))

if __name__ == '__main__':
    unittest.main()
