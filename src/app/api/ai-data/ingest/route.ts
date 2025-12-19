/**
 * AI Data Ingestion API
 * Triggers data collection pipeline for AI predictions
 */

import { NextResponse } from 'next/server';
import { runFullIngestion, createPredictionSnapshot, batchCreateSnapshots, backfillHistoricalData } from '@/lib/predictionIngestion';

export async function POST(request: Request) {
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

export async function GET() {
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
