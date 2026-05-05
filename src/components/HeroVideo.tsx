'use client';

import { useState, useRef } from 'react';
import { Play, X } from 'lucide-react';

const VIDEO_SRC = process.env.NEXT_PUBLIC_HERO_VIDEO_URL || '';
const VIDEO_POSTER = process.env.NEXT_PUBLIC_HERO_VIDEO_POSTER || '';
const VIDEO_TITLE = 'How to add your free CoinGecko API key (60 sec)';

export default function HeroVideo() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!VIDEO_SRC) return null;

  const handleOpen = () => {
    setOpen(true);
    requestAnimationFrame(() => videoRef.current?.play().catch(() => {}));
  };

  const handleClose = () => {
    videoRef.current?.pause();
    setOpen(false);
  };

  return (
    <>
      <div className="max-w-2xl mx-auto mb-8">
        <button
          type="button"
          onClick={handleOpen}
          className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] aspect-video shadow-xl shadow-emerald-500/5 hover:border-emerald-500/40 transition-all"
          aria-label={`Play tutorial: ${VIDEO_TITLE}`}
        >
          {VIDEO_POSTER ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={VIDEO_POSTER}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-transparent to-blue-500/15" />
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </span>
            <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-black/60 backdrop-blur text-white border border-white/10">
              {VIDEO_TITLE}
            </span>
          </div>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label={VIDEO_TITLE}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Close video"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="w-full max-w-4xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              poster={VIDEO_POSTER || undefined}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full rounded-xl bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}
