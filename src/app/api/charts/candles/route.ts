/**
 * Candlestick Chart API
 * Returns OHLCV data for candlestick charts
 */

import { NextResponse } from 'next/server';
import { getBinanceKlines, getCoinSymbol } from '@/lib/binance';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    const days = parseInt(searchParams.get('days') || '30');
    const interval = days <= 1 ? '1h' : days <= 7 ? '4h' : '1d';

    const symbol = getCoinSymbol(coin);

    if (!symbol) {
      // Return mock data for unsupported coins
      return NextResponse.json({
        candles: generateMockCandles(coin, days),
        source: 'mock',
        coin,
        days,
      });
    }

    // Binance supports up to 1000 candles per request
    const limit = Math.min(days <= 1 ? 24 : days <= 7 ? days * 6 : days, 1000);
    const klines = await getBinanceKlines(symbol, interval as '1h' | '4h' | '1d', limit);

    if (!klines || klines.length === 0) {
      return NextResponse.json({
        candles: generateMockCandles(coin, days),
        source: 'mock',
        coin,
        days,
      });
    }

    return NextResponse.json({
      candles: klines,
      source: 'binance',
      coin,
      days,
      interval,
    });
  } catch (error) {
    console.error('Candles API error:', error);

    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    const days = parseInt(searchParams.get('days') || '30');

    return NextResponse.json({
      candles: generateMockCandles(coin, days),
      source: 'mock',
      error: String(error),
    });
  }
}

function generateMockCandles(coin: string, days: number) {
  const basePrice = coin === 'bitcoin' ? 45000 :
                   coin === 'ethereum' ? 2500 :
                   coin === 'solana' ? 100 :
                   coin === 'binancecoin' ? 300 : 50;

  const candles = [];
  let currentPrice = basePrice;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));

    const open = currentPrice;
    const volatility = 0.02 + Math.random() * 0.03;
    const close = open * (1 + (Math.random() - 0.5) * volatility * 2);
    const high = Math.max(open, close) * (1 + Math.random() * volatility);
    const low = Math.min(open, close) * (1 - Math.random() * volatility);
    const volume = (Math.random() * 50000 + 10000) * basePrice;

    candles.push({
      timestamp: date.getTime(),
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return candles;
}
