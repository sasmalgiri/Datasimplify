import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  syncAllData,
  syncMarketData,
  syncCoinGeckoData,
  syncCoinLoreData, // Commercial-friendly alternative
  syncDefiData,
  syncSentimentData,
  syncWhaleData,
  syncOnChainMetrics,
  DATA_ATTRIBUTIONS, // Data source attributions for commercial use
} from '@/lib/syncService';
import { cleanupOldData, getDatabaseStats } from '@/lib/dbCleanup';

// Secret key to protect sync endpoint
const SYNC_SECRET_KEY = (process.env.SYNC_SECRET_KEY || '').trim();
const DEV_FALLBACK_SECRET = 'dev-secret-change-in-production';

function getExpectedSecret(): string | null {
  if (SYNC_SECRET_KEY) return SYNC_SECRET_KEY;
  if (process.env.NODE_ENV !== 'production') return DEV_FALLBACK_SECRET;
  return null;
}

function getProvidedSecret(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  const authHeader = request.headers.get('Authorization');
  const headerSecret = authHeader?.replace(/^Bearer\s+/i, '') || null;
  return headerSecret || querySecret;
}

export async function GET(request: Request) {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      error: 'Supabase not configured',
      message: 'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env.local',
    }, { status: 503 });
  }

  const expectedSecret = getExpectedSecret();
  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'Sync API not configured. Set SYNC_SECRET_KEY.' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';

  // Verify secret (protect from unauthorized access)
  const secret = getProvidedSecret(request);
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide valid secret key via ?secret= or Authorization header.' },
      { status: 401 }
    );
  }

  try {
    let result;

    switch (type) {
      case 'all':
        result = await syncAllData();
        break;
      case 'market':
        result = await syncMarketData();
        break;
      case 'coinlore':
        // Commercial-friendly market data (recommended for production)
        result = await syncCoinLoreData();
        break;
      case 'coingecko':
        if (!isFeatureEnabled('coingecko')) {
          return NextResponse.json({ error: 'CoinGecko sync is disabled.' }, { status: 403 });
        }
        // Note: CoinGecko usage requires appropriate rights/license for your product.
        result = await syncCoinGeckoData();
        break;
      case 'defi':
        if (!isFeatureEnabled('defi')) {
          return NextResponse.json({ error: 'DeFi sync is disabled.' }, { status: 403 });
        }
        result = await syncDefiData();
        break;
      case 'sentiment':
        result = await syncSentimentData();
        break;
      case 'whales':
        if (!isFeatureEnabled('whales')) {
          return NextResponse.json({ error: 'Whales sync is disabled.' }, { status: 403 });
        }
        result = await syncWhaleData();
        break;
      case 'onchain':
        result = await syncOnChainMetrics();
        break;
      case 'cleanup':
        // Remove old data that Groq already knows
        result = await cleanupOldData();
        break;
      case 'stats':
        // Get database size stats
        result = await getDatabaseStats();
        break;
      case 'attributions':
        // Return data source attributions (required for commercial use)
        result = DATA_ATTRIBUTIONS;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid sync type', validTypes: ['all', 'market', 'coinlore', 'coingecko', 'defi', 'sentiment', 'whales', 'onchain', 'cleanup', 'stats', 'attributions'] },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    );
  }
}

// Also support POST for webhooks
export async function POST(request: Request) {
  return GET(request);
}
