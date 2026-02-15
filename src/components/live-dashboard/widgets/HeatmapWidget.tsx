'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { formatPercent, percentColor, getThemeColors } from '@/lib/live-dashboard/theme';

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export function HeatmapWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const primaryRgb = hexToRgb(themeColors.primary);

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

  const insight = useMemo(() => {
    if (categories.length === 0) return null;
    const sorted = [...categories].sort((a, b) => b.change - a.change);
    const hottest = sorted[0];
    const coldest = sorted[sorted.length - 1];
    const greenCount = categories.filter((c) => c.change >= 0).length;
    return `Hottest sector: ${hottest.name} (${hottest.change >= 0 ? '+' : ''}${hottest.change.toFixed(1)}%) \u00B7 Coldest: ${coldest.name} (${coldest.change >= 0 ? '+' : ''}${coldest.change.toFixed(1)}%) \u00B7 ${greenCount}/${categories.length} sectors green`;
  }, [categories]);

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No category data available
      </div>
    );
  }

  const maxAbsChange = Math.max(...categories.map((c) => Math.abs(c.change)), 1);

  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
        {categories.map((cat) => {
          const intensity = Math.min(Math.abs(cat.change) / maxAbsChange, 1);
          const isPositive = cat.change >= 0;
          const bgColor = isPositive
            ? `rgba(${primaryRgb}, ${0.08 + intensity * 0.25})`
            : `rgba(239, 68, 68, ${0.08 + intensity * 0.25})`;
          const borderColor = isPositive
            ? `rgba(${primaryRgb}, ${0.1 + intensity * 0.2})`
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
      {insight && <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>}
    </div>
  );
}
