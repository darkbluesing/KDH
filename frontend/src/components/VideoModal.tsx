'use client';

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import { FiX } from "react-icons/fi";
import type { VideoItem } from "@/lib/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const DynamicYouTubeEmbed = dynamic(() => import("@/components/YouTubeEmbed"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <p className="text-sm text-slate-300">Loading YouTube Player...</p>
    </div>
  ),
});

export type VideoModalProps = {
  isOpen: boolean;
  payload: VideoItem | null;
  onClose: () => void;
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export function VideoModal({ isOpen, payload, onClose }: VideoModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const tiktokVideoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const tiktokEmbedSrc = useMemo(() => {
    if (!payload || payload.source !== "tiktok" || !payload.id) {
      return null;
    }
    const params = new URLSearchParams({ lang: "en", autoplay: "1" });
    return `https://www.tiktok.com/embed/${payload.id}?${params.toString()}`;
  }, [payload]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const interactiveNodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, a[href], iframe, [tabindex]:not([tabindex='-1'])"
      );
      if (!interactiveNodes || interactiveNodes.length === 0) {
        return;
      }

      const first = interactiveNodes[0];
      const last = interactiveNodes[interactiveNodes.length - 1];

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (payload?.source === "tiktok" && payload.mediaUrl && tiktokVideoRef.current) {
      const videoElement = tiktokVideoRef.current;
      videoElement.currentTime = 0;
      const playPromise = videoElement.play();
      if (playPromise) {
        playPromise.catch(() => {
          videoElement.muted = false;
        });
      }
    }
  }, [isOpen, payload]);

  useEffect(() => {
    if (isOpen && isMobile) {
      if (payload?.source === 'tiktok' && tiktokEmbedSrc && iframeRef.current) {
        iframeRef.current.requestFullscreen().catch(err => {
          console.error("Error attempting to enable fullscreen for iframe:", err);
        });
      } else if (payload?.source === 'tiktok' && payload.mediaUrl && tiktokVideoRef.current) {
        tiktokVideoRef.current.requestFullscreen().catch(err => {
          console.error("Error attempting to enable fullscreen for video:", err);
        });
      }
    }
  }, [isOpen, isMobile, payload, tiktokEmbedSrc]);

  if (!payload) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          animate="visible"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur"
          exit="hidden"
          initial="hidden"
          role="dialog"
          variants={backdropVariants}
        >
          <motion.div
            aria-label="영상 플레이어"
            className="relative w-[min(420px,92vw)] max-h-[90vh] rounded-3xl border border-white/10 bg-gradient-to-b from-black/80 via-black/90 to-black/95 text-white shadow-xl overflow-y-auto"
            ref={dialogRef}
            variants={modalVariants}
          >
            <div className="flex justify-end p-2 bg-black/50">
              <button
                className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-200 transition hover:border-kdh-neon-purple/60 hover:text-white"
                onClick={onClose}
                ref={closeButtonRef}
                type="button"
              >
                <FiX className="size-5" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="w-full aspect-[9/16] rounded-2xl border border-white/10 bg-black">
                {payload.source === "youtube" ? (
                  <DynamicYouTubeEmbed videoId={payload.id} />
                ) : payload.source === "tiktok" && tiktokEmbedSrc ? (
                  <iframe
                    ref={iframeRef}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                    key={payload.id}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={tiktokEmbedSrc}
                    title={payload.title || "TikTok video"}
                  />
                ) : payload.source === "tiktok" && payload.mediaUrl ? (
                  <video
                    autoPlay
                    className="h-full w-full object-cover"
                    controls
                    key={payload.id}
                    playsInline={!isMobile}
                    preload="auto"
                    ref={tiktokVideoRef}
                    src={payload.mediaUrl}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-300">
                    <span>영상을 재생할 수 없습니다.</span>
                    <span className="text-xs text-slate-400">원본 페이지에서 확인해 주세요.</span>
                    {payload.permalink ? (
                      <a
                        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:border-kdh-neon-purple/60 hover:text-white"
                        href={payload.permalink}
                        rel="noreferrer"
                        target="_blank"
                      >
                        원본 링크로 이동
                      </a>
                    ) : null}
                  </div>
                )}
              </div>

              {payload.source === "tiktok" && payload.permalink ? (
                <div className="pt-2">
                  <a
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-kdh-electric-blue transition hover:text-white"
                    href={payload.permalink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    원본 링크 보기
                  </a>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}