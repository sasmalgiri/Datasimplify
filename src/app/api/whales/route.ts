import { NextResponse } from 'next/server';
import {
  getWhaleDashboard,
  getRecentLargeEthTransactions,
  getBitcoinWhaleTransactions,
  getAllExchangeBalances,
  estimateExchangeFlows,
} from '@/lib/whaleTracking';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'dashboard';
  const minValue = parseFloat(searchParams.get('minValue') || '100');
  const apiKey = searchParams.get('apiKey'); // Optional Etherscan API key for higher limits

  try {
    let data;

    switch (type) {
      case 'dashboard':
        data = await getWhaleDashboard(apiKey || undefined);
        break;
      
      case 'eth-whales':
        data = await getRecentLargeEthTransactions(minValue, apiKey || undefined);
        break;
      
      case 'btc-whales':
        data = await getBitcoinWhaleTransactions(minValue);
        break;
      
      case 'exchange-balances':
        data = await getAllExchangeBalances(apiKey || undefined);
        break;
      
      case 'exchange-flows':
        data = await estimateExchangeFlows();
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      data,
      type,
      timestamp: new Date().toISOString(),
      source: 'FREE APIs (Etherscan, Blockchair, blockchain.info)',
      note: 'For higher rate limits, provide your own Etherscan API key (free tier available)',
    });

  } catch (error) {
    console.error('Whale tracking API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch whale data' },
      { status: 500 }
    );
  }
}
