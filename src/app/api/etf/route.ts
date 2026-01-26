/**
 * Bitcoin ETF Data API
 *
 * Returns BTC price context (ETF flow/AUM data not available from free APIs)
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { isRedistributionPolicyEnabled, isSourceRedistributable } from '@/lib/redistributionPolicy';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

// Bitcoin ETF Data API
// Free, reliable ETF flow + AUM data is not consistently available via public APIs.
// This endpoint intentionally does NOT fabricate/estimate flows or AUM.

async function fetchBtcPriceContext(): Promise<{ btcPrice: number; btcChange24h: number; source: string }> {
  // CoinGecko markets (free)
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

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/etf');
  if (blocked) return blocked;

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
