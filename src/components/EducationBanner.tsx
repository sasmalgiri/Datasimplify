'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, GraduationCap, X, ChevronRight } from 'lucide-react';

interface EducationBannerProps {
  /** What YouTube influencers commonly get wrong about this topic */
  youtubeMyth: string;
  /** The factual reality */
  reality: string;
  /** Link to a related myth on /myths page */
  mythId?: string;
  /** Link to a learning path topic */
  learnLink?: string;
  learnLabel?: string;
  /** Storage key suffix for dismiss persistence */
  storageKey: string;
}

export function EducationBanner({
  youtubeMyth,
  reality,
  mythId,
  learnLink,
  learnLabel,
  storageKey,
}: EducationBannerProps) {
  const key = `crk-edu-${storageKey}`;
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(key) !== 'dismissed';
  });

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(key, 'dismissed');
    setVisible(false);
  }

  return (
    <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              YouTube Reality Check
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-1">
            <span className="text-red-400 font-medium">Myth:</span> {youtubeMyth}
          </p>
          <p className="text-sm text-gray-300">
            <span className="text-emerald-400 font-medium">Reality:</span> {reality}
          </p>

          <div className="flex flex-wrap gap-3 mt-3">
            {mythId && (
              <Link
                href={`/myths#${mythId}`}
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Read the full myth
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
            {learnLink && (
              <Link
                href={learnLink}
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <GraduationCap className="w-3 h-3" />
                {learnLabel || 'Learn more'}
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        <button
          onClick={dismiss}
          className="text-gray-600 hover:text-gray-400 transition-colors p-0.5 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
