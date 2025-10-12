'use client';

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import type { VideoItem } from "@/lib/types";

export type AdModalProps = {
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

export function AdModal({ isOpen, payload, onClose }: AdModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const interactiveNodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, a[href], [tabindex]:not([tabindex=\"-1\"])'
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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && payload ? (
        <motion.div
          animate="visible"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
          exit="hidden"
          initial="hidden"
          variants={backdropVariants}
        >
          <motion.div
            aria-label="광고 상세"
            className="relative w-[min(560px,90vw)] overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-kdh-charcoal via-kdh-deep-black to-black p-8 text-slate-100 shadow-2xl"
            ref={dialogRef}
            role="dialog"
            variants={modalVariants}
          >
            <button
              className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-kdh-neon-purple/60 hover:text-white"
              onClick={onClose}
              ref={closeButtonRef}
              type="button"
            >
              <FiX className="size-5" />
            </button>

            <div className="space-y-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-kdh-metallic-silver/80">
                  광고 안내
                </span>
                <h2 className="text-2xl font-semibold text-white">
                  Demon Hunters X {payload.source === "youtube" ? "YouTube" : "TikTok"}
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  {payload.title} 영상을 시청하기 전에 Demon Hunters 세계관 스페셜 캠페인을 만나보세요.
                  지금 바로 가입하면 한정판 굿즈와 프리미어 상영 티켓을 선착순으로 드립니다.
                </p>
              </div>

              <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-slate-200">
                <p>
                  • 네온 퍼플 & 일렉트릭 블루 테마의 실물 포스터 증정
                </p>
                <p>
                  • 5월 20일 서울 월드 아레나 VIP 좌석 우선 예약권
                </p>
                <p>
                  • Director&apos;s Cut 비하인드 영상 스트리밍 선공개
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:border-kdh-bloody-red/60 hover:text-white"
                  onClick={onClose}
                  type="button"
                >
                  영상 재생하기
                </button>
                <a
                  className="group inline-flex items-center gap-2 rounded-full border border-kdh-neon-purple/60 bg-kdh-neon-purple/20 px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.25em] text-white transition hover:border-kdh-electric-blue/60 hover:bg-kdh-electric-blue/25"
                  href="https://www.youtube.com/results?search_query=K-POP+Demon+Hunters"
                  rel="noreferrer"
                  target="_blank"
                >
                  공식 채널 방문
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
