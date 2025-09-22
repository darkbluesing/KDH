'use client';

import clsx from "clsx";
import { useMemo, useState } from "react";
import { AdModal } from "@/components/AdModal";
import { SideBanner } from "@/components/SideBanner";
import { VideoGrid } from "@/components/VideoGrid";
import { useModalState } from "@/hooks/useModalState";
import { FEATURED_VIDEOS, MOCK_VIDEOS } from "@/lib/mockVideos";
import type { VideoItem, VideoSource } from "@/lib/types";

const FILTER_TABS: Array<{ id: "all" | VideoSource; label: string }> = [
  { id: "all", label: "All" },
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
];

export default function Home() {
  const { isOpen, open, close, payload } = useModalState<VideoItem>();
  const [activeFilter, setActiveFilter] = useState<"all" | VideoSource>("all");

  const filteredVideos = useMemo(() => {
    if (activeFilter === "all") {
      return MOCK_VIDEOS;
    }
    return MOCK_VIDEOS.filter((video) => video.source === activeFilter);
  }, [activeFilter]);

  const featured = useMemo(() => FEATURED_VIDEOS, []);

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 blur-3xl">
        <div className="mx-auto h-72 w-full max-w-4xl bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.35),transparent_60%)]" />
      </div>

      <SideBanner
        headline="Demon Hunters OST"
        position="left"
        subline="네온 심포니 한정판 바이닐과 프리미엄 굿즈를 지금 예약하세요."
      />
      <SideBanner
        headline="Night Parade Tour"
        position="right"
        subline="서울 월드 아레나 5월 20일 — 얼리버드 티켓 오픈"
      />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-[1200px] flex-col gap-16 px-5 pb-32 pt-10 sm:px-8 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.4em] text-kdh-metallic-silver/70">
            <span className="size-2 rounded-full bg-kdh-bloody-red shadow-neon" />
            KDH SHORTS COMMAND
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-slate-300">
            <a className="rounded-full border border-white/10 px-4 py-2 transition hover:border-kdh-neon-purple/60 hover:text-white" href="#grid">
              Grid
            </a>
            <a className="rounded-full border border-white/10 px-4 py-2 transition hover:border-kdh-neon-purple/60 hover:text-white" href="#featured">
              Featured
            </a>
            <a className="rounded-full border border-white/10 px-4 py-2 transition hover:border-kdh-neon-purple/60 hover:text-white" href="#updates">
              Updates
            </a>
          </nav>
        </header>

        <section className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-kdh-metallic-silver/80 backdrop-blur">
              Realm Archive 7x20
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              7x20 시네마틱 그리드에서 만나는 Demon Hunters 세계
            </h1>
            <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
              팬들이 사랑하는 하이라이트, 직캠, 리허설까지 — YouTube와 Instagram에 흩어져 있는 모든 Demon Hunters 숏폼 콘텐츠를 한 곳에서 탐색하세요. 네온 애니메이션과 다크 판타지 UI가 몰입감을 극대화합니다.
            </p>
            <div className="flex flex-wrap gap-4" id="updates">
              <button
                className="group relative overflow-hidden rounded-full border border-kdh-electric-blue/60 bg-kdh-electric-blue/20 px-6 py-3 text-sm font-medium uppercase tracking-[0.25em] text-kdh-metallic-silver shadow-neon transition hover:border-kdh-neon-purple hover:text-white"
                onClick={() => open(featured[0])}
                type="button"
              >
                <span className="absolute inset-0 -z-[1] bg-[radial-gradient(circle_at_top_right,rgba(162,89,255,0.45),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                실시간 업데이트 보기
              </button>
              <button
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium uppercase tracking-[0.25em] text-slate-200 transition hover:border-kdh-bloody-red/60 hover:text-white"
                onClick={() => open(featured[1])}
                type="button"
              >
                제작 비하인드 열람
              </button>
            </div>
          </div>

          <dl className="grid w-full max-w-md grid-cols-2 gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm uppercase tracking-[0.3em] text-kdh-metallic-silver/90 backdrop-blur" id="featured">
            <div>
              <dt className="text-[10px] text-kdh-metallic-silver/60">Daily Sync</dt>
              <dd className="mt-2 font-display text-3xl text-white">+42</dd>
            </div>
            <div>
              <dt className="text-[10px] text-kdh-metallic-silver/60">View Rank</dt>
              <dd className="mt-2 font-display text-3xl text-white">Top 1%</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[10px] text-kdh-metallic-silver/60">Active Fandom</dt>
              <dd className="mt-2 font-display text-3xl text-white">38,204 Hunters</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">콘텐츠 필터</h2>
            <div className="flex flex-wrap gap-3">
              {FILTER_TABS.map((tab) => (
                <button
                  className={clsx(
                    "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition",
                    activeFilter === tab.id
                      ? "border-kdh-neon-purple/70 bg-kdh-neon-purple/20 text-white"
                      : "border-white/10 text-kdh-metallic-silver/80 hover:border-kdh-electric-blue/60 hover:text-white"
                  )}
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <VideoGrid onSelect={open} sectionId="grid" videos={filteredVideos} />
        </section>
      </main>

      <AdModal isOpen={isOpen} onClose={close} payload={payload} />
    </div>
  );
}
