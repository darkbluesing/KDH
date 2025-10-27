import clsx from "clsx";
import Image from "next/image";
import { adsList } from "@/data/adsList";

type SideBannerProps = {
  position: "left" | "right";
};

type BannerContent = {
  href: string;
  imageAlt: string;
  imageSrc: string;
  headline: string;
  subline: string;
  cta: string;
};

const LEFT_BANNER: BannerContent = {
  href: "https://amzn.to/47bKQRi",
  imageAlt: "YINXIAQIYE Demon Hunters performance costume",
  imageSrc: "https://m.media-amazon.com/images/I/61B1ZGeMidL._AC_SL1200_.jpg",
  headline: "K-POP Demon Hunters Costume",
  subline: "Grab the full stage-ready set on Amazon.",
  cta: "Shop Now",
};

const RIGHT_BANNER = (() => {
  const fallback = adsList[0];
  if (!fallback) {
    return null;
  }
  return {
    href: fallback.url,
    imageAlt: fallback.title,
    imageSrc: fallback.image,
    headline: fallback.title,
    subline: "Tap through to check pricing and availability on Amazon.",
    cta: fallback.cta,
  } satisfies BannerContent;
})();

export function SideBanner({ position }: SideBannerProps) {
  const alignment = position === "left" ? "items-start text-left" : "items-end text-right";
  const justification = position === "left" ? "justify-self-start self-start" : "justify-self-end self-start";
  const banner = position === "left" ? LEFT_BANNER : RIGHT_BANNER;

  return (
    <aside
      aria-hidden={true}
      className={clsx(
        "hidden h-[600px] w-[160px] text-white lg:flex lg:sticky lg:top-[10px] lg:mt-20",
        alignment,
        justification
      )}
    >
      {banner ? (
        <a
          className="flex h-full w-full flex-col gap-4 overflow-hidden rounded-[30px] border border-white/12 bg-black/40 p-4 text-white shadow-banner backdrop-blur-xl"
          href={banner.href}
          rel="sponsored noopener noreferrer"
          target="_blank"
        >
          <div className="relative h-[360px] w-full overflow-hidden">
            <Image
              alt={banner.imageAlt}
              className="object-contain"
              fill
              sizes="160px"
              src={banner.imageSrc}
            />
          </div>

          <div className="flex flex-1 flex-col justify-between">
            <div className="space-y-2 text-[12px] leading-snug text-white/85">
              <p className="text-sm font-semibold text-white">{banner.headline}</p>
              <p>{banner.subline}</p>
            </div>
            <span className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-kdh-neon-purple/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-kdh-neon-purple/80">
              {banner.cta}
            </span>
          </div>
        </a>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-[30px] border border-white/12 bg-black/40 p-6 text-sm uppercase tracking-[0.35em] text-white/80">
          Reserved Ad Slot
        </div>
      )}
    </aside>
  );
}
