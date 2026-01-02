/**
 * AI Training Data Export API
 * Export prediction data in ML-ready format
 */

import { NextResponse } from 'next/server';
import { getTrainingData, getTrainingDataStats } from '@/lib/predictionDb';

// Protect training export endpoint (valuable dataset)
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

// Training data record type
interface TrainingDataRecord {
  id: string;
  coinId: string;
  snapshotTimestamp: Date;
  features: Record<string, unknown>;
  price1hLater?: number;
  price24hLater?: number;
  price7dLater?: number;
  actualDirection24h?: string;
  actualChangePct24h?: number;
  predictionWasCorrect?: boolean;
  predictionError?: string;
}

export async function GET(request: Request) {
  const expected = getExpectedSecret();
  if (!expected) {
    return NextResponse.json(
      { error: 'Training API not configured. Set SYNC_SECRET_KEY.' },
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

  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin');
    const format = searchParams.get('format') || 'json';
    const limit = parseInt(searchParams.get('limit') || '1000');
    const includeNulls = searchParams.get('includeNulls') === 'true';
    const onlyCorrect = searchParams.get('onlyCorrect') === 'true';
    const stats = searchParams.get('stats') === 'true';

    // If requesting stats only
    if (stats) {
      const statsData = await getTrainingDataStats(coin || undefined);
      return NextResponse.json(statsData);
    }

    // Get training data
    const rawData = await getTrainingData({
      coinId: coin || undefined,
      limit,
      onlyValidated: !includeNulls,
    });
    const data = rawData as TrainingDataRecord[];

    // Filter for correct predictions if requested
    let filteredData = data;
    if (onlyCorrect) {
      filteredData = data.filter(d => d.predictionWasCorrect === true);
    }

    // Format output
    if (format === 'csv') {
      // Convert to CSV
      if (filteredData.length === 0) {
        return new NextResponse('No data available', {
          status: 200,
          headers: { 'Content-Type': 'text/csv' },
        });
      }

      // Get feature keys from first record
      const firstFeatures = filteredData[0].features as Record<string, unknown>;
      const featureKeys = Object.keys(firstFeatures);

      // Build CSV header
      const headers = [
        'id',
        'coin_id',
        'timestamp',
        ...featureKeys,
        'price_1h_later',
        'price_24h_later',
        'price_7d_later',
        'actual_direction_24h',
        'actual_change_pct_24h',
        'prediction_was_correct',
        'prediction_error',
      ];

      // Build CSV rows
      const rows = filteredData.map(record => {
        const features = record.features as Record<string, unknown>;
        return [
          record.id,
          record.coinId,
          record.snapshotTimestamp.toISOString(),
          ...featureKeys.map(key => features[key] ?? ''),
          record.price1hLater ?? '',
          record.price24hLater ?? '',
          record.price7dLater ?? '',
          record.actualDirection24h ?? '',
          record.actualChangePct24h ?? '',
          record.predictionWasCorrect ?? '',
          record.predictionError ?? '',
        ];
      });

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${val}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="training_data_${coin || 'all'}_${Date.now()}.csv"`,
        },
      });
    }

    // Default JSON format
    return NextResponse.json({
      coin: coin || 'all',
      count: filteredData.length,
      format,
      exportedAt: new Date().toISOString(),
      records: filteredData.map(record => ({
        id: record.id,
        coinId: record.coinId,
        timestamp: record.snapshotTimestamp.toISOString(),
        features: record.features,
        targets: {
          price1hLater: record.price1hLater,
          price24hLater: record.price24hLater,
          price7dLater: record.price7dLater,
          actualDirection24h: record.actualDirection24h,
          actualChangePct24h: record.actualChangePct24h,
        },
        outcome: {
          predictionWasCorrect: record.predictionWasCorrect,
          predictionError: record.predictionError,
        },
      })),
    });
  } catch (error) {
    console.error('Training data API error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
