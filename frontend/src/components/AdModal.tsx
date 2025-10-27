'use client';

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import type { AdItem, VideoItem } from "@/lib/types";

export type AdModalProps = {
  isOpen: boolean;
  payload: VideoItem | null;
  ad: AdItem | null;
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

export function AdModal({ isOpen, payload, ad, onClose }: AdModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    setImageSrc(ad?.image ?? null);
  }, [ad]);

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
      {isOpen && payload && ad ? (
        <motion.div
          animate="visible"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
          exit="hidden"
          initial="hidden"
          variants={backdropVariants}
        >
          <motion.div
            aria-label="Advertisement Details"
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
              <a
                className="block rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-kdh-neon-purple/60 hover:bg-black/40"
                href={ad.url}
                rel="sponsored noreferrer"
                target="_blank"
              >
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-center">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/60">
                    {imageSrc ? (
                      <Image
                        alt={ad.title}
                        className="object-contain"
                        fill
                        loading="lazy"
                        onError={() => setImageSrc(null)}
                        sizes="(min-width: 640px) 320px, 50vw"
                        src={imageSrc}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(162,89,255,0.4),_transparent_70%)] px-4 py-10 text-center text-sm text-slate-200/80">
                        <span className="text-xs uppercase tracking-[0.35em] text-kdh-metallic-silver/70">
                          Amazon Merch
                        </span>
                        <p className="mt-3 font-semibold text-white">{ad.title}</p>
                        <p className="mt-2 text-[12px] text-slate-300/70">Preview unavailable. Tap to view on Amazon.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 text-sm">
                    <p className="text-[13px] uppercase tracking-[0.3em] text-kdh-metallic-silver/80">
                      Amazon Picks
                    </p>
                    <h2 className="text-xl font-semibold text-white">
                      {ad.title}
                    </h2>
                    <p className="leading-relaxed text-slate-300">
                      Explore Demon Hunters-inspired outfits and gear directly on Amazon.
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-full border border-kdh-electric-blue/60 bg-kdh-electric-blue/20 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-white transition hover:border-kdh-neon-purple hover:bg-kdh-neon-purple/25">
                      {ad.cta} ↗
                    </div>
                    <p className="text-[11px] text-slate-500">
                      * This link uses the Amazon Associates affiliate program.
                    </p>
                  </div>
                </div>
              </a>

              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:border-kdh-bloody-red/60 hover:text-white"
                  onClick={onClose}
                  type="button"
                >
                  Close Ad and Watch Video
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
