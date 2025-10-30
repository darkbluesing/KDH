'use client';

import Image from "next/image";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdModal } from "@/components/AdModal";
import { VideoModal } from "@/components/VideoModal";
import { SideBanner } from "@/components/SideBanner";
import { VideoGrid } from "@/components/VideoGrid";
import { adsList } from "@/data/adsList";
import { MOCK_VIDEOS } from "@/lib/mockVideos";
import type { AdItem, VideoItem, VideoSource } from "@/lib/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { fetchCombinedVideos } from "@/services/videoService";

const FILTER_TABS: Array<{ id: "all" | VideoSource; label: string }> = [
  { id: "all", label: "All" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
];

const YOUTUBE_FALLBACK = MOCK_VIDEOS.filter((video) => video.source === "youtube");
const TIKTOK_FALLBACK = MOCK_VIDEOS.filter((video) => video.source === "tiktok");

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kpdh.world";

const FALLBACK_UPLOAD_DATE = "2024-01-01";

const INLINE_BANNER_FEATURED_ID = 100;

const findAdById = (id: number): AdItem | null => adsList.find((ad) => ad.id === id) ?? null;

const DEFAULT_INLINE_BANNER_AD: AdItem | null =
  findAdById(INLINE_BANNER_FEATURED_ID) ?? adsList[0] ?? null;

const resolveInlineBannerOverride = (): AdItem | null => {
  const override = process.env.NEXT_PUBLIC_INLINE_BANNER_AD_ID;
  if (!override) {
    return null;
  }

  const parsedId = Number.parseInt(override, 10);
  if (Number.isNaN(parsedId)) {
    return null;
  }

  return findAdById(parsedId);
};

const buildAdQueuePool = (inlineAd: AdItem | null): AdItem[] => {
  if (!inlineAd) {
    return adsList;
  }

  return adsList.filter((ad) => ad.id !== inlineAd.id);
};

const normaliseUploadDate = (date?: string): string => {
  if (!date) {
    return FALLBACK_UPLOAD_DATE;
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return FALLBACK_UPLOAD_DATE;
  }
  return parsed.toISOString().split("T")[0];
};

function interleaveCollections(youtubeClips: VideoItem[], tiktokClips: VideoItem[]): VideoItem[] {
  const maxLength = Math.max(youtubeClips.length, tiktokClips.length);
  const interleaved: VideoItem[] = [];
  const usedIds = new Set<string>();

  for (let index = 0; index < maxLength; index += 1) {
    const youtubeClip = youtubeClips[index];
    const tiktokClip = tiktokClips[index];

    if (youtubeClip && !usedIds.has(youtubeClip.id)) {
      usedIds.add(youtubeClip.id);
      interleaved.push(youtubeClip);
    }

    if (tiktokClip && !usedIds.has(tiktokClip.id)) {
      usedIds.add(tiktokClip.id);
      interleaved.push(tiktokClip);
    }
  }

  return interleaved;
}

const INITIAL_ALL_VIDEOS = interleaveCollections(YOUTUBE_FALLBACK, TIKTOK_FALLBACK);

const shuffleArray = <T,>(input: readonly T[]): T[] => {
  const output = [...input];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
};

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<"all" | VideoSource>("all");
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_ALL_VIDEOS);
  const [youtubeVideos, setYoutubeVideos] = useState<VideoItem[]>(YOUTUBE_FALLBACK);
  const [tiktokVideos, setTiktokVideos] = useState<VideoItem[]>(TIKTOK_FALLBACK);
  const [isVideosLoading, setIsVideosLoading] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [adQueue, setAdQueue] = useState<AdItem[]>([]);
  const [activeAd, setActiveAd] = useState<AdItem | null>(null);
  const inlineBannerOverride = useMemo(resolveInlineBannerOverride, []);
  const fallbackInlineBanner = useMemo(
    () => inlineBannerOverride ?? DEFAULT_INLINE_BANNER_AD,
    [inlineBannerOverride]
  );
  const inlineBannerQueuePool = useMemo(
    () => buildAdQueuePool(fallbackInlineBanner),
    [fallbackInlineBanner]
  );
  const [inlineBannerAd, setInlineBannerAd] = useState<AdItem | null>(() => fallbackInlineBanner);

  const isMountedRef = useRef(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadVideos = useCallback(async (forceRefresh = false) => {
    setIsVideosLoading(true);

    const latestVideos = await fetchCombinedVideos(forceRefresh);

    if (!isMountedRef.current) {
      return;
    }

    if (latestVideos.length) {
      const youtubeOnly = latestVideos.filter((video) => video.source === "youtube");
      const tiktokOnly = latestVideos.filter((video) => video.source === "tiktok");

      const youtubePool = youtubeOnly.length ? youtubeOnly : YOUTUBE_FALLBACK;
      const tiktokPool = tiktokOnly.length ? tiktokOnly : TIKTOK_FALLBACK;
      const combined = latestVideos.length ? latestVideos : interleaveCollections(youtubePool, tiktokPool);

      setYoutubeVideos(youtubePool);
      setTiktokVideos(tiktokPool);
      setVideos(combined.length ? combined : INITIAL_ALL_VIDEOS);
    } else {
      setYoutubeVideos(YOUTUBE_FALLBACK);
      setTiktokVideos(TIKTOK_FALLBACK);
      setVideos(INITIAL_ALL_VIDEOS);
    }

    setIsVideosLoading(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    loadVideos();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadVideos]);

  useEffect(() => {
    const seeded = shuffleArray(inlineBannerQueuePool);
    setAdQueue(seeded);

    if (fallbackInlineBanner) {
      setInlineBannerAd(fallbackInlineBanner);
      return;
    }

    setInlineBannerAd(seeded[0] ?? null);
  }, [fallbackInlineBanner, inlineBannerQueuePool]);

  const cycleAd = useCallback(() => {
    setAdQueue((currentQueue) => {
      let queue = currentQueue;

      if (!queue.length) {
        queue = shuffleArray(inlineBannerQueuePool);
      }

      if (!queue.length) {
        setActiveAd(null);
        if (!fallbackInlineBanner) {
          setInlineBannerAd(null);
        }
        return queue;
      }

      const [nextAd, ...remaining] = queue;
      setActiveAd(nextAd);

      if (fallbackInlineBanner) {
        return remaining;
      }

      if (remaining.length) {
        setInlineBannerAd(remaining[0] ?? null);
        return remaining;
      }

      const reshuffled = shuffleArray(inlineBannerQueuePool);

      if (reshuffled.length > 1 && reshuffled[0].id === nextAd.id) {
        [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
      }

      setInlineBannerAd(reshuffled[0] ?? null);
      return reshuffled;
    });
  }, [fallbackInlineBanner, inlineBannerQueuePool]);

  const filteredVideos = useMemo(() => {
    if (activeFilter === "all") {
      return videos;
    }

    if (activeFilter === "youtube") {
      return youtubeVideos.length ? youtubeVideos : YOUTUBE_FALLBACK;
    }

    return tiktokVideos.length ? tiktokVideos : TIKTOK_FALLBACK;
  }, [activeFilter, videos, youtubeVideos, tiktokVideos]);

  const [displayLimit, setDisplayLimit] = useState(20);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleLoadMore = () => {
    setDisplayLimit((prevLimit) => prevLimit + 20);
  };

  const displayedVideos = isMobile ? filteredVideos.slice(0, displayLimit) : filteredVideos;

  const handleVideoSelect = useCallback((video: VideoItem) => {
    setSelectedVideo(video);
    cycleAd();
    setIsVideoOpen(false);
    setIsAdOpen(true);
  }, [cycleAd]);

  const handleAdClose = useCallback(() => {
    setIsAdOpen(false);
    if (selectedVideo) {
      setTimeout(() => {
        setIsVideoOpen(true);
      }, 200);
    }
  }, [selectedVideo]);

  const handleVideoClose = useCallback(() => {
    setIsVideoOpen(false);
    setSelectedVideo(null);
  }, []);

  const videoCollectionJsonLd = useMemo(() => {
    const seenIds = new Set<string>();
    const baseCollection: VideoItem[] = [];

    for (const video of videos.length ? videos : INITIAL_ALL_VIDEOS) {
      if (!video?.id) {
        continue;
      }

      if (seenIds.has(video.id)) {
        continue;
      }

      seenIds.add(video.id);
      baseCollection.push(video);

      if (baseCollection.length >= 24) {
        break;
      }
    }

    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "KPDH - K-POP Demon Hunters Shorts Archive",
      description: "Browse dozens of K-POP Demon Hunters short videos in one cinematic grid.",
      url: SITE_URL,
      inLanguage: ["ko", "en"],
      hasPart: baseCollection.map((video) => ({
        "@type": "VideoObject",
        name: video.title,
        description: video.channelName
          ? `${video.channelName} clip: ${video.title}`
          : `Short video: ${video.title}`,
        thumbnailUrl: video.thumbnailUrl ?? `${SITE_URL}/og-image.png`,
        uploadDate: normaliseUploadDate(video.publishedAt),
        contentUrl: video.permalink ?? video.mediaUrl ?? `${SITE_URL}/videos/${video.id}`,
        embedUrl: video.mediaUrl ?? undefined,
        publisher: video.channelName
          ? {
              "@type": "Organization",
              name: video.channelName,
            }
          : undefined,
        interactionStatistic:
          typeof video.viewCount === "number"
            ? {
                "@type": "InteractionCounter",
                interactionType: {
                  "@type": "WatchAction",
                },
                userInteractionCount: video.viewCount,
              }
            : undefined,
      })),
    } as const;
  }, [videos]);

  return (
    <>
      <Script
        id="jsonld-video-collection"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoCollectionJsonLd) }}
      />
      <div className="relative isolate overflow-visible">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 blur-3xl">
          <div className="mx-auto h-72 w-full max-w-4xl bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.35),transparent_60%)]" />
        </div>

        <div className="relative z-10 mx-auto min-h-screen w-full max-w-none px-[10px] pb-20 pt-1 sm:pt-2">
          <main className="mx-auto flex w-full max-w-[1380px] flex-col gap-10 rounded-[32px] bg-black/10 px-[10px] pb-6 pt-2 sm:pt-3 lg:-mt-10 xl:-mt-16 backdrop-blur-sm">
            <section className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
              <div className="max-w-2xl space-y-6">
                <div className="relative mx-auto max-w-7xl overflow-visible">
                  <Image
                    alt="K-POP Demon Hunters Logo"
                    className="h-auto w-full"
                    height={200}
                    src="/main_logo.webp"
                    width={600}
                    priority
                  />
                </div>
                <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Discover the K-POP Demon Hunters world in the cinematic grid
                </h1>
                <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
                  Browse every fan-favorite highlight, fancam, and rehearsal clip—uniting Demon Hunters shorts scattered across YouTube and TikTok into one immersive feed.
                </p>
                <div className="flex flex-wrap gap-4" id="updates">
                  <button
                    className="group relative overflow-hidden rounded-full border border-kdh-electric-blue/60 bg-kdh-electric-blue/20 px-6 py-3 text-sm font-medium uppercase tracking-[0.25em] text-kdh-metallic-silver shadow-neon transition hover:border-kdh-neon-purple hover:text-white"
                    disabled={isVideosLoading}
                    onClick={() => loadVideos(true)}
                    type="button"
                  >
                    <span className="absolute inset-0 -z-[1] bg-[radial-gradient(circle_at_top_right,rgba(162,89,255,0.45),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    Refresh Videos
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-6 lg:mt-[120px] xl:mt-[140px]">
                <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-kdh-deep-black/80 via-kdh-charcoal/60 to-black/60 p-0.5 shadow-[0_25px_60px_rgba(20,0,40,0.45)]">
                  <div className="rounded-[24px] border border-white/5 bg-black/40 p-2 sm:p-3">
                    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/5">
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        className="h-full w-full"
                        height="315"
                        referrerPolicy="strict-origin-when-cross-origin"
                        src="https://www.youtube.com/embed/videoseries?si=RGMOSKy2NrhLsfXb&amp;list=PLVfChAjsg5xNo48alTI6acCZG5qjA8I8W"
                        title="YouTube video player"
                        width="560"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>

                <dl className="grid w-full max-w-4xl grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-left text-sm text-white backdrop-blur" id="featured">
                  <div className="space-y-3 leading-relaxed">
                    <div className="flex items-start gap-3">
                      <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 rounded-full bg-kdh-neon-purple/70 shadow-[0_0_16px_rgba(162,89,255,0.65)]" />
                      <p className="text-sm font-medium text-white">First Netflix film with 300 million+ views, all-time No.1.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 rounded-full bg-kdh-electric-blue/60 shadow-[0_0_12px_rgba(69,137,255,0.6)]" />
                      <p className="text-sm font-medium text-white">Eight OST tracks on Billboard Hot 100, &#39;Golden&#39; No.1 for five weeks.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 rounded-full bg-kdh-metallic-silver/70 shadow-[0_0_12px_rgba(196,203,223,0.45)]" />
                      <p className="text-sm font-medium text-white">Simultaneous No.1 on Billboard 200, Hot 100, and Global 200 charts.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 rounded-full bg-kdh-bloody-red/70 shadow-[0_0_14px_rgba(255,69,100,0.55)]" />
                      <p className="text-sm font-medium text-white">No.1 on Netflix Global Top 10 Movies list.</p>
                    </div>
                  </div>
                </dl>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,160px)_minmax(0,1fr)_minmax(0,160px)] lg:gap-x-[10px] lg:items-start">
              <SideBanner position="left" />

              <section className="space-y-8" id="grid">
                {isVideosLoading ? (
                  <p className="text-sm text-kdh-metallic-silver/70">YouTube 최신 영상을 불러오는 중입니다...</p>
                ) : null}

                {isMounted ? (
                  <>
                    <VideoGrid
                      activeFilter={activeFilter}
                      inlineAd={inlineBannerAd}
                      filterTabs={FILTER_TABS}
                      onFilterChange={setActiveFilter}
                      onSelect={handleVideoSelect}
                      sectionId="grid"
                      videos={displayedVideos}
                    />

                    {isMobile && displayLimit < filteredVideos.length ? (
                      <div className="flex justify-center">
                        <button
                          className="group relative overflow-hidden rounded-full border border-kdh-electric-blue/60 bg-kdh-electric-blue/20 px-6 py-3 text-sm font-medium uppercase tracking-[0.25em] text-kdh-metallic-silver shadow-neon transition hover:border-kdh-neon-purple hover:text-white"
                          onClick={handleLoadMore}
                          type="button"
                        >
                          <span className="absolute inset-0 -z-[1] bg-[radial-gradient(circle_at_top_right,rgba(162,89,255,0.45),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          Load More
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="flex h-64 w-full items-center justify-center">
                    <p className="text-sm text-kdh-metallic-silver/70">Loading Demon Hunters shorts...</p>
                  </div>
                )}
              </section>

              <SideBanner position="right" />
            </div>
          </main>
        </div>

        <AdModal ad={activeAd} isOpen={isAdOpen} onClose={handleAdClose} payload={selectedVideo} />
        <VideoModal isOpen={isVideoOpen} onClose={handleVideoClose} payload={isVideoOpen ? selectedVideo : null} />
      </div>
    </>
  );
}
