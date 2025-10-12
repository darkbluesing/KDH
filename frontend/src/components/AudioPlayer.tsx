"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import YouTube from "react-youtube";
import { FiPause, FiPlay, FiSkipBack, FiSkipForward } from "react-icons/fi";
import clsx from "clsx";
import type { AudioTrack } from "@/lib/types";

type AudioPlayerProps = {
  tracks: AudioTrack[];
};

const PLAYER_POLL_INTERVAL = 500;
const PLAYER_VARS = {
  autoplay: 0,
  controls: 0,
  rel: 0,
  modestbranding: 1,
  disablekb: 1,
  playsinline: 1,
};

type YouTubePlayer = {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubeStateEvent = {
  data: number;
  target: YouTubePlayer;
};

type YouTubeReadyEvent = {
  target: YouTubePlayer;
};

export function AudioPlayer({ tracks }: AudioPlayerProps) {
  const hasTracks = tracks.length > 0;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const pollRef = useRef<number | null>(null);
  const firstTrackRef = useRef<string | null>(null);

  const activeTrack = useMemo(() => tracks[currentIndex] ?? null, [tracks, currentIndex]);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPoll = useCallback(() => {
    if (!playerRef.current) {
      return;
    }
    clearPoll();
    pollRef.current = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) {
        return;
      }
      const nextTime = player.getCurrentTime?.() ?? 0;
      const nextDuration = player.getDuration?.() ?? duration;
      if (Number.isFinite(nextTime)) {
        setCurrentTime(nextTime);
      }
      if (Number.isFinite(nextDuration) && nextDuration > 0) {
        setDuration(nextDuration);
      }
    }, PLAYER_POLL_INTERVAL);
  }, [clearPoll, duration]);

  useEffect(() => {
    if (isPlaying) {
      startPoll();
      return clearPoll;
    }
    clearPoll();
    return undefined;
  }, [isPlaying, startPoll, clearPoll]);

  useEffect(() => {
    if (tracks.length === 0) {
      setCurrentIndex(0);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }
    if (currentIndex >= tracks.length) {
      setCurrentIndex(0);
    }
  }, [tracks, currentIndex]);

  useEffect(() => {
    const firstTrackId = tracks[0]?.id ?? null;
    if (firstTrackId && firstTrackId !== firstTrackRef.current) {
      setCurrentIndex(0);
      setCurrentTime(0);
      setIsPlaying(false);
      firstTrackRef.current = firstTrackId;
    }
    if (!firstTrackId) {
      firstTrackRef.current = null;
    }
  }, [tracks]);

  const loadActiveTrack = useCallback(() => {
    const track = activeTrack;
    const player = playerRef.current;
    if (!track || !player || !playerReady) {
      return;
    }
    player.loadVideoById(track.videoId);
    setCurrentTime(0);
    const nextDuration = player.getDuration?.();
    if (Number.isFinite(nextDuration) && nextDuration > 0) {
      setDuration(nextDuration);
    }
    if (isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [activeTrack, isPlaying, playerReady]);

  useEffect(() => {
    loadActiveTrack();
  }, [loadActiveTrack]);

  const playTrackAt = useCallback(
    (nextIndex: number) => {
      if (!tracks[nextIndex]) {
        return;
      }
      setCurrentIndex(nextIndex);
      setIsPlaying(true);
      setCurrentTime(0);
    },
    [tracks]
  );

  const handleNext = useCallback(() => {
    if (!tracks.length) {
      return;
    }
    playTrackAt((currentIndex + 1) % tracks.length);
  }, [currentIndex, playTrackAt, tracks.length]);

  const handlePrevious = useCallback(() => {
    if (!tracks.length) {
      return;
    }
    playTrackAt((currentIndex - 1 + tracks.length) % tracks.length);
  }, [currentIndex, playTrackAt, tracks.length]);

  const handlePlayerReady = useCallback((event: YouTubeReadyEvent) => {
    playerRef.current = event.target;
    setPlayerReady(true);
  }, []);

  const handlePlayerStateChange = useCallback(
    (event: YouTubeStateEvent) => {
      const state = event.data;
      const player = event.target;
      if (state === 0) {
        handleNext();
        return;
      }
      if (state === 1) {
        setIsPlaying(true);
        const nextDuration = player.getDuration?.();
        if (Number.isFinite(nextDuration) && nextDuration > 0) {
          setDuration(nextDuration);
        }
      } else if (state === 2) {
        setIsPlaying(false);
      }
    },
    [handleNext]
  );

  const handlePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player || !activeTrack) {
      return;
    }
    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
    } else {
      player.playVideo();
      setIsPlaying(true);
    }
  }, [isPlaying, activeTrack]);

  const handleSeek = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const player = playerRef.current;
      if (!player) {
        return;
      }
      const nextProgress = Number(event.target.value);
      const nextTime = (duration * nextProgress) / 100;
      if (Number.isFinite(nextTime)) {
        player.seekTo(nextTime, true);
        setCurrentTime(nextTime);
      }
    },
    [duration]
  );

  const progress = useMemo(() => {
    if (!duration || Number.isNaN(duration)) {
      return 0;
    }
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const formatTime = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  }, []);

  return (
    <div className="text-white">
      <YouTube
        className="hidden"
        iframeClassName="hidden"
        onReady={handlePlayerReady}
        onStateChange={handlePlayerStateChange}
        opts={{ height: "0", playerVars: PLAYER_VARS, width: "0" }}
        videoId={activeTrack?.videoId ?? ""}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div
              className={clsx(
                "relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-kdh-charcoal/80",
                { "bg-opacity-40": !activeTrack }
              )}
            >
              {activeTrack?.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="앨범 아트" className="absolute inset-0 h-full w-full object-cover" src={activeTrack.thumbnailUrl} />
              ) : (
                <div className="flex size-full items-center justify-center text-sm text-kdh-metallic-silver/70">KDH</div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-[10px] uppercase tracking-[0.32em] text-kdh-metallic-silver/60">Official Playlist</p>
              <h2 className="text-lg font-semibold leading-tight sm:text-xl">
                {activeTrack ? activeTrack.title : "재생할 트랙이 없습니다"}
              </h2>
              <p className="text-[10px] uppercase tracking-[0.25em] text-kdh-metallic-silver/70">
                {activeTrack?.artist ?? "K-POP Demon Hunters"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
            <div className="flex items-center justify-center gap-4">
              <button
                aria-label="이전 트랙"
                className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-kdh-electric-blue/60 hover:text-kdh-electric-blue"
                disabled={!hasTracks}
                onClick={handlePrevious}
                type="button"
              >
                <FiSkipBack className="size-5" />
              </button>
              <button
                aria-label={isPlaying ? "일시정지" : "재생"}
                className="flex size-14 items-center justify-center rounded-full border border-kdh-neon-purple/60 bg-kdh-neon-purple/30 text-white shadow-neon transition hover:border-kdh-electric-blue/70 hover:bg-kdh-electric-blue/25"
                disabled={!hasTracks}
                onClick={handlePlayPause}
                type="button"
              >
                {isPlaying ? <FiPause className="size-7" /> : <FiPlay className="size-7 translate-x-[1px]" />}
              </button>
              <button
                aria-label="다음 트랙"
                className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-kdh-electric-blue/60 hover:text-kdh-electric-blue"
                disabled={!hasTracks}
                onClick={handleNext}
                type="button"
              >
                <FiSkipForward className="size-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 text-[12px] text-kdh-metallic-silver/70">
              <span className="w-12 text-right font-mono">{formatTime(currentTime)}</span>
              <input
                aria-label="재생 위치 조절"
                className="h-[4px] w-full cursor-pointer appearance-none rounded-full bg-white/15"
                disabled={!hasTracks}
                max={100}
                min={0}
                onChange={handleSeek}
                type="range"
                value={Number.isFinite(progress) ? progress : 0}
              />
              <span className="w-12 font-mono">
                {formatTime((Number.isFinite(duration) ? duration : undefined) ?? activeTrack?.duration ?? 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/8 bg-white/5 p-2 lg:self-stretch">
          {tracks.length > 0 ? (
            <div className="max-h-64 overflow-y-auto pr-1 sm:max-h-72">
              <ul className="divide-y divide-white/5" role="list">
                {tracks.map((track, index) => {
                  const isActive = track.id === activeTrack?.id;
                  return (
                    <li key={track.id}>
                      <button
                        className={clsx(
                          "flex w-full items-center gap-3 px-4 py-3 text-left text-xs uppercase tracking-[0.18em] text-kdh-metallic-silver/70 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kdh-neon-purple",
                          isActive
                            ? "bg-kdh-neon-purple/15 text-white"
                            : "hover:bg-kdh-electric-blue/10 hover:text-white"
                        )}
                        onClick={() => playTrackAt(index)}
                        type="button"
                      >
                        <span className="w-7 font-semibold">
                          {index + 1 < 10 ? `0${index + 1}` : index + 1}
                        </span>
                        <div className="flex flex-col gap-0.5 text-[11px] normal-case tracking-normal text-white/90">
                          <span className="font-medium leading-tight line-clamp-1">{track.title}</span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-kdh-metallic-silver/70 line-clamp-1">
                            {track.artist}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="p-4 text-sm text-kdh-metallic-silver/70">불러올 플레이리스트가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
