'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface LayoutProps {
  coin: string;
  days: number;
  templateId?: string;
}

export function TechnicalChartLayout({ coin, days, templateId }: LayoutProps) {
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

  // ─── Technical Indicators: compute RSI, MACD, Bollinger Bands ───
  if (templateId === 'technical_indicators') {
    return <TechnicalIndicatorsView coin={coin} days={days} dates={dates} closes={closes} highs={highs} lows={lows} opens={opens} volumes={volumes} sma20={sma20} currentPrice={currentPrice} priceChange={priceChange} high={high} low={low} />;
  }

  // ─── Default: OHLCV History table ───
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

// ─── Technical Indicators View ───

function TechnicalIndicatorsView({ coin, days, dates, closes, highs, lows, volumes, sma20, currentPrice, priceChange, high, low }: {
  coin: string; days: number; dates: string[]; closes: number[]; highs: number[]; lows: number[];
  opens: number[]; volumes: number[]; sma20: (number | null)[]; currentPrice: number; priceChange: number; high: number; low: number;
}) {
  // SMA-50
  const sma50 = useMemo(() => computeSMA(closes, 50), [closes]);

  // EMA-12 & EMA-26 for MACD
  const ema12 = useMemo(() => computeEMA(closes, 12), [closes]);
  const ema26 = useMemo(() => computeEMA(closes, 26), [closes]);

  // MACD line & signal
  const { macdLine, signalLine, histogram } = useMemo(() => {
    const macd: (number | null)[] = closes.map((_, i) =>
      ema12[i] != null && ema26[i] != null ? ema12[i]! - ema26[i]! : null,
    );
    const macdValues = macd.filter((v): v is number => v != null);
    const signal = computeEMA(macdValues, 9);
    // Align signal back
    const signalAligned: (number | null)[] = new Array(closes.length).fill(null);
    let si = 0;
    for (let i = 0; i < closes.length; i++) {
      if (macd[i] != null) {
        signalAligned[i] = signal[si] ?? null;
        si++;
      }
    }
    const hist: (number | null)[] = closes.map((_, i) =>
      macd[i] != null && signalAligned[i] != null ? macd[i]! - signalAligned[i]! : null,
    );
    return { macdLine: macd, signalLine: signalAligned, histogram: hist };
  }, [closes, ema12, ema26]);

  // RSI-14
  const rsi = useMemo(() => computeRSI(closes, 14), [closes]);

  // Bollinger Bands (20, 2)
  const { upper, lower, middle } = useMemo(() => {
    const mid: (number | null)[] = [...sma20];
    const up: (number | null)[] = new Array(closes.length).fill(null);
    const lo: (number | null)[] = new Array(closes.length).fill(null);
    for (let i = 19; i < closes.length; i++) {
      const slice = closes.slice(i - 19, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / 20;
      const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / 20;
      const std = Math.sqrt(variance);
      up[i] = mean + 2 * std;
      lo[i] = mean - 2 * std;
    }
    return { upper: up, lower: lo, middle: mid };
  }, [closes, sma20]);

  // ATR-14
  const atr = useMemo(() => {
    const out: (number | null)[] = new Array(closes.length).fill(null);
    if (closes.length < 2) return out;
    const trs: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
      trs.push(tr);
    }
    if (trs.length >= 14) {
      let sum = 0;
      for (let i = 0; i < 14; i++) sum += trs[i];
      out[14] = sum / 14;
      for (let i = 15; i < closes.length; i++) {
        out[i] = (out[i - 1]! * 13 + trs[i - 1]) / 14;
      }
    }
    return out;
  }, [closes, highs, lows]);

  const lastRsi = rsi.filter((v) => v != null).slice(-1)[0] ?? null;
  const lastMacd = macdLine.filter((v) => v != null).slice(-1)[0] ?? null;
  const lastSignal = signalLine.filter((v) => v != null).slice(-1)[0] ?? null;
  const lastAtr = atr.filter((v) => v != null).slice(-1)[0] ?? null;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KPI label="Current Price" value={`$${formatNum(currentPrice)}`} />
        <KPI label={`${days}d Change`} value={`${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`} color={priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        <KPI label="RSI (14)" value={lastRsi != null ? lastRsi.toFixed(1) : '—'} color={lastRsi != null ? (lastRsi > 70 ? 'text-red-400' : lastRsi < 30 ? 'text-emerald-400' : 'text-yellow-400') : undefined} />
        <KPI label="MACD" value={lastMacd != null ? lastMacd.toFixed(2) : '—'} color={lastMacd != null ? (lastMacd >= 0 ? 'text-emerald-400' : 'text-red-400') : undefined} />
        <KPI label="ATR (14)" value={lastAtr != null ? `$${formatNum(lastAtr)}` : '—'} />
      </div>

      {/* Indicator Signals Summary */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Signal Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SignalCard label="RSI (14)" value={lastRsi} condition={lastRsi != null ? (lastRsi > 70 ? 'Overbought' : lastRsi < 30 ? 'Oversold' : 'Neutral') : '—'} signal={lastRsi != null ? (lastRsi > 70 ? 'bearish' : lastRsi < 30 ? 'bullish' : 'neutral') : 'neutral'} />
          <SignalCard label="MACD" value={null} condition={lastMacd != null && lastSignal != null ? (lastMacd > lastSignal ? 'Bullish Cross' : 'Bearish Cross') : '—'} signal={lastMacd != null && lastSignal != null ? (lastMacd > lastSignal ? 'bullish' : 'bearish') : 'neutral'} />
          <SignalCard label="SMA-20" value={null} condition={sma20[closes.length - 1] != null ? (currentPrice > sma20[closes.length - 1]! ? 'Above' : 'Below') : '—'} signal={sma20[closes.length - 1] != null ? (currentPrice > sma20[closes.length - 1]! ? 'bullish' : 'bearish') : 'neutral'} />
          <SignalCard label="Bollinger" value={null} condition={upper[closes.length - 1] != null ? (currentPrice > upper[closes.length - 1]! ? 'Above Upper' : currentPrice < lower[closes.length - 1]! ? 'Below Lower' : 'In Band') : '—'} signal={upper[closes.length - 1] != null ? (currentPrice > upper[closes.length - 1]! ? 'bearish' : currentPrice < lower[closes.length - 1]! ? 'bullish' : 'neutral') : 'neutral'} />
        </div>
      </div>

      {/* Indicators Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Indicators (Last 30 Points)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-gray-500">
                <th className="text-left px-2 py-2 font-medium">Date</th>
                <th className="text-right px-2 py-2 font-medium">Close</th>
                <th className="text-right px-2 py-2 font-medium">SMA 20</th>
                <th className="text-right px-2 py-2 font-medium">SMA 50</th>
                <th className="text-right px-2 py-2 font-medium">RSI</th>
                <th className="text-right px-2 py-2 font-medium">MACD</th>
                <th className="text-right px-2 py-2 font-medium">Signal</th>
                <th className="text-right px-2 py-2 font-medium">BB Upper</th>
                <th className="text-right px-2 py-2 font-medium">BB Lower</th>
                <th className="text-right px-2 py-2 font-medium">ATR</th>
              </tr>
            </thead>
            <tbody>
              {dates.slice(-30).map((d, idx) => {
                const i = dates.length - 30 + idx;
                if (i < 0) return null;
                return (
                  <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                    <td className="px-2 py-1.5 text-gray-400">{d}</td>
                    <td className="px-2 py-1.5 text-right text-white font-mono font-medium">${formatNum(closes[i])}</td>
                    <td className="px-2 py-1.5 text-right text-yellow-400 font-mono">{sma20[i] != null ? `$${formatNum(sma20[i]!)}` : '—'}</td>
                    <td className="px-2 py-1.5 text-right text-orange-400 font-mono">{sma50[i] != null ? `$${formatNum(sma50[i]!)}` : '—'}</td>
                    <td className={`px-2 py-1.5 text-right font-mono ${rsi[i] != null ? (rsi[i]! > 70 ? 'text-red-400' : rsi[i]! < 30 ? 'text-emerald-400' : 'text-purple-400') : 'text-gray-600'}`}>{rsi[i] != null ? rsi[i]!.toFixed(1) : '—'}</td>
                    <td className={`px-2 py-1.5 text-right font-mono ${macdLine[i] != null ? (macdLine[i]! >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-gray-600'}`}>{macdLine[i] != null ? macdLine[i]!.toFixed(2) : '—'}</td>
                    <td className="px-2 py-1.5 text-right text-cyan-400 font-mono">{signalLine[i] != null ? signalLine[i]!.toFixed(2) : '—'}</td>
                    <td className="px-2 py-1.5 text-right text-amber-400 font-mono">{upper[i] != null ? `$${formatNum(upper[i]!)}` : '—'}</td>
                    <td className="px-2 py-1.5 text-right text-amber-400 font-mono">{lower[i] != null ? `$${formatNum(lower[i]!)}` : '—'}</td>
                    <td className="px-2 py-1.5 text-right text-gray-300 font-mono">{atr[i] != null ? `$${formatNum(atr[i]!)}` : '—'}</td>
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
              <div className="text-sm text-white font-mono">{formatLargeVol(volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length)}</div>
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

// ─── Signal Card ───
function SignalCard({ label, value, condition, signal }: { label: string; value: number | null; condition: string; signal: 'bullish' | 'bearish' | 'neutral' }) {
  const colors = { bullish: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', bearish: 'text-red-400 bg-red-400/10 border-red-400/20', neutral: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' };
  const c = colors[signal];
  return (
    <div className={`rounded-lg border p-3 ${c}`}>
      <div className="text-[10px] opacity-70 mb-1">{label}</div>
      <div className="text-sm font-bold">{condition}</div>
      {value != null && <div className="text-xs font-mono mt-0.5">{value.toFixed(1)}</div>}
    </div>
  );
}

// ─── Computation Helpers ───

function computeSMA(data: number[], window: number): (number | null)[] {
  const out: (number | null)[] = new Array(data.length).fill(null);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= window) sum -= data[i - window];
    if (i >= window - 1) out[i] = sum / window;
  }
  return out;
}

function computeEMA(data: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period) return out;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  out[period - 1] = sum / period;
  for (let i = period; i < data.length; i++) {
    out[i] = data[i] * k + out[i - 1]! * (1 - k);
  }
  return out;
}

function computeRSI(data: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period + 1) return out;
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gainSum += diff;
    else lossSum += Math.abs(diff);
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

// ─── Shared Components ───

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
