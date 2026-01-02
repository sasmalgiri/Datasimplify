/**
 * AI Data Ingestion API
 * Triggers data collection pipeline for AI predictions
 */

import { NextResponse } from 'next/server';
import { runFullIngestion, createPredictionSnapshot, batchCreateSnapshots, backfillHistoricalData } from '@/lib/predictionIngestion';

// Protect ingestion endpoint (expensive + write operations)
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

function assertAuthorized(request: Request): NextResponse | null {
  const expected = getExpectedSecret();
  if (!expected) {
    return NextResponse.json(
      { error: 'Ingestion API not configured. Set SYNC_SECRET_KEY.' },
      { status: 503 }
    );
  }

  const provided = getProvidedSecret(request);
  if (!provided || provided !== expected) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide valid secret key via ?secret= or Authorization header.' },
      { status: 401 }
    );
  }

  return null;
}

export async function POST(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { type = 'full', coins, action } = body;

    // Handle different actions
    if (action === 'backfill') {
      const result = await backfillHistoricalData();
      return NextResponse.json({
        success: result.success,
        updated: result.updated,
        errors: result.errors,
      });
    }

    if (action === 'snapshot' && coins?.length === 1) {
      const result = await createPredictionSnapshot(coins[0]);
      return NextResponse.json(result);
    }

    if (action === 'batch' && coins?.length > 0) {
      const result = await batchCreateSnapshots(coins);
      return NextResponse.json(result);
    }

    // Default: run full ingestion
    const result = await runFullIngestion({
      type: type as 'full' | 'incremental' | 'market_only' | 'sentiment_only',
      coins,
      storeTrainingData: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Ingestion API error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  // Return ingestion status
  try {
    // Simple status check
    return NextResponse.json({
      status: 'ready',
      availableActions: ['full', 'incremental', 'snapshot', 'batch', 'backfill'],
      defaultCoins: [
        'bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot',
        'avalanche-2', 'polygon', 'chainlink', 'uniswap', 'arbitrum'
      ],
      usage: {
        full: 'POST { type: "full" } - Run complete ingestion',
        incremental: 'POST { type: "incremental", coins: ["bitcoin"] } - Update specific coins',
        snapshot: 'POST { action: "snapshot", coins: ["bitcoin"] } - Single snapshot',
        batch: 'POST { action: "batch", coins: ["bitcoin", "ethereum"] } - Batch snapshots',
        backfill: 'POST { action: "backfill" } - Backfill historical data',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
