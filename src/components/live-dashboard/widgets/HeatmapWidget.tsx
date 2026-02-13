'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { formatPercent, percentColor } from '@/lib/live-dashboard/theme';

export function HeatmapWidget() {
  const { data } = useLiveDashboardStore();

  const categories = useMemo(() => {
    if (!data.categories || !Array.isArray(data.categories)) return [];
    return data.categories
      .filter((c: any) => c.market_cap_change_24h != null && c.name)
      .slice(0, 24)
      .map((c: any) => ({
        name: c.name,
        change: c.market_cap_change_24h,
        volume: c.volume_24h,
        marketCap: c.market_cap,
      }));
  }, [data.categories]);

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No category data available
      </div>
    );
  }

  const maxAbsChange = Math.max(...categories.map((c) => Math.abs(c.change)), 1);

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
      {categories.map((cat) => {
        const intensity = Math.min(Math.abs(cat.change) / maxAbsChange, 1);
        const isPositive = cat.change >= 0;
        const bgColor = isPositive
          ? `rgba(52, 211, 153, ${0.08 + intensity * 0.25})`
          : `rgba(239, 68, 68, ${0.08 + intensity * 0.25})`;
        const borderColor = isPositive
          ? `rgba(52, 211, 153, ${0.1 + intensity * 0.2})`
          : `rgba(239, 68, 68, ${0.1 + intensity * 0.2})`;

        return (
          <div
            key={cat.name}
            className="rounded-lg p-2 text-center transition-all hover:scale-105 cursor-default"
            style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
            title={cat.name}
          >
            <div className="text-[9px] text-gray-400 truncate mb-0.5">{cat.name}</div>
            <div className={`text-xs font-bold ${percentColor(cat.change)}`}>
              {formatPercent(cat.change)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
