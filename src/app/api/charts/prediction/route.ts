/**
 * AI Prediction Chart API
 * Returns prediction data for visualization
 */

import { NextResponse } from 'next/server';
import { getHistoricalAccuracy, getPredictionHistory, getPredictionStats, type PredictionSnapshot } from '@/lib/predictionDb';
import { isFeatureEnabled } from '@/lib/featureFlags';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

type MarketChart = {
  prices: [number, number][];
};

async function fetchCoinGeckoPrices(coinId: string, days: number): Promise<[number, number][]> {
  const url = `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  });
  if (!response.ok) return [];
  const data = (await response.json()) as MarketChart;
  return Array.isArray(data?.prices) ? data.prices : [];
}

function computeTrendSignal(prices: [number, number][]) {
  if (prices.length < 2) {
    return { prediction: 'NEUTRAL' as const, confidence: null as number | null, changePct: null as number | null };
  }
  const first = prices[0][1];
  const last = prices[prices.length - 1][1];
  if (!first || !last) {
    return { prediction: 'NEUTRAL' as const, confidence: null as number | null, changePct: null as number | null };
  }
  const changePct = ((last - first) / first) * 100;
  const prediction = changePct > 0.5 ? 'BULLISH' : changePct < -0.5 ? 'BEARISH' : 'NEUTRAL';
  const confidence = Math.min(95, Math.max(5, Math.round(Math.abs(changePct) * 4)));
  return { prediction, confidence, changePct };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';

    // Try to get real prediction data
    let historicalAccuracy = null;
    let predictionHistory: PredictionSnapshot[] | null = null;
    let stats = null;

    try {
      historicalAccuracy = await getHistoricalAccuracy({ coinId: coin, days: 30 });
      predictionHistory = await getPredictionHistory(coin, { limit: 30 });
      stats = await getPredictionStats(coin, 30);
    } catch {
      // DB may not be configured; fall back to free market data signal
    }

    if (!historicalAccuracy || !predictionHistory || predictionHistory.length === 0) {
      if (!isFeatureEnabled('coingecko')) {
        return NextResponse.json({
          prediction: 'NEUTRAL',
          confidence: null,
          accuracy: null,
          history: [],
          priceTarget: null,
          stats: null,
          source: 'disabled',
          coin,
          changePct7d: null,
        });
      }

      const prices7d = await fetchCoinGeckoPrices(coin, 7);
      const trend = computeTrendSignal(prices7d);

      return NextResponse.json({
        prediction: trend.prediction,
        confidence: trend.confidence,
        accuracy: null,
        history: [],
        priceTarget: null,
        stats: null,
        source: 'coingecko-trend',
        coin,
        changePct7d: trend.changePct,
      });
    }

    // Get latest prediction for current direction
    const latestPrediction = predictionHistory[0];

    // Calculate price targets based on historical data
    const recentPrices = predictionHistory
      .filter(p => p.price)
      .map(p => p.price as number)
      .slice(0, 7);

    const avgPrice = recentPrices.length > 0
      ? recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length
      : null;

    // Use historical accuracy from the database
    const bullishPredictions = predictionHistory.filter(p => p.prediction === 'BULLISH');
    const bearishPredictions = predictionHistory.filter(p => p.prediction === 'BEARISH');

    return NextResponse.json({
      prediction: latestPrediction?.prediction || 'NEUTRAL',
      confidence: latestPrediction?.confidence ?? null,
      accuracy: {
        overall: historicalAccuracy.accuracy ?? null,
        bullish: historicalAccuracy.byDirection?.bullish?.total > 0
          ? Math.round((historicalAccuracy.byDirection.bullish.correct / historicalAccuracy.byDirection.bullish.total) * 100)
          : null,
        bearish: historicalAccuracy.byDirection?.bearish?.total > 0
          ? Math.round((historicalAccuracy.byDirection.bearish.correct / historicalAccuracy.byDirection.bearish.total) * 100)
          : null,
      },
      history: predictionHistory.slice(0, 30).map(p => ({
        date: new Date(p.timestamp).toLocaleDateString(),
        predicted: p.prediction,
        actual: null,
        correct: null,
        confidence: p.confidence ?? null,
      })),
      priceTarget: {
        current: avgPrice,
        low: avgPrice !== null ? avgPrice * 0.85 : null,
        mid: avgPrice !== null ? avgPrice * 1.05 : null,
        high: avgPrice !== null ? avgPrice * 1.20 : null,
      },
      stats: stats || {
        totalPredictions: historicalAccuracy?.totalPredictions ?? predictionHistory.length,
        bullishCount: bullishPredictions.length,
        bearishCount: bearishPredictions.length,
        neutralCount: predictionHistory.filter(p => p.prediction === 'NEUTRAL').length,
        avgConfidence: predictionHistory.length > 0
          ? Math.round(predictionHistory.reduce((sum, p) => sum + (p.confidence ?? 0), 0) / predictionHistory.length)
          : null,
      },
      source: 'database',
      coin,
    });
  } catch (error) {
    console.error('Prediction API error:', error);

    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';

    return NextResponse.json({
      prediction: 'NEUTRAL',
      confidence: null,
      accuracy: null,
      history: [],
      priceTarget: null,
      stats: null,
      source: 'error',
      coin,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 502 });
  }
}
