type SideBannerProps = {
  position: "left" | "right";
  headline: string;
  subline: string;
};

export function SideBanner({ position, headline, subline }: SideBannerProps) {
  const alignment = position === "left" ? "items-start text-left" : "items-end text-right";
  const offset = position === "left" ? "left-6 md:left-10" : "right-6 md:right-10";

  return (
    <aside
      aria-hidden={true}
      className={`pointer-events-none fixed top-28 hidden h-[520px] w-[110px] rounded-[28px] border border-white/10 bg-gradient-to-b from-white/5 via-kdh-charcoal/85 to-black/90 p-4 shadow-banner backdrop-blur-2xl transition duration-500 lg:flex ${alignment} ${offset}`}
    >
      <div className="flex h-full w-full flex-col justify-between">
        <div className="space-y-2">
          <span className="text-[9px] uppercase tracking-[0.45em] text-kdh-metallic-silver/60">
            Sponsored
          </span>
          <h3 className="font-display text-base text-white/90">
            {headline}
          </h3>
        </div>
        <p className="text-[10px] leading-snug text-kdh-metallic-silver/80">{subline}</p>
        <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-kdh-neon-purple/45 via-transparent to-kdh-electric-blue/45 opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,35,60,0.4),transparent_60%)]" />
        </div>
      </div>
    </aside>
  );
}
