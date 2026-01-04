import { NextResponse } from 'next/server';

import { SUPPORTED_COINS } from '@/lib/dataTypes';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

export async function GET() {
  try {
    // Redistributable-only mode: derive stats from Binance tickers for our SUPPORTED_COINS universe.
    // Response keeps the legacy CoinGecko /global shape used by UI.
    const response = await fetch(`${BINANCE_BASE}/ticker/24hr`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error('Binance ticker API error:', response.status);
      return NextResponse.json({ data: null, error: 'API error' }, { status: response.status });
    }

    const tickers: Array<{
      symbol: string;
      lastPrice: string;
      openPrice: string;
      quoteVolume: string;
    }> = await response.json();

    let totalMarketCap = 0;
    let totalMarketCapPrev = 0;
    let totalVolume24h = 0;

    const capBySymbol: Record<string, number> = {};

    for (const coin of SUPPORTED_COINS) {
      const ticker = tickers.find(t => t.symbol === coin.binanceSymbol);
      if (!ticker) continue;

      const price = Number.parseFloat(ticker.lastPrice);
      const open = Number.parseFloat(ticker.openPrice);
      const quoteVolume = Number.parseFloat(ticker.quoteVolume);

      if (!Number.isFinite(price) || !Number.isFinite(open)) continue;

      const marketCap = price * coin.circulatingSupply;
      const prevMarketCap = open * coin.circulatingSupply;

      totalMarketCap += marketCap;
      totalMarketCapPrev += prevMarketCap;
      if (Number.isFinite(quoteVolume)) totalVolume24h += quoteVolume;

      capBySymbol[coin.symbol.toUpperCase()] = marketCap;
    }

    if (!Number.isFinite(totalMarketCap) || totalMarketCap <= 0) {
      return NextResponse.json({ data: null, error: 'Insufficient data' }, { status: 502 });
    }

    const marketCapChange24h =
      totalMarketCapPrev > 0 ? ((totalMarketCap - totalMarketCapPrev) / totalMarketCapPrev) * 100 : 0;

    const market_cap_percentage: Record<string, number> = {};
    for (const [symbol, cap] of Object.entries(capBySymbol)) {
      const key = symbol.toLowerCase();
      market_cap_percentage[key] = (cap / totalMarketCap) * 100;
    }

    const data = {
      total_market_cap: { usd: totalMarketCap },
      total_volume: { usd: totalVolume24h },
      market_cap_percentage,
      market_cap_change_percentage_24h_usd: Number.isFinite(marketCapChange24h) ? marketCapChange24h : 0,
      active_cryptocurrencies: SUPPORTED_COINS.length,
    };

    return NextResponse.json({
      data,
      source: 'binance-derived',
      updated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Global API error:', error);
    return NextResponse.json({ data: null, error: 'Failed to fetch' }, { status: 500 });
  }
}
