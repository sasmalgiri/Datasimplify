'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore, type MarketCoin } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';
import Image from 'next/image';

/** Parse a hex color string (e.g. '#34d399') into [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/**
 * Interpolate a background color from deep red through neutral dark to the theme's primary color.
 * -10% or worse => deep red, 0% => neutral dark, +10% or better => primary color.
 */
function getHeatColor(value: number, primaryHex: string): string {
  // Clamp between -10 and +10 for color mapping
  const clamped = Math.max(-10, Math.min(10, value));
  // Normalize to 0..1 where 0 = -10%, 0.5 = 0%, 1 = +10%
  const t = (clamped + 10) / 20;

  if (t <= 0.5) {
    // Red to neutral: interpolate from (220, 38, 38) to (38, 38, 50)
    const ratio = t / 0.5;
    const r = Math.round(220 + (38 - 220) * ratio);
    const g = Math.round(38 + (38 - 38) * ratio);
    const b = Math.round(38 + (50 - 38) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Neutral to primary: interpolate from (38, 38, 50) to theme primary
    const [pr, pg, pb] = hexToRgb(primaryHex);
    const ratio = (t - 0.5) / 0.5;
    const r = Math.round(38 + (pr - 38) * ratio);
    const g = Math.round(38 + (pg - 38) * ratio);
    const b = Math.round(50 + (pb - 50) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function getTextColor(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1) return 'text-gray-400';
  return 'text-white';
}

function calc30dChange(sparkline?: { price: number[] }): number | null {
  if (!sparkline?.price || sparkline.price.length < 2) return null;
  const first = sparkline.price[0];
  const last = sparkline.price[sparkline.price.length - 1];
  if (first === 0) return null;
  return ((last - first) / first) * 100;
}

interface PerformanceHeatmapWidgetProps {
  limit?: number;
}

export function PerformanceHeatmapWidget({ limit = 20 }: PerformanceHeatmapWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const coins = data.markets?.slice(0, limit) || [];

  const rows = useMemo(() => {
    return coins.map((coin: MarketCoin) => {
      const change24h = coin.price_change_percentage_24h ?? 0;
      const change7d = coin.price_change_percentage_7d_in_currency ?? null;
      const change30d = calc30dChange(coin.sparkline_in_7d);

      return {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.image,
        change24h,
        change7d,
        change30d,
      };
    });
  }, [coins]);

  if (!data.markets) {
    return (
      <div className="flex items-center justify-center h-[280px] text-gray-600 text-sm">No data available</div>
    );
  }

  const timeframes = [
    { label: '24h', key: 'change24h' as const },
    { label: '7d', key: 'change7d' as const },
    { label: '30d', key: 'change30d' as const },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase border-b border-gray-700">
            <th className="text-left py-3 px-2 min-w-[140px]">Coin</th>
            {timeframes.map((tf) => (
              <th key={tf.label} className="text-center py-3 px-2 min-w-[80px]">
                {tf.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-800 hover:bg-white/[0.02] transition"
            >
              <td className="py-2.5 px-2">
                <div className="flex items-center gap-2">
                  {row.image && (
                    <Image
                      src={row.image}
                      alt={row.name}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-white font-medium text-sm">{row.name}</span>
                  <span className="text-gray-500 uppercase text-xs">{row.symbol}</span>
                </div>
              </td>
              {timeframes.map((tf) => {
                const value = row[tf.key];
                if (value === null) {
                  return (
                    <td key={tf.label} className="py-2.5 px-2 text-center">
                      <div
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 min-w-[60px]"
                        style={{ backgroundColor: 'rgba(38, 38, 50, 0.6)' }}
                      >
                        <span className="text-gray-500 text-xs font-medium">&ndash;</span>
                      </div>
                    </td>
                  );
                }
                return (
                  <td key={tf.label} className="py-2.5 px-2 text-center">
                    <div
                      className="inline-flex items-center justify-center rounded-md px-2 py-1 min-w-[60px]"
                      style={{ backgroundColor: getHeatColor(value, themeColors.primary) }}
                    >
                      <span className={`text-xs font-semibold ${getTextColor(value)}`}>
                        {value >= 0 ? '+' : ''}
                        {value.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
