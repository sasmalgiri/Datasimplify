'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors } from '@/lib/live-dashboard/theme';
import Image from 'next/image';

/* ---------- helpers ---------- */

function formatTVL(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/* ---------- component ---------- */

export function ProtocolInfoWidget() {
  const { data, siteTheme, customization } = useLiveDashboardStore(useShallow((s) => ({
    data: s.data,
    siteTheme: s.siteTheme,
    customization: s.customization,
  })));
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(customization.colorTheme);
  const isLight = siteTheme === 'light-blue';

  const info = useMemo(() => {
    const detail = data.defiProtocolDetail;
    if (!detail) return null;

    return {
      name: detail.name,
      symbol: detail.symbol || '',
      logo: detail.logo || '',
      category: detail.category || 'Unknown',
      tvl: detail.tvl,
      mcap: detail.mcap || 0,
      chains: detail.chains || [],
      url: detail.url || '',
      description: detail.description || '',
    };
  }, [data.defiProtocolDetail]);

  /* ---- loading skeleton ---- */
  if (!data.defiProtocolDetail) {
    return (
      <div className="animate-pulse space-y-3 p-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full"
            style={{ backgroundColor: isLight ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.06)' }}
          />
          <div className="space-y-1.5 flex-1">
            <div
              className="h-4 w-32 rounded"
              style={{ backgroundColor: isLight ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.06)' }}
            />
            <div
              className="h-3 w-20 rounded"
              style={{ backgroundColor: isLight ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.04)' }}
            />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-5 rounded"
            style={{
              width: `${50 + i * 12}%`,
              backgroundColor: isLight ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.04)',
            }}
          />
        ))}
      </div>
    );
  }

  /* ---- empty state ---- */
  if (!info) {
    return (
      <div className={`flex items-center justify-center h-48 text-sm ${st.textDim}`}>
        No protocol detail available
      </div>
    );
  }

  const badgeBg = isLight ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.06)';
  const badgeText = isLight ? '#3b82f6' : themeColors.primary;
  const chipBg = isLight ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.05)';

  return (
    <div className="space-y-3">
      {/* Header: Logo + Name + Symbol */}
      <div className="flex items-center gap-3">
        {info.logo && (
          <Image
            src={info.logo}
            alt={info.name}
            width={36}
            height={36}
            className="rounded-full"
            unoptimized
          />
        )}
        <div>
          <h3 className={`text-base font-bold ${st.textPrimary}`}>{info.name}</h3>
          {info.symbol && (
            <span className={`text-xs font-medium ${st.textMuted}`}>
              ${info.symbol.toUpperCase()}
            </span>
          )}
        </div>
        {/* Category badge */}
        <span
          className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: badgeBg, color: badgeText }}
        >
          {info.category}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* TVL */}
        <div className={`rounded-lg px-3 py-2 ${st.subtleBg}`}>
          <div className={`text-[10px] font-medium ${st.textDim}`}>Total Value Locked</div>
          <div className={`text-sm font-bold ${st.textPrimary}`} style={{ color: themeColors.primary }}>
            {formatTVL(info.tvl)}
          </div>
        </div>

        {/* Market Cap */}
        <div className={`rounded-lg px-3 py-2 ${st.subtleBg}`}>
          <div className={`text-[10px] font-medium ${st.textDim}`}>Market Cap</div>
          <div className={`text-sm font-bold ${st.textPrimary}`}>
            {info.mcap > 0 ? formatTVL(info.mcap) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Chains pills */}
      {info.chains.length > 0 && (
        <div>
          <div className={`text-[10px] font-medium mb-1.5 ${st.textDim}`}>Deployed Chains</div>
          <div className="flex flex-wrap gap-1">
            {info.chains.slice(0, 12).map((chain, i) => (
              <span
                key={chain}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: chipBg,
                  color: themeColors.palette[i % themeColors.palette.length],
                }}
              >
                {chain}
              </span>
            ))}
            {info.chains.length > 12 && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${st.textDim}`}
                style={{ backgroundColor: chipBg }}
              >
                +{info.chains.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Website link */}
      {info.url && (
        <a
          href={info.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: themeColors.primary }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Visit Website
        </a>
      )}

      {/* Description */}
      {info.description && (
        <p
          className={`text-[11px] leading-relaxed line-clamp-2 ${st.textMuted}`}
          title={info.description}
        >
          {info.description}
        </p>
      )}
    </div>
  );
}
