import type { VideoItem } from "@/lib/types";
import { VideoCard } from "./VideoCard";

type VideoGridProps = {
  videos: VideoItem[];
  onSelect?: (video: VideoItem) => void;
  sectionId?: string;
};

export function VideoGrid({ videos, onSelect, sectionId }: VideoGridProps) {
  return (
    <section className="space-y-6" id={sectionId}>
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-kdh-metallic-silver/70">
            Archive Grid
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-50">
            최신 Demon Hunters 숏폼 140선
          </h2>
        </div>
        <span className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-kdh-metallic-silver/80 backdrop-blur md:block">
          7 x 20 Layout
        </span>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
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
