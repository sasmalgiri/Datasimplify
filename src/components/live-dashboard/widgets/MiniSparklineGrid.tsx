'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore, type MarketCoin } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';
import Image from 'next/image';

function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }
  if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  }
  return `$${price.toFixed(6)}`;
}

function buildSparklinePath(prices: number[], width: number, height: number): string {
  if (prices.length < 2) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const step = width / (prices.length - 1);

  return prices
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

interface SparklineSVGProps {
  prices: number[];
  width?: number;
  height?: number;
  upColor?: string;
}

function SparklineSVG({ prices, width = 60, height = 20, upColor = '#10b981' }: SparklineSVGProps) {
  const path = useMemo(() => buildSparklinePath(prices, width, height), [prices, width, height]);

  if (!prices || prices.length < 2) return null;

  const isUp = prices[prices.length - 1] >= prices[0];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="flex-shrink-0"
    >
      <path
        d={path}
        fill="none"
        stroke={isUp ? upColor : '#ef4444'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface MiniSparklineGridProps {
  limit?: number;
}

export function MiniSparklineGrid({ limit = 20 }: MiniSparklineGridProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const coins = data.markets?.slice(0, limit) || [];

  if (!data.markets) {
    return (
      <div className="flex items-center justify-center h-[280px] text-gray-600 text-sm">No data available</div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {coins.map((coin: MarketCoin) => {
        const change24h = coin.price_change_percentage_24h ?? 0;
        const isPositive = change24h >= 0;
        const sparkPrices = coin.sparkline_in_7d?.price || [];

        return (
          <div
            key={coin.id}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2 hover:bg-white/[0.05] transition"
          >
            {/* Header: icon + symbol */}
            <div className="flex items-center gap-2">
              {coin.image && (
                <Image
                  src={coin.image}
                  alt={coin.name}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              )}
              <span className="text-white text-xs font-semibold uppercase">{coin.symbol}</span>
            </div>

            {/* Price + Change */}
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-white text-sm font-medium truncate">
                {formatPrice(coin.current_price)}
              </span>
              <span
                className={`text-xs font-semibold flex-shrink-0 ${
                  isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isPositive ? '+' : ''}
                {change24h.toFixed(1)}%
              </span>
            </div>

            {/* Sparkline */}
            <div className="flex items-center justify-center mt-auto">
              <SparklineSVG prices={sparkPrices} width={60} height={20} upColor={themeColors.primary} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
