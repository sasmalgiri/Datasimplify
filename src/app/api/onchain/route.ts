import { NextResponse } from 'next/server';
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

  try {
    let data;

    switch (type) {
      case 'dashboard':
        data = await fetchOnChainDashboard();
        break;
      
      case 'fear-greed':
        data = await fetchFearGreedIndex();
        break;
      
      case 'defi-tvl':
        data = await fetchDeFiTVL();
        break;
      
      case 'defi-protocols':
        data = await fetchTopDeFiProtocols(limit);
        break;
      
      case 'stablecoins':
        data = await fetchStablecoinData();
        break;
      
      case 'yields':
        data = await fetchYieldData(limit);
        break;
      
      case 'bitcoin':
        data = await fetchBitcoinStats();
        break;
      
      case 'gas':
        data = await fetchEthGasPrices();
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      data,
      type,
      timestamp: new Date().toISOString(),
      source: 'FREE Public APIs (DefiLlama, blockchain.info, RPC nodes)',
    });

  } catch (error) {
    console.error('On-chain API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch on-chain data' },
      { status: 500 }
    );
  }
}
