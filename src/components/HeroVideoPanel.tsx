'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

/**
 * Visible, autoplaying, muted, looping product video for the hero's right column.
 *
 * The default source is hosted in the Supabase Storage public "marketing" bucket,
 * so the video shows on every deployment (preview + production) with no env-var
 * setup. Override with NEXT_PUBLIC_HERO_BG_VIDEO_URL to swap it without a redeploy.
 */
const RAW_VIDEO_SRC =
  process.env.NEXT_PUBLIC_HERO_BG_VIDEO_URL ||
  'https://gadspittitmuqmysiawu.supabase.co/storage/v1/object/public/marketing/hero-bg.mp4';
// Cache-bust: the clip is served with a 1-year cache header, so bump this token
// whenever the video is replaced to force browsers to re-fetch instead of reusing a stale copy.
const VIDEO_SRC = RAW_VIDEO_SRC + (RAW_VIDEO_SRC.includes('?') ? '&' : '?') + 'v=2';
const VIDEO_POSTER = process.env.NEXT_PUBLIC_HERO_BG_VIDEO_POSTER || '';

export default function HeroVideoPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      v.pause();
    } else {
      // Some browsers need an explicit play() even with the autoplay attribute.
      v.play().catch(() => {});
    }
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      {/* Soft glow behind the frame */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-transparent to-blue-500/20 blur-2xl pointer-events-none" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800 to-gray-950 shadow-2xl shadow-emerald-500/10">
        <video
          ref={videoRef}
          className="block h-auto w-full cursor-pointer"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={VIDEO_POSTER || undefined}
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>

        {/* Play / Pause control */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause video' : 'Play video'}
          className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white ring-1 ring-white/15 backdrop-blur-sm transition hover:scale-105 hover:bg-black/70"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
        </button>
      </div>
    </div>
  );
}
