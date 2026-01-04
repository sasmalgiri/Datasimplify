import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  getDefiProtocolsFromCache,
  getDefiYieldsFromCache,
  getChainTvlFromCache,
  getStablecoinsFromCache,
  getFearGreedHistoryFromCache,
  getBitcoinStatsFromCache,
  getGasPricesFromCache,
  getDashboardDataFromCache,
} from '@/lib/supabaseData';
import {
  fetchFearGreedIndex,
  fetchDeFiTVL,
  fetchTopDeFiProtocols,
  fetchStablecoinData,
  fetchYieldData,
  fetchBitcoinStats,
  fetchEthGasPrices,
  fetchOnChainDashboard,
} from '@/lib/onChainData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'dashboard';
  const limit = parseInt(searchParams.get('limit') || '50');

  const requiresDefi = ['defi-tvl', 'defi-protocols', 'stablecoins', 'yields'].includes(type);
  if (requiresDefi && !isFeatureEnabled('defi')) {
    return NextResponse.json(
      {
        error: 'DeFi data is disabled.',
        type,
      },
      { status: 403 }
    );
  }

  try {
    let data;
    let source = 'api';

    switch (type) {
      case 'dashboard':
        // Try cache first
        if (isSupabaseConfigured) {
          const cached = await getDashboardDataFromCache();
          if (cached && Object.keys(cached).length > 0) {
            data = cached;
            source = 'cache';
            break;
          }
        }
        data = await fetchOnChainDashboard();
        break;

      case 'fear-greed':
        // Try cache first
        if (isSupabaseConfigured) {
          const cached = await getFearGreedHistoryFromCache(1);
          if (cached && cached.length > 0) {
            data = cached[0];
            source = 'cache';
            break;
          }
        }
        data = await fetchFearGreedIndex();
        break;

      case 'defi-tvl':
        // Try cache first
        if (isSupabaseConfigured) {
          const cached = await getChainTvlFromCache();
          if (cached && cached.length > 0) {
            data = cached;
            source = 'cache';
            break;
          }
        }
        data = await fetchDeFiTVL();
        break;

      case 'defi-protocols':
        // Try cache first
        if (isSupabaseConfigured) {
          const cached = await getDefiProtocolsFromCache(limit);
          if (cached && cached.length > 0) {
            data = cached;
            source = 'cache';
            break;
          }
        }
        data = await fetchTopDeFiProtocols(limit);
        break;

      case 'stablecoins':
        // Try cache first
        if (isSupabaseConfigured) {
          const cached = await getStablecoinsFromCache();
          if (cached && cached.length > 0) {
            data = cached;
            source = 'cache';
            break;
          }
        }
        data = await fetchStablecoinData();
        break;

      case 'yields':
        // Try cache first
        if (isSupabaseConfigured) {
          const cached = await getDefiYieldsFromCache(limit);
          if (cached && cached.length > 0) {
            data = cached;
            source = 'cache';
            break;
          }
        }
        data = await fetchYieldData(limit);
        break;

      case 'bitcoin':
        // Try cache first
        if (isSupabaseConfigured) {
          const cached = await getBitcoinStatsFromCache();
          if (cached && Object.keys(cached).length > 0) {
            data = cached;
            source = 'cache';
            break;
          }
        }
        data = await fetchBitcoinStats();
        break;

      case 'gas':
        // Try cache first
        if (isSupabaseConfigured) {
          const cached = await getGasPricesFromCache();
          if (cached && Object.keys(cached).length > 0) {
            data = cached;
            source = 'cache';
            break;
          }
        }
        data = await fetchEthGasPrices();
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      data,
      type,
      timestamp: new Date().toISOString(),
      source:
        source === 'cache'
          ? 'supabase_cache'
          : requiresDefi
            ? 'Third-party APIs (DeFi domain)'
            : 'Public APIs (blockchain.info, RPC nodes)',
    });

  } catch (error) {
    console.error('On-chain API error:', error);

    // On error, try to return cached data as fallback
    if (isSupabaseConfigured) {
      try {
        let fallbackData;
        switch (type) {
          case 'dashboard':
            fallbackData = await getDashboardDataFromCache();
            break;
          case 'fear-greed':
            const fg = await getFearGreedHistoryFromCache(1);
            fallbackData = fg?.[0];
            break;
          case 'defi-tvl':
            fallbackData = await getChainTvlFromCache();
            break;
          case 'defi-protocols':
            fallbackData = await getDefiProtocolsFromCache(limit);
            break;
          case 'stablecoins':
            fallbackData = await getStablecoinsFromCache();
            break;
          case 'yields':
            fallbackData = await getDefiYieldsFromCache(limit);
            break;
          case 'bitcoin':
            fallbackData = await getBitcoinStatsFromCache();
            break;
          case 'gas':
            fallbackData = await getGasPricesFromCache();
            break;
        }

        if (fallbackData && (Array.isArray(fallbackData) ? fallbackData.length > 0 : Object.keys(fallbackData).length > 0)) {
          return NextResponse.json({
            data: fallbackData,
            type,
            timestamp: new Date().toISOString(),
            source: 'stale_cache',
          });
        }
      } catch (cacheError) {
        console.error('Cache fallback error:', cacheError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch on-chain data' },
      { status: 500 }
    );
  }
}
