import clsx from "clsx";

type SideBannerProps = {
  position: "left" | "right";
};

export function SideBanner({ position }: SideBannerProps) {
  const alignment = position === "left" ? "items-start text-left" : "items-end text-right";

  return (
    <aside
      aria-hidden={true}
      className={clsx(
        "hidden h-[600px] w-[160px] rounded-[30px] border border-white/12 bg-black/40 p-6 text-white shadow-banner backdrop-blur-xl lg:flex lg:sticky lg:top-[10px] lg:mt-20",
        alignment,
        position === "left" ? "justify-self-start" : "justify-self-end",
        "self-start"
      )}
    >
      <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-[0.35em] text-white/80">
        광고용 배너
      </div>
    </aside>
  );
}
