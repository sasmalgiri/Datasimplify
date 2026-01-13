import { NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  getWhaleDashboard,
  getRecentLargeEthTransactions,
  getBitcoinWhaleTransactions,
  getAllExchangeBalances,
  estimateExchangeFlows,
} from '@/lib/whaleTracking';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  getWhaleTransactionsFromCache,
  saveWhaleTransactionsToCache,
  getWhaleDataFreshness,
  getExchangeFlowsFromCache
} from '@/lib/supabaseData';
import { validationError, internalError, validateEnum, validatePositiveNumber } from '@/lib/apiErrors';

// Valid whale tracking types
const VALID_TYPES = ['dashboard', 'eth-whales', 'btc-whales', 'exchange-balances', 'exchange-flows'] as const;

export async function GET(request: Request) {
  if (!isFeatureEnabled('whales')) {
    return NextResponse.json(
      {
        error: 'Whale tracking is disabled.',
        reason: 'This data domain is not enabled for this deployment.',
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'dashboard';
  const minValueParam = searchParams.get('minValue');
  const apiKey = searchParams.get('apiKey');

  // Validate type parameter
  const typeError = validateEnum(type, VALID_TYPES, 'Type');
  if (typeError) {
    return validationError(typeError);
  }

  // Validate minValue parameter
  let minValue = 100; // default
  if (minValueParam) {
    const minValueError = validatePositiveNumber(minValueParam, 'Minimum value', 0.01, 1000000);
    if (minValueError) {
      return validationError(minValueError);
    }
    minValue = parseFloat(minValueParam);
  }

  try {
    // Whale tracking uses Etherscan + CoinGecko (USD price) for ETH-based views,
    // and Blockchair + CoinGecko (USD price) for BTC whale txs.
    const sources = type === 'btc-whales' ? ['blockchair', 'coingecko'] : ['etherscan', 'coingecko'];
    assertRedistributionAllowed(sources, { purpose: 'chart', route: '/api/whales' });

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
        // This case should not be reached due to validation above
        return validationError(`Invalid type. Use: ${VALID_TYPES.join(', ')}`);
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
      }) => {
        const txHash = tx.hash || tx.txHash || '';
        const amount = typeof tx.value === 'number' && Number.isFinite(tx.value) ? tx.value : null;
        const amountUsd = typeof tx.valueUsd === 'number' && Number.isFinite(tx.valueUsd) ? tx.valueUsd : null;

        if (!txHash || amount === null || amountUsd === null) return null;

        return {
          txHash,
          blockchain: type === 'btc-whales' ? 'bitcoin' : 'ethereum',
          fromAddress: tx.from || '',
          fromLabel: '',
          toAddress: tx.to || '',
          toLabel: '',
          amount,
          amountUsd,
          symbol: tx.symbol || (type === 'btc-whales' ? 'BTC' : 'ETH'),
          txType: 'transfer',
          txTime: tx.timestamp || new Date().toISOString()
        };
      }).filter(Boolean) as Array<{
        txHash: string;
        blockchain: 'bitcoin' | 'ethereum';
        fromAddress: string;
        fromLabel: string;
        toAddress: string;
        toLabel: string;
        amount: number;
        amountUsd: number;
        symbol: string;
        txType: string;
        txTime: string;
      }>;
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
    return internalError('Unable to fetch whale data. This may be due to rate limits on blockchain APIs. Please try again in a moment.');
  }
}
