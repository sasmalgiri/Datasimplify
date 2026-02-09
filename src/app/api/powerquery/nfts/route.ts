/**
 * Power Query NFT Collections Endpoint
 *
 * GET /api/powerquery/nfts?limit=50
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
};

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '50'), 100);

  try {
    const url = `https://api.coingecko.com/api/v3/nfts/list?per_page=${limit}&page=1`;
    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: 'API error' }, { status: 502 });

    const raw = await response.json();
    const data = raw.map((nft: any) => ({
      ID: nft.id,
      Name: nft.name,
      Symbol: nft.symbol || '',
      ContractAddress: nft.contract_address || '',
      Platform: nft.asset_platform_id || '',
    }));

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery NFTs] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 });
  }
}
