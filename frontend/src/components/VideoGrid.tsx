import Image from "next/image";
import type { AdItem, VideoItem, VideoSource } from "@/lib/types";
import { VideoCard } from "./VideoCard";

type VideoGridProps = {
  videos: VideoItem[];
  onSelect?: (video: VideoItem) => void;
  sectionId?: string;
  filterTabs?: Array<{ id: "all" | VideoSource; label: string }>;
  activeFilter?: "all" | VideoSource;
  onFilterChange?: (next: "all" | VideoSource) => void;
  inlineAd?: AdItem | null;
};

const GRID_BANNER_INSERT_INDEX = 30;

export function VideoGrid({
  videos,
  onSelect,
  sectionId,
  filterTabs,
  activeFilter,
  onFilterChange,
  inlineAd,
}: VideoGridProps) {
  const preparedGridItems = videos.map((video, index) => (
    <VideoCard
      index={index}
      key={video.id}
      onSelect={onSelect ? () => onSelect(video) : undefined}
      video={video}
    />
  ));

  if (inlineAd && videos.length >= GRID_BANNER_INSERT_INDEX) {
    const insertPosition = Math.min(GRID_BANNER_INSERT_INDEX, preparedGridItems.length);
    preparedGridItems.splice(
      insertPosition,
      0,
      <a
        className="col-span-2 flex w-full flex-col items-center gap-2 rounded-3xl border border-white/12 bg-gradient-to-r from-black/70 via-kdh-neon-purple/20 to-kdh-electric-blue/10 px-3 py-1 text-center text-white shadow-banner transition hover:border-kdh-neon-purple/50 hover:bg-kdh-neon-purple/10 sm:col-span-3 md:col-span-4 lg:col-span-6 lg:flex-row lg:items-center lg:justify-center lg:gap-4"
        href={inlineAd.url}
        key={`video-grid-sponsored-banner-${inlineAd.id}`}
        rel="sponsored noopener noreferrer"
        target="_blank"
      >
        <div className="flex flex-col items-center gap-2 text-center text-[11px] text-white/90 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
          <div className="flex flex-col items-center gap-[1px] text-center">
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-kdh-metallic-silver/70">
              <span className="h-2 w-2 rounded-full bg-kdh-neon-purple/70 shadow-[0_0_12px_rgba(162,89,255,0.7)]" aria-hidden="true" />
              Sponsored
            </span>
            <p className="text-sm font-semibold leading-tight text-white sm:text-base">{inlineAd.title}</p>
            <p className="max-w-2xl text-[10px] leading-tight sm:text-xs">Tap to check current pricing and availability on Amazon.</p>
          </div>
          <span className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-kdh-electric-blue/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-black transition hover:bg-kdh-electric-blue">
            {inlineAd.cta}
          </span>
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden border border-white/15 bg-black/40 sm:h-20 sm:w-20">
            <Image
              alt={inlineAd.title}
              className="object-contain p-1"
              fill
              loading="lazy"
              sizes="80px"
              src={inlineAd.image}
            />
          </div>
        </div>
      </a>
    );
  }

  return (
    <section className="space-y-6" id={sectionId}>
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-kdh-metallic-silver/70">
            Archive Grid
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-50">
            Latest Demon Hunters Shorts
          </h2>
        </div>
        {filterTabs && filterTabs.length > 0 && onFilterChange ? (
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em]">
            <span className="text-kdh-metallic-silver/80">Content Filter</span>
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  className={`rounded-full border px-4 py-2 transition ${
                    isActive
                      ? "border-kdh-neon-purple/70 bg-kdh-neon-purple/20 text-white"
                      : "border-white/10 text-kdh-metallic-silver/80 hover:border-kdh-electric-blue/60 hover:text-white"
                  }`}
                  key={tab.id}
                  onClick={() => onFilterChange(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {preparedGridItems}
      </div>
    </section>
  );
}
