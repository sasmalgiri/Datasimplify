'use client';

import { useState } from 'react';
import { Share2, Check, Link2 } from 'lucide-react';

interface ShareButtonProps {
  slug: string;
}

export function ShareButton({ slug }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/live-dashboards/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition border border-white/[0.06]"
        title="Share dashboard link"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
      </button>

      {copied && (
        <div className="absolute right-0 top-full mt-2 bg-[#0a0a0f] border border-emerald-400/20 rounded-xl shadow-2xl p-3 z-50 min-w-[220px]">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
            <Link2 className="w-3.5 h-3.5" />
            Link copied!
          </div>
          <p className="text-[10px] text-gray-500">
            Recipients will need their own CoinGecko API key. Data is for personal use only.
          </p>
        </div>
      )}
    </div>
  );
}
