/**
 * Chart History API
 * Returns price history data for charts
 * Uses Binance API (FREE, Commercial OK) as primary source
 * Falls back to CoinGecko or mock data if needed
 */

import { NextResponse } from 'next/server';
import { getBinanceKlines, getCoinSymbol } from '@/lib/binance';
import { getPriceHistory } from '@/lib/coingecko';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    const days = parseInt(searchParams.get('days') || '30');

    // Try Binance first (commercial-friendly, supports up to 1000 daily candles = ~2.7 years)
    const binanceSymbol = getCoinSymbol(coin);

    if (binanceSymbol) {
      // Binance supports up to 1000 candles per request
      const limit = Math.min(days, 1000);
      const klines = await getBinanceKlines(binanceSymbol, '1d', limit);

      if (klines && klines.length > 0) {
        const priceHistory = klines.map(k => ({
          timestamp: k.timestamp,
          price: k.close,
          open: k.open,
          high: k.high,
          low: k.low,
          volume: k.volume,
        }));

        return NextResponse.json({
          prices: priceHistory,
          source: 'binance',
          coin,
          days: priceHistory.length,
        });
      }
    }

    // Fallback to CoinGecko if Binance fails
    const priceHistory = await getPriceHistory(coin, days);

    if (priceHistory && priceHistory.length > 0) {
      return NextResponse.json({
        prices: priceHistory,
        source: 'coingecko',
        coin,
        days,
      });
    }

    // Final fallback: mock data
    const mockData = generateMockPriceHistory(coin, days);
    return NextResponse.json({ prices: mockData, source: 'mock' });

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
      open: currentPrice * (1 - volatility/2),
      high: currentPrice * (1 + volatility),
      low: currentPrice * (1 - volatility),
      volume: Math.random() * 1000000000,
    });
  }

  return prices;
}
