import { NextResponse } from 'next/server';
import { 
  syncAllData, 
  backfillHistoricalData,
  fetchMarketData,
  fetchFearGreedIndex,
  fetchDeFiProtocols,
  fetchGlobalData,
} from '@/lib/dataIngestion';

// POST - Trigger data sync
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'sync', options = {} } = body;

    let result;

    switch (action) {
      case 'sync':
        // Full sync of all data sources
        console.log('🚀 Manual sync triggered');
        result = await syncAllData();
        return NextResponse.json({
          success: true,
          action: 'sync',
          results: result,
          timestamp: new Date().toISOString(),
        });

      case 'backfill':
        // Backfill historical data
        console.log('📚 Backfill triggered');
        await backfillHistoricalData();
        return NextResponse.json({
          success: true,
          action: 'backfill',
          message: 'Historical backfill completed',
          timestamp: new Date().toISOString(),
        });

      case 'market':
        // Just market data
        const marketData = await fetchMarketData(1, options.limit || 100);
        return NextResponse.json({
          success: true,
          action: 'market',
          data: marketData,
          count: marketData.length,
          timestamp: new Date().toISOString(),
        });

      case 'fear-greed':
        // Just fear & greed
        const fearGreed = await fetchFearGreedIndex();
        return NextResponse.json({
          success: true,
          action: 'fear-greed',
          data: fearGreed,
          timestamp: new Date().toISOString(),
        });

      case 'defi':
        // Just DeFi data
        const defiData = await fetchDeFiProtocols();
        return NextResponse.json({
          success: true,
          action: 'defi',
          data: defiData.slice(0, options.limit || 50),
          count: defiData.length,
          timestamp: new Date().toISOString(),
        });

      case 'global':
        // Just global metrics
        const globalData = await fetchGlobalData();
        return NextResponse.json({
          success: true,
          action: 'global',
          data: globalData,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          validActions: ['sync', 'backfill', 'market', 'fear-greed', 'defi', 'global'],
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Data sync error:', error);
    return NextResponse.json({
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// GET - Check sync status and last sync time
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'status') {
    // Return sync status
    return NextResponse.json({
      status: 'ready',
      lastSync: null, // TODO: Store this in DB
      nextScheduledSync: null,
      availableActions: ['sync', 'backfill', 'market', 'fear-greed', 'defi', 'global'],
    });
  }

  // Quick data fetch for testing
  if (action === 'test') {
    try {
      const fearGreed = await fetchFearGreedIndex();
      return NextResponse.json({
        success: true,
        test: 'API connection working',
        sample: fearGreed,
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'API test failed',
      }, { status: 500 });
    }
  }

  return NextResponse.json({
    message: 'Data Sync API',
    endpoints: {
      'POST /': 'Trigger sync with action in body',
      'GET /?action=status': 'Check sync status',
      'GET /?action=test': 'Test API connectivity',
    },
  });
}
