/**
 * Power Query Wallet Balance Endpoint
 *
 * GET /api/powerquery/wallet?address=0x...&chain=ethereum
 *
 * No auth required - block explorer APIs are public.
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=60',
};

const EXPLORERS: Record<string, { url: string; symbol: string; decimals: number; coinId: string }> = {
  ethereum: { url: 'https://api.etherscan.io/api', symbol: 'ETH', decimals: 18, coinId: 'ethereum' },
  eth: { url: 'https://api.etherscan.io/api', symbol: 'ETH', decimals: 18, coinId: 'ethereum' },
  bsc: { url: 'https://api.bscscan.com/api', symbol: 'BNB', decimals: 18, coinId: 'binancecoin' },
  polygon: { url: 'https://api.polygonscan.com/api', symbol: 'MATIC', decimals: 18, coinId: 'matic-network' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chain = (searchParams.get('chain') || 'ethereum').toLowerCase();

  if (!address || address.length < 10) {
    return NextResponse.json({ error: 'Valid wallet address required' }, { status: 400 });
  }

  const explorer = EXPLORERS[chain];
  if (!explorer) {
    return NextResponse.json({ error: 'Supported chains: ethereum, bsc, polygon' }, { status: 400 });
  }

  try {
    // Get native balance
    const balanceRes = await fetch(`${explorer.url}?module=account&action=balance&address=${address}&tag=latest`);
    const balanceData = await balanceRes.json();

    if (balanceData.status !== '1' && balanceData.message !== 'OK') {
      return NextResponse.json({ error: balanceData.result || 'Explorer API error' }, { status: 502 });
    }

    const rawBalance = parseFloat(balanceData.result);
    const balance = rawBalance / Math.pow(10, explorer.decimals);

    // Get USD price
    const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${explorer.coinId}&vs_currencies=usd`);
    const priceData = await priceRes.json();
    const usdPrice = priceData[explorer.coinId]?.usd || 0;

    const data = [{
      Chain: chain,
      Address: address,
      Token: explorer.symbol,
      Balance: Math.round(balance * 1e8) / 1e8,
      PriceUSD: Math.round(usdPrice * 100) / 100,
      ValueUSD: Math.round(balance * usdPrice * 100) / 100,
    }];

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery Wallet] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet balance' }, { status: 500 });
  }
}
