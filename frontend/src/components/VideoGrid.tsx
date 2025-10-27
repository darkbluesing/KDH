import Image from "next/image";
import type { VideoItem, VideoSource } from "@/lib/types";
import { VideoCard } from "./VideoCard";

type VideoGridProps = {
  videos: VideoItem[];
  onSelect?: (video: VideoItem) => void;
  sectionId?: string;
  filterTabs?: Array<{ id: "all" | VideoSource; label: string }>;
  activeFilter?: "all" | VideoSource;
  onFilterChange?: (next: "all" | VideoSource) => void;
};

const GRID_BANNER_INSERT_INDEX = 30;

const GRID_BANNER_AD = {
  href: "https://www.amazon.com/dp/B0FPW9RKXT?crid=39LMK8D21VG12&dib=eyJ2IjoiMSJ9.a99gxwyrvsdJXGI7gm88iQa98NVkE6C2huY5Y-2oMETXb-Z2vtl4Oq6Jb5iTOAfnqTUnEWMpQGw1_7f1BCB0tol9p4xFT6XZKH4bDxnKVmkvhzWUVEGMqCSMB5c3Y9o7QJaozpjilX1_ULAvbZ6s6WcZKzTbR1227hvtUyERhCkmE2V80ktILUoE0f9XS3gm6S6UaPbRLmLySaLIMAoU1d1wadCX5EmSMYt1yxvRtHYARhDZ7PxR0tmzouCZXDKeXV7AsiFMTaSiBvYhxEwvaqMy-N-910UuG9mBXw2AUzg.JiNdJVabOU8TDzDuOT-33sPGWg5wsdqTze0HQV0WpWQ&dib_tag=se&keywords=kpop+demon+hunters&qid=1761486868&sprefix=kpop+demon+hunters+%2Caps%2C292&sr=8-33&linkCode=ll2&tag=kpdhworld-20&linkId=9675cc5764927f6cedc819c61b6e69f7&language=en_US&ref_=as_li_ss_tl",
  headline: "Huntrix Performance Set (Amazon Exclusive)",
  subline: "Snag the studio-grade Demon Hunters stage look before it sells out.",
  cta: "Shop The Drop",
} as const;

export function VideoGrid({
  videos,
  onSelect,
  sectionId,
  filterTabs,
  activeFilter,
  onFilterChange,
}: VideoGridProps) {
  const preparedGridItems = videos.map((video, index) => (
    <VideoCard
      index={index}
      key={video.id}
      onSelect={onSelect ? () => onSelect(video) : undefined}
      video={video}
    />
  ));

  if (videos.length >= GRID_BANNER_INSERT_INDEX) {
    const insertPosition = Math.min(GRID_BANNER_INSERT_INDEX, preparedGridItems.length);
    preparedGridItems.splice(
      insertPosition,
      0,
      <a
        className="col-span-2 flex w-full flex-col items-center gap-2 overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-r from-black/70 via-kdh-neon-purple/20 to-kdh-electric-blue/10 px-3 py-1 text-center text-white shadow-banner transition hover:border-kdh-neon-purple/50 hover:bg-kdh-neon-purple/10 sm:col-span-3 md:col-span-4 lg:col-span-6 lg:flex-row lg:items-center lg:justify-center lg:gap-4"
        href={GRID_BANNER_AD.href}
        key="video-grid-sponsored-banner"
        rel="sponsored noopener noreferrer"
        target="_blank"
      >
        <div className="flex flex-col items-center gap-2 text-center text-[11px] text-white/90 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
          <div className="flex flex-col items-center gap-[1px] text-center">
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-kdh-metallic-silver/70">
              <span className="h-2 w-2 rounded-full bg-kdh-neon-purple/70 shadow-[0_0_12px_rgba(162,89,255,0.7)]" aria-hidden={true} />
              Sponsored
            </span>
            <p className="text-sm font-semibold leading-tight text-white sm:text-base">{GRID_BANNER_AD.headline}</p>
            <p className="max-w-2xl text-[10px] leading-tight sm:text-xs">{GRID_BANNER_AD.subline}</p>
          </div>
          <span className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-kdh-electric-blue/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-black transition hover:bg-kdh-electric-blue">
            {GRID_BANNER_AD.cta}
          </span>
          <Image
            alt="K-Pop Demon Hunters logo"
            className="h-auto w-32 flex-shrink-0 drop-shadow-[0_0_16px_rgba(118,218,255,0.45)] sm:w-40 md:w-44 lg:w-48"
            height={210}
            loading="lazy"
            src="/kpdh_logo.png"
            width={340}
          />
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
