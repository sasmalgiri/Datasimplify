import { NextResponse } from 'next/server';
import { getBinanceKlines, getCoinSymbol } from '@/lib/binance';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { getPriceHistory } from '@/lib/coingecko';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  try {
    const symbol = getCoinSymbol(id);
    if (symbol) {
      const limit = Math.min(days, 1000);
      const klines = await getBinanceKlines(symbol, '1d', limit);
      if (klines && klines.length > 0) {
        assertRedistributionAllowed('binance', { purpose: 'chart', route: '/api/crypto/[id]/history' });
        return NextResponse.json({
          coinId: id,
          days,
          prices: klines.map(k => ({ timestamp: k.timestamp, price: k.close })),
          source: 'binance',
        });
      }
    }

    if (!isFeatureEnabled('coingecko')) {
      return NextResponse.json(
        { error: 'Failed to fetch price history (CoinGecko disabled)', prices: [], source: 'none' },
        { status: 502 }
      );
    }

    assertRedistributionAllowed('coingecko', { purpose: 'chart', route: '/api/crypto/[id]/history' });

    const prices = await getPriceHistory(id, days);
    
    return NextResponse.json({
      coinId: id,
      days,
      prices,
      source: 'coingecko',
    });
  } catch (error) {
    console.error('Price history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history', prices: [], source: 'error' },
      { status: 500 }
    );
  }
}
