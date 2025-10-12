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

export function VideoGrid({
  videos,
  onSelect,
  sectionId,
  filterTabs,
  activeFilter,
  onFilterChange,
}: VideoGridProps) {
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
        {videos.map((video, index) => (
          <VideoCard
            index={index}
            key={video.id}
            onSelect={onSelect ? () => onSelect(video) : undefined}
            video={video}
          />
        ))}
      </div>
    </section>
  );
}
