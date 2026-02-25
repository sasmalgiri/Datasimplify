'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface LayoutProps {
  coin: string;
  days: number;
}

export function TechnicalChartLayout({ coin, days }: LayoutProps) {
  const ohlcData = useLiveDashboardStore((s) => s.data.ohlc?.[coin]);
  const coinHistory = useLiveDashboardStore((s) => s.data.coinHistory) as {
    prices?: number[][];
    total_volumes?: number[][];
  } | null;

  const { dates, closes, highs, lows, opens, volumes, priceChange, currentPrice } = useMemo(() => {
    if (!ohlcData || ohlcData.length === 0) {
      return { dates: [], closes: [], highs: [], lows: [], opens: [], volumes: [], priceChange: 0, currentPrice: 0 };
    }
    const d = ohlcData.map((r: number[]) => {
      const dt = new Date(r[0]);
      return `${dt.getMonth() + 1}/${dt.getDate()}`;
    });
    const o = ohlcData.map((r: number[]) => r[1]);
    const h = ohlcData.map((r: number[]) => r[2]);
    const l = ohlcData.map((r: number[]) => r[3]);
    const c = ohlcData.map((r: number[]) => r[4]);

    // Volume from coin_history
    const vol = coinHistory?.total_volumes?.map((v: number[]) => v[1]) ?? [];

    const first = c[0] ?? 0;
    const last = c[c.length - 1] ?? 0;
    const change = first > 0 ? ((last - first) / first) * 100 : 0;

    return { dates: d, closes: c, highs: h, lows: l, opens: o, volumes: vol, priceChange: change, currentPrice: last };
  }, [ohlcData, coinHistory]);

  if (closes.length === 0) {
    return <div className="text-center py-16 text-gray-500 text-sm">No OHLC data available for &quot;{coin}&quot;</div>;
  }

  // Simple SMA-20
  const sma20 = useMemo(() => {
    const out: (number | null)[] = new Array(closes.length).fill(null);
    let sum = 0;
    for (let i = 0; i < closes.length; i++) {
      sum += closes[i];
      if (i >= 20) sum -= closes[i - 20];
      if (i >= 19) out[i] = sum / 20;
    }
    return out;
  }, [closes]);

  const high = Math.max(...highs);
  const low = Math.min(...lows);

  return (
    <div className="space-y-4">
      {/* Price KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KPI label="Current Price" value={`$${formatNum(currentPrice)}`} />
        <KPI
          label={`${days}d Change`}
          value={`${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`}
          color={priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <KPI label="Period High" value={`$${formatNum(high)}`} />
        <KPI label="Period Low" value={`$${formatNum(low)}`} />
        <KPI label="Data Points" value={`${closes.length}`} />
      </div>

      {/* Price chart (CSS-based sparkline table) */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Price &amp; SMA-20</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-gray-500">
                <th className="text-left px-2 py-2 font-medium">Date</th>
                <th className="text-right px-2 py-2 font-medium">Open</th>
                <th className="text-right px-2 py-2 font-medium">High</th>
                <th className="text-right px-2 py-2 font-medium">Low</th>
                <th className="text-right px-2 py-2 font-medium">Close</th>
                <th className="text-right px-2 py-2 font-medium">SMA 20</th>
                <th className="text-right px-2 py-2 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {dates.slice(-30).map((d, idx) => {
                const i = dates.length - 30 + idx;
                if (i < 0) return null;
                const change = i > 0 ? ((closes[i] - closes[i - 1]) / closes[i - 1]) * 100 : 0;
                return (
                  <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                    <td className="px-2 py-1.5 text-gray-400">{d}</td>
                    <td className="px-2 py-1.5 text-right text-gray-300 font-mono">${formatNum(opens[i])}</td>
                    <td className="px-2 py-1.5 text-right text-gray-300 font-mono">${formatNum(highs[i])}</td>
                    <td className="px-2 py-1.5 text-right text-gray-300 font-mono">${formatNum(lows[i])}</td>
                    <td className="px-2 py-1.5 text-right text-white font-mono font-medium">${formatNum(closes[i])}</td>
                    <td className="px-2 py-1.5 text-right text-yellow-400 font-mono">
                      {sma20[i] != null ? `$${formatNum(sma20[i]!)}` : '—'}
                    </td>
                    <td className={`px-2 py-1.5 text-right font-mono ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-600 mt-2">Showing last 30 data points of {closes.length} total</p>
      </div>

      {/* Volume summary */}
      {volumes.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Volume Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-gray-500">Avg Volume</div>
              <div className="text-sm text-white font-mono">
                {formatLargeVol(volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">Max Volume</div>
              <div className="text-sm text-white font-mono">{formatLargeVol(Math.max(...volumes))}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">Min Volume</div>
              <div className="text-sm text-white font-mono">{formatLargeVol(Math.min(...volumes))}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-sm font-bold ${color ?? 'text-white'}`}>{value}</div>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toPrecision(4);
}

function formatLargeVol(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}
