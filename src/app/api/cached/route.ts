import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  getMarketDataFromCache,
  getCoinFromCache,
  getDefiProtocolsFromCache,
  getDefiYieldsFromCache,
  getChainTvlFromCache,
  getStablecoinsFromCache,
  getMarketSentimentFromCache,
  getCoinSentimentFromCache,
  getSentimentPostsFromCache,
  getFearGreedHistoryFromCache,
  getWhaleTransactionsFromCache,
  getExchangeFlowsFromCache,
  getBitcoinStatsFromCache,
  getGasPricesFromCache,
  getDashboardDataFromCache,
  checkDataFreshness,
} from '@/lib/supabaseData';

export async function GET(request: Request) {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      error: 'Supabase not configured',
      message: 'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
      alternative: 'Configure Supabase or use the standard (non-cached) app pages.',
    }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'dashboard';
  const symbol = searchParams.get('symbol');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    let data;
    const source = 'supabase_cache';

    switch (type) {
      // === DASHBOARD ===
      case 'dashboard':
        data = await getDashboardDataFromCache();
        break;

      // === MARKET DATA ===
      case 'market':
        data = await getMarketDataFromCache({
          category: category || undefined,
          limit,
        });
        break;

      case 'coin':
        if (!symbol) {
          return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
        }
        data = await getCoinFromCache(symbol.toUpperCase());
        break;

      // === DEFI DATA ===
      case 'defi-protocols':
        data = await getDefiProtocolsFromCache(limit);
        break;

      case 'defi-yields':
        data = await getDefiYieldsFromCache(limit);
        break;

      case 'chain-tvl':
        data = await getChainTvlFromCache();
        break;

      case 'stablecoins':
        data = await getStablecoinsFromCache();
        break;

      // === SENTIMENT DATA ===
      case 'sentiment':
        data = await getMarketSentimentFromCache();
        break;

      case 'coin-sentiment':
        data = await getCoinSentimentFromCache(symbol?.toUpperCase());
        break;

      case 'sentiment-posts':
        const source_filter = searchParams.get('source');
        const coins = searchParams.get('coins')?.split(',');
        const sentiment_type = searchParams.get('sentiment') as 'bullish' | 'bearish' | undefined;
        
        data = await getSentimentPostsFromCache({
          source: source_filter || undefined,
          coins,
          sentiment: sentiment_type,
          limit,
        });
        break;

      case 'fear-greed':
        const days = parseInt(searchParams.get('days') || '30');
        data = await getFearGreedHistoryFromCache(days);
        break;

      // === WHALE DATA ===
      case 'whales':
        const blockchain = searchParams.get('blockchain');
        const tx_type = searchParams.get('tx_type');
        const minAmount = parseFloat(searchParams.get('minAmount') || '0');
        
        data = await getWhaleTransactionsFromCache({
          blockchain: blockchain || undefined,
          type: tx_type || undefined,
          minAmountUsd: minAmount || undefined,
          limit,
        });
        break;

      case 'exchange-flows':
        data = await getExchangeFlowsFromCache();
        break;

      // === ON-CHAIN METRICS ===
      case 'bitcoin':
        data = await getBitcoinStatsFromCache();
        break;

      case 'gas':
        data = await getGasPricesFromCache();
        break;

      // === META ===
      case 'freshness':
        data = await checkDataFreshness();
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      type,
      source,
      timestamp: new Date().toISOString(),
      note: 'Data from Supabase cache. Updated every 1-15 minutes depending on type.',
    });

  } catch (error) {
    console.error('Cached data API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch data', 
        details: String(error),
        fallback: 'If cache is empty, run /api/sync first to populate data'
      },
      { status: 500 }
    );
  }
}
