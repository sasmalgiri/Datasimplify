'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors, formatCompact } from '@/lib/live-dashboard/theme';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface CategoryBadgesWidgetProps {
  limit?: number;
}

export function CategoryBadgesWidget({ limit = 3 }: CategoryBadgesWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { gainers, losers } = useMemo(() => {
    if (!data.categories || !Array.isArray(data.categories)) {
      return { gainers: [], losers: [] };
    }

    const valid = data.categories.filter(
      (c: any) => c.market_cap_change_24h != null && c.name,
    );

    const sorted = [...valid].sort(
      (a: any, b: any) => b.market_cap_change_24h - a.market_cap_change_24h,
    );

    return {
      gainers: sorted.filter((c: any) => c.market_cap_change_24h >= 0).slice(0, limit),
      losers: sorted
        .filter((c: any) => c.market_cap_change_24h < 0)
        .slice(-limit)
        .sort((a: any, b: any) => a.market_cap_change_24h - b.market_cap_change_24h),
    };
  }, [data.categories, limit]);

  if (!data.categories) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-2">
            <div className="h-4 w-24 bg-white/[0.04] rounded animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 bg-white/[0.04] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (gainers.length === 0 && losers.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
        No category data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Top Gainers */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Top Gainers
          </span>
        </div>
        <div className="space-y-2">
          {gainers.map((cat: any) => (
            <div
              key={cat.name}
              className="flex items-center gap-2 rounded-xl px-3 py-2 border border-emerald-400/20 bg-emerald-400/[0.06]"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-white text-sm font-medium truncate block">
                  {cat.name}
                </span>
                {cat.market_cap != null && (
                  <span className="text-gray-500 text-[10px]">
                    {formatCompact(cat.market_cap)}
                  </span>
                )}
              </div>
              <span className="text-emerald-400 text-sm font-semibold whitespace-nowrap">
                +{cat.market_cap_change_24h.toFixed(2)}%
              </span>
            </div>
          ))}
          {gainers.length === 0 && (
            <span className="text-gray-500 text-xs">No gainers</span>
          )}
        </div>
      </div>

      {/* Top Losers */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
            Top Losers
          </span>
        </div>
        <div className="space-y-2">
          {losers.map((cat: any) => (
            <div
              key={cat.name}
              className="flex items-center gap-2 rounded-xl px-3 py-2 border border-red-400/20 bg-red-400/[0.06]"
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-white text-sm font-medium truncate block">
                  {cat.name}
                </span>
                {cat.market_cap != null && (
                  <span className="text-gray-500 text-[10px]">
                    {formatCompact(cat.market_cap)}
                  </span>
                )}
              </div>
              <span className="text-red-400 text-sm font-semibold whitespace-nowrap">
                {cat.market_cap_change_24h.toFixed(2)}%
              </span>
            </div>
          ))}
          {losers.length === 0 && (
            <span className="text-gray-500 text-xs">No losers</span>
          )}
        </div>
      </div>
    </div>
  );
}
