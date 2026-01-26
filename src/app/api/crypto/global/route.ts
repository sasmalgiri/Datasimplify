/**
 * Global Market Stats API Route
 *
 * Returns global market statistics from CoinGecko
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchGlobalStats } from '@/lib/dataApi';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/global');
  if (blocked) return blocked;

  try {
    assertRedistributionAllowed('coingecko', { purpose: 'chart', route: '/api/crypto/global' });

    const globalStats = await fetchGlobalStats();

    if (!globalStats) {
      return NextResponse.json({ data: null, error: 'Unable to fetch global stats' }, { status: 502 });
    }

    // Format response to match expected shape used by UI
    const data = {
      total_market_cap: { usd: globalStats.totalMarketCap },
      total_volume: { usd: globalStats.totalVolume24h },
      market_cap_percentage: {
        btc: globalStats.btcDominance,
        eth: globalStats.ethDominance,
      },
      market_cap_change_percentage_24h_usd: globalStats.marketCapChange24h,
      active_cryptocurrencies: globalStats.activeCryptocurrencies,
    };

    return NextResponse.json({
      data,
      source: 'coingecko',
      updated: globalStats.updatedAt,
    });

  } catch (error) {
    console.error('Global API error:', error);
    return NextResponse.json({ data: null, error: 'Failed to fetch' }, { status: 500 });
  }
}
