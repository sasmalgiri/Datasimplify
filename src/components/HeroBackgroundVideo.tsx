'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Full-bleed, autoplaying, muted, looping background video for the hero.
 *
 * Video source resolution:
 *   1. NEXT_PUBLIC_HERO_BG_VIDEO_URL  (set in Vercel / .env.local to point anywhere)
 *   2. /hero-video.mp4                (drop your file at public/hero-video.mp4)
 *
 * The wrapper starts invisible and fades in only once the video has data, so
 * the hero looks exactly as before until a real file is present. Reduced-motion
 * users get a paused first frame instead of playback.
 */
const VIDEO_SRC = process.env.NEXT_PUBLIC_HERO_BG_VIDEO_URL || '/hero-video.mp4';
const VIDEO_POSTER = process.env.NEXT_PUBLIC_HERO_BG_VIDEO_POSTER || '';

export default function HeroBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

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

  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-700 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={VIDEO_POSTER || undefined}
        onLoadedData={() => setReady(true)}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* Dark gradient overlay keeps the headline readable over any footage
          and blends into the page's gray-900 background top and bottom. */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/85 via-gray-900/70 to-gray-900/95" />
    </div>
  );
}
