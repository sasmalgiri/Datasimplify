'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { TABLE_DENSITY_MAP } from '@/lib/live-dashboard/theme';
import Image from 'next/image';

interface TechnicalScreenerWidgetProps {
  limit?: number;
}

/** Compute RSI from price array */
function computeRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50; // neutral default
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  // Use last `period` changes
  const recent = changes.slice(-period);
  let avgGain = 0;
  let avgLoss = 0;
  for (const c of recent) {
    if (c > 0) avgGain += c;
    else avgLoss += Math.abs(c);
  }
  avgGain /= period;
  avgLoss /= period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** Compute SMA from price array */
function computeSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((s, p) => s + p, 0) / period;
}

type Signal = 'Overbought' | 'Oversold' | 'Bullish Cross' | 'Bearish Cross' | 'Neutral';

function getSignal(rsi: number, sma7: number | null, sma25: number | null, currentPrice: number): Signal {
  if (rsi >= 70) return 'Overbought';
  if (rsi <= 30) return 'Oversold';
  if (sma7 !== null && sma25 !== null) {
    if (sma7 > sma25 && currentPrice > sma7) return 'Bullish Cross';
    if (sma7 < sma25 && currentPrice < sma7) return 'Bearish Cross';
  }
  return 'Neutral';
}

function getSignalStyle(signal: Signal): { bg: string; text: string } {
  switch (signal) {
    case 'Overbought': return { bg: 'bg-red-500/20', text: 'text-red-400' };
    case 'Oversold': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
    case 'Bullish Cross': return { bg: 'bg-blue-500/20', text: 'text-blue-400' };
    case 'Bearish Cross': return { bg: 'bg-orange-500/20', text: 'text-orange-400' };
    case 'Neutral': return { bg: 'bg-gray-500/20', text: 'text-gray-400' };
  }
}

function formatPrice(p: number): string {
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  if (p < 100) return `$${p.toFixed(2)}`;
  return `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function TechnicalScreenerWidget({ limit = 25 }: TechnicalScreenerWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const density = TABLE_DENSITY_MAP[customization.tableDensity];

  const { rows, insight } = useMemo(() => {
    const markets = data.markets;
    if (!markets) return { rows: null, insight: null };

    const analyzed = markets
      .filter((m) => m.sparkline_in_7d?.price && m.sparkline_in_7d.price.length >= 25)
      .slice(0, limit)
      .map((m) => {
        const prices = m.sparkline_in_7d!.price;
        const rsi = computeRSI(prices);
        const sma7 = computeSMA(prices, 7);
        const sma25 = computeSMA(prices, 25);
        const signal = getSignal(rsi, sma7, sma25, m.current_price);
        const momentum = prices.length >= 2
          ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
          : 0;

        return {
          id: m.id,
          name: m.name,
          symbol: m.symbol.toUpperCase(),
          image: m.image,
          price: m.current_price,
          rsi: Math.round(rsi),
          signal,
          momentum,
          change24h: m.price_change_percentage_24h || 0,
        };
      });

    const overbought = analyzed.filter((a) => a.signal === 'Overbought').length;
    const oversold = analyzed.filter((a) => a.signal === 'Oversold').length;
    const bullish = analyzed.filter((a) => a.signal === 'Bullish Cross').length;
    const bearish = analyzed.filter((a) => a.signal === 'Bearish Cross').length;

    const insightText = `${overbought} overbought · ${oversold} oversold · ${bullish} bullish cross · ${bearish} bearish cross out of ${analyzed.length} coins`;

    return { rows: analyzed, insight: insightText };
  }, [data.markets, limit]);

  if (!data.markets) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-800/50 rounded" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No sparkline data available for screening</div>;
  }

  return (
    <div>
      {/* Signal summary badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(['Overbought', 'Oversold', 'Bullish Cross', 'Bearish Cross'] as Signal[]).map((sig) => {
          const count = rows.filter((r) => r.signal === sig).length;
          const style = getSignalStyle(sig);
          return (
            <span key={sig} className={`text-[10px] px-2 py-0.5 rounded-full ${style.bg} ${style.text} font-medium`}>
              {sig}: {count}
            </span>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full ${density.text}`}>
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-700">
              <th className={`text-left ${density.py} ${density.px}`}>Coin</th>
              <th className={`text-right ${density.py} ${density.px}`}>Price</th>
              <th className={`text-right ${density.py} ${density.px}`}>RSI</th>
              <th className={`text-center ${density.py} ${density.px}`}>Signal</th>
              <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>7d Mom.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const style = getSignalStyle(row.signal);
              return (
                <tr key={row.id} className="border-b border-gray-800 hover:bg-white/[0.02] transition">
                  <td className={`${density.py} ${density.px}`}>
                    <div className="flex items-center gap-2">
                      {row.image && (
                        <Image src={row.image} alt={row.name} width={18} height={18} className="rounded-full" />
                      )}
                      <span className="font-medium text-white">{row.symbol}</span>
                    </div>
                  </td>
                  <td className={`${density.py} ${density.px} text-right text-gray-300 font-mono`}>
                    {formatPrice(row.price)}
                  </td>
                  <td className={`${density.py} ${density.px} text-right font-mono font-medium ${row.rsi >= 70 ? 'text-red-400' : row.rsi <= 30 ? 'text-emerald-400' : 'text-gray-300'}`}>
                    {row.rsi}
                  </td>
                  <td className={`${density.py} ${density.px} text-center`}>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${style.bg} ${style.text} font-medium`}>
                      {row.signal}
                    </span>
                  </td>
                  <td className={`${density.py} ${density.px} text-right hidden md:table-cell font-mono ${row.momentum >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {row.momentum >= 0 ? '+' : ''}{row.momentum.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {insight && <p className="text-[10px] text-gray-400 mt-2 text-center italic">{insight}</p>}
    </div>
  );
}
