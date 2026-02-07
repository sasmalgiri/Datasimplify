/**
 * Power Query Coin Details Endpoint
 *
 * Returns detailed info for a specific coin for Excel Power Query.
 *
 * Usage in Power Query:
 * = Json.Document(Web.Contents("https://cryptoreportkit.com/api/powerquery/coin?id=bitcoin"))
 *
 * Parameters:
 * - id: Coin ID (required, e.g., "bitcoin", "ethereum")
 */

import { NextRequest, NextResponse } from 'next/server';

// Cache for 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 300000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get('id')?.toLowerCase();

  if (!coinId) {
    return NextResponse.json(
      { error: 'id parameter is required (e.g., id=bitcoin)' },
      { status: 400 }
    );
  }

  const cached = cache.get(coinId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: `Coin "${coinId}" not found` }, { status: 404 });
      }
      return NextResponse.json({ error: 'CoinGecko API error' }, { status: 502 });
    }

    const raw = await response.json();
    const m = raw.market_data || {};

    // Flat structure for Power Query
    const data = {
      ID: raw.id,
      Name: raw.name,
      Symbol: raw.symbol?.toUpperCase(),
      Rank: raw.market_cap_rank,
      Price: m.current_price?.usd,
      MarketCap: m.market_cap?.usd,
      Volume24h: m.total_volume?.usd,
      Change24h: m.price_change_percentage_24h,
      Change7d: m.price_change_percentage_7d,
      Change30d: m.price_change_percentage_30d,
      Change1y: m.price_change_percentage_1y,
      High24h: m.high_24h?.usd,
      Low24h: m.low_24h?.usd,
      ATH: m.ath?.usd,
      ATHDate: m.ath_date?.usd,
      ATHChange: m.ath_change_percentage?.usd,
      ATL: m.atl?.usd,
      ATLDate: m.atl_date?.usd,
      ATLChange: m.atl_change_percentage?.usd,
      CirculatingSupply: m.circulating_supply,
      TotalSupply: m.total_supply,
      MaxSupply: m.max_supply,
      FullyDilutedValuation: m.fully_diluted_valuation?.usd,
      GenesisDate: raw.genesis_date,
      LastUpdated: m.last_updated,
    };

    cache.set(coinId, { data, timestamp: Date.now() });

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('[PowerQuery Coin] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch coin data' }, { status: 500 });
  }
}
