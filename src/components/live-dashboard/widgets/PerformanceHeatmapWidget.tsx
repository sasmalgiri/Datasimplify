'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore, type MarketCoin } from '@/lib/live-dashboard/store';
import Image from 'next/image';

/**
 * Interpolate a background color from deep red through neutral dark to deep green.
 * -10% or worse => deep red, 0% => neutral dark, +10% or better => deep green.
 */
function getHeatColor(value: number): string {
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
    // Neutral to green: interpolate from (38, 38, 50) to (16, 185, 129)
    const ratio = (t - 0.5) / 0.5;
    const r = Math.round(38 + (16 - 38) * ratio);
    const g = Math.round(38 + (185 - 38) * ratio);
    const b = Math.round(50 + (129 - 50) * ratio);
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
  const { data } = useLiveDashboardStore();
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
                      style={{ backgroundColor: getHeatColor(value) }}
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
