import clsx from "clsx";
import Image from "next/image";
import type { VideoItem } from "@/lib/types";

type VideoCardProps = {
  index: number;
  onSelect?: () => void;
  video: VideoItem;
};

export function VideoCard({ index, onSelect, video }: VideoCardProps) {
  const { title, source, viewCount, channelName, thumbnailUrl } = video;
  const altText = `${title} 썸네일`;

  return (
    <article
      className={clsx(
        "group relative aspect-[9/16] w-full overflow-hidden rounded-2xl",
        "border border-white/5 bg-gradient-to-b from-kdh-charcoal/90 via-kdh-deep-black/95 to-black/80",
        "transition-transform duration-300 ease-out hover:-translate-y-1 hover:border-kdh-neon-purple/60"
      )}
    >
      <button
        aria-label={`${title} 상세 보기`}
        className="absolute inset-0 z-20 cursor-pointer"
        onClick={onSelect}
        type="button"
      />

      <div className="absolute inset-0 z-0">
        {thumbnailUrl ? (
          <Image
            alt={altText}
            className="size-full object-cover object-center"
            priority={index < 12}
            sizes="(min-width: 1536px) 12vw, (min-width: 1280px) 16vw, (min-width: 1024px) 18vw, (min-width: 768px) 28vw, 42vw"
            src={thumbnailUrl}
            fill
          />
        ) : (
          <div aria-hidden="true" className="size-full bg-neutral-900" />
        )}
      </div>

      <div
        aria-hidden={true}
        className="absolute inset-0 z-[1] h-full w-full bg-gradient-to-b from-black/20 via-black/10 to-black/60 opacity-80 transition duration-500 group-hover:opacity-95"
      />

      <div aria-hidden={true} className="absolute inset-0 z-[2] bg-grid-overlay opacity-60" />

      <div className="relative z-10 flex h-full flex-col justify-between bg-gradient-to-b from-black/10 via-transparent to-black/55 p-4">
        <header className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-kdh-metallic-silver/80">
          <span>{source === "youtube" ? "YouTube" : "TikTok"}</span>
          <span>{String(index + 1).padStart(3, "0")}</span>
        </header>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-kdh-metallic-silver/75">
            <span className="font-medium text-kdh-electric-blue/80">{channelName}</span>
            <span className="text-kdh-metallic-silver/60">
              {Intl.NumberFormat("en", { notation: "compact" }).format(viewCount ?? 0)}
            </span>
          </div>
          <p className="line-clamp-3 text-sm font-medium leading-tight text-slate-100">{title}</p>
        </div>
      </div>

      <div className="absolute inset-0 z-[3] rounded-2xl border border-kdh-neon-purple/20 opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="absolute inset-0 z-[4] rounded-2xl opacity-0 transition duration-300 group-hover:animate-ripple group-hover:opacity-100" />
    </article>
  );
}
