import { NextResponse } from 'next/server';
import { fetchMarketOverview } from '@/lib/dataApi';
import { getCoinGeckoId } from '@/lib/dataTypes';

type Risk = 'conservative' | 'balanced' | 'aggressive';

type PresetAllocation = {
  id: string;
  name: string;
  symbol: string;
  percentage: number;
  riskLevel: 1 | 2 | 3 | 4 | 5;
  color: string;
};

const BRAND_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#00FFA3',
  USDC: '#2775CA',
};

function colorForSymbol(symbol: string): string {
  return BRAND_COLORS[symbol.toUpperCase()] || '#6B7280';
}

async function fetchTopMarketCoins(limit: number): Promise<Array<{ id: string; symbol: string; name: string }>> {
  const market = await fetchMarketOverview({ sortBy: 'market_cap', sortOrder: 'desc' });
  return market.slice(0, limit).map(c => ({
    id: getCoinGeckoId(c.symbol),
    symbol: c.symbol.toLowerCase(),
    name: c.name,
  }));
}

function buildPreset(risk: Risk, coins: Array<{ id: string; symbol: string; name: string }>): PresetAllocation[] {
  // Use top market-cap coins dynamically (no hard-coded coin lists).
  const top = coins
    .filter(c => c?.symbol && c?.name)
    .slice(0, 10)
    .map(c => ({ ...c, symbol: c.symbol.toUpperCase() }));

  const btc = top.find(c => c.symbol === 'BTC');
  const eth = top.find(c => c.symbol === 'ETH');

  const remainder = top.filter(c => c.symbol !== 'BTC' && c.symbol !== 'ETH');

  const pick = (n: number) => remainder.slice(0, n);

  if (risk === 'conservative') {
    const picks = [btc, eth, ...pick(1)].filter(Boolean) as Array<{ id: string; symbol: string; name: string }>;
    const weights = [60, 30, 10];
    return picks.slice(0, 3).map((c, i) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      percentage: weights[i] as number,
      riskLevel: (c.symbol === 'BTC' || c.symbol === 'ETH') ? 2 : 3,
      color: colorForSymbol(c.symbol),
    })) as PresetAllocation[];
  }

  if (risk === 'balanced') {
    const picks = [btc, eth, ...pick(2)].filter(Boolean) as Array<{ id: string; symbol: string; name: string }>;
    const weights = [45, 30, 15, 10];
    return picks.slice(0, 4).map((c, i) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      percentage: weights[i] as number,
      riskLevel: (c.symbol === 'BTC' || c.symbol === 'ETH') ? 2 : 3,
      color: colorForSymbol(c.symbol),
    })) as PresetAllocation[];
  }

  // aggressive
  const picks = [btc, eth, ...pick(3)].filter(Boolean) as Array<{ id: string; symbol: string; name: string }>;
  const weights = [30, 25, 20, 15, 10];
  return picks.slice(0, 5).map((c, i) => ({
    id: c.id,
    name: c.name,
    symbol: c.symbol,
    percentage: weights[i] as number,
    riskLevel: (c.symbol === 'BTC' || c.symbol === 'ETH') ? 2 : 4,
    color: colorForSymbol(c.symbol),
  })) as PresetAllocation[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const riskParam = (searchParams.get('risk') || '').toLowerCase();
  const risk: Risk = (riskParam === 'conservative' || riskParam === 'balanced' || riskParam === 'aggressive')
    ? (riskParam as Risk)
    : 'balanced';

  try {
    const coins = await fetchTopMarketCoins(50);
    const allocations = buildPreset(risk, coins);

    if (!allocations.length) {
      return NextResponse.json({
        success: false,
        error: 'Unable to build portfolio preset from market data.',
        data: [],
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      risk,
      data: allocations,
      updated: new Date().toISOString(),
      source: 'binance-derived',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to load portfolio preset from live data.',
      details: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    }, { status: 502 });
  }
}
