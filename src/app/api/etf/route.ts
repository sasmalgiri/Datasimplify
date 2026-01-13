import { NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { isRedistributionPolicyEnabled, isSourceRedistributable } from '@/lib/redistributionPolicy';

// Bitcoin ETF Data API
// Free, reliable ETF flow + AUM data is not consistently available via public APIs.
// This endpoint intentionally does NOT fabricate/estimate flows or AUM.

async function fetchBtcPriceContext(): Promise<{ btcPrice: number; btcChange24h: number; source: string }> {
  // 1) Binance ticker (fast, free)
  const canUseBinance = !isRedistributionPolicyEnabled() || isSourceRedistributable('binance');
  if (canUseBinance) try {
    const priceResponse = await fetch(
      'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
      { next: { revalidate: 60 } }
    );

    if (priceResponse.ok) {
      const priceData = await priceResponse.json();
      const btcPrice = parseFloat(priceData.lastPrice);
      const btcChange24h = parseFloat(priceData.priceChangePercent);
      if (Number.isFinite(btcPrice) && Number.isFinite(btcChange24h)) {
        return { btcPrice, btcChange24h, source: 'binance' };
      }
    }
  } catch {
    // fall through
  }

  // 2) CoinGecko markets (free)
  if (!isFeatureEnabled('coingecko')) {
    throw new Error('Unable to fetch BTC context (CoinGecko disabled)');
  }

  const canUseCoinGecko = !isRedistributionPolicyEnabled() || isSourceRedistributable('coingecko');
  if (!canUseCoinGecko) {
    throw new Error('Unable to fetch BTC context (CoinGecko blocked by redistribution policy)');
  }

  const cg = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false&price_change_percentage=24h',
    { next: { revalidate: 120 } }
  );
  if (!cg.ok) {
    throw new Error('Unable to fetch BTC context');
  }
  const rows = await cg.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  const btcPrice = row?.current_price;
  const btcChange24h = row?.price_change_percentage_24h;
  if (!Number.isFinite(btcPrice) || !Number.isFinite(btcChange24h)) {
    throw new Error('CoinGecko returned unexpected BTC context');
  }
  return { btcPrice, btcChange24h, source: 'coingecko' };
}

export async function GET() {
  try {
    const { btcPrice, btcChange24h, source } = await fetchBtcPriceContext();

    const marketSentiment = btcChange24h > 2 ? 'bullish' : btcChange24h < -2 ? 'bearish' : 'neutral';

    return NextResponse.json({
      success: true,
      data: {
        etfs: [],
        summary: {
          total_aum: null,
          total_today_flow: null,
          total_week_flow: null,
          btc_price: btcPrice,
          btc_change_24h: btcChange24h,
          market_sentiment: marketSentiment,
          etf_count: 0
        },
        meta: {
          data_type: 'unavailable',
          note: 'ETF flow/AUM data is not provided because it is not reliably available from free public APIs. This endpoint returns BTC context only.',
          last_updated: new Date().toISOString(),
          sources: [source]
        }
      }
    });

  } catch (error) {
    console.error('ETF API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch ETF data'
    }, { status: 500 });
  }
}
