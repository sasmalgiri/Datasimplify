import { NextResponse } from 'next/server';
import {
  getWhaleDashboard,
  getRecentLargeEthTransactions,
  getBitcoinWhaleTransactions,
  getAllExchangeBalances,
  estimateExchangeFlows,
} from '@/lib/whaleTracking';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  getWhaleTransactionsFromCache,
  saveWhaleTransactionsToCache,
  getWhaleDataFreshness,
  getExchangeFlowsFromCache
} from '@/lib/supabaseData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'dashboard';
  const minValue = parseFloat(searchParams.get('minValue') || '100');
  const apiKey = searchParams.get('apiKey');

  try {
    // 1. Try cache first for whale transactions
    if (isSupabaseConfigured && (type === 'dashboard' || type === 'eth-whales' || type === 'btc-whales')) {
      const isFresh = await getWhaleDataFreshness();
      if (isFresh) {
        const blockchain = type === 'btc-whales' ? 'bitcoin' : type === 'eth-whales' ? 'ethereum' : undefined;
        const cached = await getWhaleTransactionsFromCache({
          blockchain,
          minAmountUsd: minValue * 1000000, // Convert to USD
          limit: 50
        });

        if (cached && cached.length > 0) {
          return NextResponse.json({
            data: type === 'dashboard' ? { transactions: cached, summary: { total: cached.length } } : cached,
            type,
            timestamp: new Date().toISOString(),
            source: 'cache'
          });
        }
      }
    }

    // For exchange flows, try cache
    if (isSupabaseConfigured && type === 'exchange-flows') {
      const cachedFlows = await getExchangeFlowsFromCache();
      if (cachedFlows && cachedFlows.length > 0) {
        return NextResponse.json({
          data: cachedFlows,
          type,
          timestamp: new Date().toISOString(),
          source: 'cache'
        });
      }
    }

    // 2. Fetch from external API
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

    // 3. Save whale transactions to cache
    if (isSupabaseConfigured && Array.isArray(data) && data.length > 0 && (type === 'eth-whales' || type === 'btc-whales')) {
      const transactions = data.map((tx: {
        hash?: string;
        txHash?: string;
        from?: string;
        to?: string;
        value?: number;
        valueUsd?: number;
        symbol?: string;
        timestamp?: string;
      }) => ({
        txHash: tx.hash || tx.txHash || '',
        blockchain: type === 'btc-whales' ? 'bitcoin' : 'ethereum',
        fromAddress: tx.from || '',
        fromLabel: '',
        toAddress: tx.to || '',
        toLabel: '',
        amount: tx.value || 0,
        amountUsd: tx.valueUsd || 0,
        symbol: tx.symbol || (type === 'btc-whales' ? 'BTC' : 'ETH'),
        txType: 'transfer',
        txTime: tx.timestamp || new Date().toISOString()
      }));
      await saveWhaleTransactionsToCache(transactions);
    }

    return NextResponse.json({
      data,
      type,
      timestamp: new Date().toISOString(),
      source: 'api',
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
