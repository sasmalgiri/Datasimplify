/**
 * Power Query Companies Endpoint
 *
 * GET /api/powerquery/companies?coin=bitcoin
 *
 * Public companies holding Bitcoin or Ethereum.
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=3600',
};

export async function GET(request: NextRequest) {
  const coin = new URL(request.url).searchParams.get('coin') || 'bitcoin';

  if (coin !== 'bitcoin' && coin !== 'ethereum') {
    return NextResponse.json({ error: 'Only bitcoin and ethereum supported' }, { status: 400 });
  }

  try {
    const url = `https://api.coingecko.com/api/v3/companies/public_treasury/${coin}`;
    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: 'API error' }, { status: 502 });

    const raw = await response.json();
    const companies = raw.companies || [];

    const data = companies.map((c: any, i: number) => ({
      Rank: i + 1,
      Name: c.name,
      Symbol: c.symbol,
      Country: c.country || '',
      TotalHoldings: c.total_holdings,
      TotalEntryValueUSD: c.total_entry_value_usd,
      TotalCurrentValueUSD: c.total_current_value_usd,
      PercentOfTotalSupply: c.percentage_of_total_supply,
    }));

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery Companies] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
