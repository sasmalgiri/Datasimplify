import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  syncAllData,
  syncMarketData,
  syncDefiData,
  syncSentimentData,
  syncWhaleData,
  syncOnChainMetrics,
} from '@/lib/syncService';
import { cleanupOldData, getDatabaseStats } from '@/lib/dbCleanup';

// Secret key to protect sync endpoint
const SYNC_SECRET = process.env.SYNC_SECRET_KEY || 'dev-secret-change-in-production';

export async function GET(request: Request) {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      error: 'Supabase not configured',
      message: 'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env.local',
    }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';

  // Get secret from query param OR Authorization header
  const querySecret = searchParams.get('secret');
  const authHeader = request.headers.get('Authorization');
  const headerSecret = authHeader?.replace('Bearer ', '');
  const secret = querySecret || headerSecret;

  // Verify secret (protect from unauthorized access)
  if (secret !== SYNC_SECRET) {
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
      case 'defi':
        result = await syncDefiData();
        break;
      case 'sentiment':
        result = await syncSentimentData();
        break;
      case 'whales':
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
      default:
        return NextResponse.json(
          { error: 'Invalid sync type', validTypes: ['all', 'market', 'defi', 'sentiment', 'whales', 'onchain', 'cleanup', 'stats'] },
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
