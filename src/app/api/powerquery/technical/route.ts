/**
 * Power Query Technical Indicators Endpoint
 *
 * GET /api/powerquery/technical?coin=bitcoin&days=30
 *
 * Returns RSI, SMA, EMA, MACD, Bollinger Bands for a coin.
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coin = searchParams.get('coin') || 'bitcoin';
  const days = Math.min(parseInt(searchParams.get('days') || '30'), 365);

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=${days}`;
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: 'CoinGecko API error' }, { status: 502 });
    }

    const raw = await response.json();
    const prices = (raw.prices || []).map((p: number[]) => p[1]);

    if (prices.length < 20) {
      return NextResponse.json({ error: 'Insufficient data' }, { status: 400 });
    }

    // RSI (14-period)
    const rsiPeriod = 14;
    let gains = 0, losses = 0;
    for (let i = prices.length - rsiPeriod; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    const avgGain = gains / rsiPeriod;
    const avgLoss = losses / rsiPeriod;
    const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

    // SMA (20-period)
    const smaPeriod = 20;
    let smaSum = 0;
    for (let i = prices.length - smaPeriod; i < prices.length; i++) smaSum += prices[i];
    const sma20 = smaSum / smaPeriod;

    // EMA (20-period)
    const emaMult = 2 / (smaPeriod + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * emaMult + ema;
    }

    // MACD (12, 26, 9)
    let ema12 = prices[0], ema26 = prices[0];
    const mult12 = 2 / 13, mult26 = 2 / 27;
    for (let i = 1; i < prices.length; i++) {
      ema12 = (prices[i] - ema12) * mult12 + ema12;
      ema26 = (prices[i] - ema26) * mult26 + ema26;
    }
    const macdLine = ema12 - ema26;

    // Bollinger Bands (20-period, 2 std dev)
    const bbSlice = prices.slice(-smaPeriod);
    const bbMean = bbSlice.reduce((a: number, b: number) => a + b, 0) / smaPeriod;
    const variance = bbSlice.reduce((sum: number, p: number) => sum + Math.pow(p - bbMean, 2), 0) / smaPeriod;
    const stdDev = Math.sqrt(variance);

    const currentPrice = prices[prices.length - 1];

    const data = [{
      Coin: coin,
      Price: Math.round(currentPrice * 100) / 100,
      RSI_14: Math.round(rsi * 100) / 100,
      SMA_20: Math.round(sma20 * 100) / 100,
      EMA_20: Math.round(ema * 100) / 100,
      MACD: Math.round(macdLine * 100) / 100,
      BB_Upper: Math.round((bbMean + 2 * stdDev) * 100) / 100,
      BB_Middle: Math.round(bbMean * 100) / 100,
      BB_Lower: Math.round((bbMean - 2 * stdDev) * 100) / 100,
      RSI_Signal: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
      DataPoints: prices.length,
    }];

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery Technical] Error:', error);
    return NextResponse.json({ error: 'Failed to calculate indicators' }, { status: 500 });
  }
}
