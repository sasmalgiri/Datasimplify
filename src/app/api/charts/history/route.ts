/**
 * Chart History API
 * Returns price history data for charts
 */

import { NextResponse } from 'next/server';
import { getPriceHistory } from '@/lib/coingecko';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    const days = parseInt(searchParams.get('days') || '30');

    const priceHistory = await getPriceHistory(coin, days);

    if (!priceHistory || priceHistory.length === 0) {
      // Return mock data if API fails
      const mockData = generateMockPriceHistory(coin, days);
      return NextResponse.json({ prices: mockData, source: 'mock' });
    }

    return NextResponse.json({
      prices: priceHistory,
      source: 'coingecko',
      coin,
      days,
    });
  } catch (error) {
    console.error('Chart history API error:', error);

    // Return mock data on error
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    const days = parseInt(searchParams.get('days') || '30');

    return NextResponse.json({
      prices: generateMockPriceHistory(coin, days),
      source: 'mock',
      error: String(error),
    });
  }
}

function generateMockPriceHistory(coin: string, days: number) {
  const basePrice = coin === 'bitcoin' ? 45000 :
                   coin === 'ethereum' ? 2500 :
                   coin === 'solana' ? 100 :
                   coin === 'binancecoin' ? 300 : 50;

  const prices = [];
  let currentPrice = basePrice;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));

    // Add some realistic price movement
    const volatility = 0.02 + Math.random() * 0.03;
    const trend = Math.random() > 0.5 ? 1 : -1;
    currentPrice = currentPrice * (1 + trend * volatility * (Math.random() - 0.3));

    prices.push({
      timestamp: date.getTime(),
      price: currentPrice,
    });
  }

  return prices;
}
