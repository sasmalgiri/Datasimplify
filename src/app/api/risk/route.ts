import { NextResponse } from 'next/server';
import { getBinanceKlines, getCoinSymbol } from '@/lib/binance';
import { findCoinByGeckoId, SUPPORTED_COINS } from '@/lib/dataTypes';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';
import { FEATURES } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

type RiskLevel = 1 | 2 | 3 | 4 | 5;

type CoinRisk = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  var_95: number;
  var_99: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  volatility: number;
  risk_level: RiskLevel;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return NaN;
  const m = mean(values);
  const v = values.reduce((s, x) => s + (x - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(v);
}

function maxDrawdownFromPrices(prices: number[]): number {
  let peak = -Infinity;
  let maxDd = 0;
  for (const p of prices) {
    if (!Number.isFinite(p) || p <= 0) continue;
    if (p > peak) peak = p;
    if (peak > 0) {
      const dd = ((peak - p) / peak) * 100;
      if (dd > maxDd) maxDd = dd;
    }
  }
  return maxDd;
}

function computeRiskLevel(volatilityPct: number, maxDrawdownPct: number): RiskLevel {
  const vol = volatilityPct;
  const dd = maxDrawdownPct;
  // Simple heuristic: crypto is volatile; this ranks relative risk.
  if (vol < 2.5 && dd < 35) return 1;
  if (vol < 4.0 && dd < 55) return 2;
  if (vol < 6.0 && dd < 70) return 3;
  if (vol < 9.0 && dd < 85) return 4;
  return 5;
}

async function buildCoinRisk(coinId: string, days: number): Promise<CoinRisk | null> {
  const byGeckoId = findCoinByGeckoId(coinId);
  const bySymbol = SUPPORTED_COINS.find(c => c.symbol.toLowerCase() === coinId.toLowerCase());
  const coinInfo = byGeckoId || bySymbol;

  const binanceSymbol = getCoinSymbol(coinId) || (coinInfo?.binanceSymbol ?? null);
  if (!coinInfo || !binanceSymbol) return null;

  // Binance klines are capped (1000). Clamp here for reliability.
  const limit = Math.min(Math.max(days, 30), 1000);
  const klines = await getBinanceKlines(binanceSymbol, '1d', limit);
  const prices = klines.map(k => k.close).filter(p => Number.isFinite(p) && p > 0);
  const currentPrice = prices.length > 0 ? prices[prices.length - 1] : NaN;

  if (!Number.isFinite(currentPrice) || prices.length < 30) return null;

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const cur = prices[i];
    if (!Number.isFinite(prev) || !Number.isFinite(cur) || prev <= 0) continue;
    returns.push(cur / prev - 1);
  }
  if (returns.length < 20) return null;

  const vol = stddev(returns);
  const volPct = Number.isFinite(vol) ? vol * 100 : NaN;

  const sorted = [...returns].sort((a, b) => a - b);
  const q05 = percentile(sorted, 0.05);
  const q01 = percentile(sorted, 0.01);

  const var95 = Number.isFinite(q05) ? Math.max(0, -q05 * 100) : NaN;
  const var99 = Number.isFinite(q01) ? Math.max(0, -q01 * 100) : NaN;

  const avg = mean(returns);
  const sr = (Number.isFinite(avg) && Number.isFinite(vol) && vol > 0) ? (avg / vol) * Math.sqrt(365) : NaN;

  const downside = returns.filter(r => r < 0);
  const downsideStd = stddev(downside);
  const sortino = (Number.isFinite(avg) && Number.isFinite(downsideStd) && downsideStd > 0) ? (avg / downsideStd) * Math.sqrt(365) : NaN;

  const maxDd = maxDrawdownFromPrices(prices);
  const level = computeRiskLevel(Number.isFinite(volPct) ? volPct : 0, Number.isFinite(maxDd) ? maxDd : 0);

  if (![var95, var99, sr, sortino, maxDd, volPct].every(Number.isFinite)) return null;

  return {
    id: coinId,
    symbol: coinInfo.symbol,
    name: coinInfo.name,
    current_price: currentPrice,
    var_95: var95,
    var_99: var99,
    sharpe_ratio: sr,
    sortino_ratio: sortino,
    max_drawdown: maxDd,
    volatility: volPct,
    risk_level: level,
  };
}

export async function GET(request: Request) {
  // Risk feature is disabled in paddle_safe mode - return 404
  if (!FEATURES.risk) {
    return NextResponse.json(
      { error: 'Risk analysis feature is disabled', code: 'FEATURE_DISABLED' },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const coinsParam = searchParams.get('coins');
  const daysParam = Number.parseInt(searchParams.get('days') || '365');

  const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 30), 3650) : 365;
  const coinIds = (coinsParam ? coinsParam.split(',') : ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'shiba-inu'])
    .map(s => s.trim())
    .filter(Boolean);

  try {
    assertRedistributionAllowed('binance', { purpose: 'chart', route: '/api/risk' });

    const results = await Promise.allSettled(coinIds.map(id => buildCoinRisk(id, days)));
    const coins: CoinRisk[] = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<CoinRisk | null>).value)
      .filter((v): v is CoinRisk => v != null);

    if (coins.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Risk metrics unavailable from free public endpoints right now.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { coins, days },
      timestamp: new Date().toISOString(),
      source: 'binance-derived',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
