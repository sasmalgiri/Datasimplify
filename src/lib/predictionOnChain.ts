import type { OnChainData } from '@/lib/predictionEngine';
import { getRecentLargeEthTransactions } from '@/lib/whaleTracking';

const BLOCKCHAIN_INFO = 'https://blockchain.info';

type BlockchainChart = {
  values?: Array<{ x: number; y: number }>;
};

async function fetchBtcUniqueAddressesTrend(): Promise<OnChainData['activeAddresses'] | undefined> {
  // blockchain.info chart is public and doesn’t require keys.
  // We use 30 days and compare the last two points.
  const url = `${BLOCKCHAIN_INFO}/charts/n-unique-addresses?timespan=30days&format=json&sampled=true`;
  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) return undefined;

  const data = (await response.json()) as BlockchainChart;
  const values = data.values;
  if (!Array.isArray(values) || values.length < 2) return undefined;

  const last = values[values.length - 1]?.y;
  const prev = values[values.length - 2]?.y;
  if (typeof last !== 'number' || typeof prev !== 'number' || !Number.isFinite(last) || !Number.isFinite(prev)) {
    return undefined;
  }

  const diffPct = prev === 0 ? 0 : ((last - prev) / prev) * 100;
  if (diffPct > 1) return 'increasing';
  if (diffPct < -1) return 'decreasing';
  return 'stable';
}

async function fetchEthWhaleFlow(): Promise<Pick<OnChainData, 'exchangeNetflow' | 'whaleActivity'> | null> {
  // Etherscan key is optional; free tier is fine if provided.
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const txs = await getRecentLargeEthTransactions(100, apiKey);
  if (!Array.isArray(txs) || txs.length === 0) return null;

  const inflows = txs.filter(t => t.type === 'exchange_inflow').length;
  const outflows = txs.filter(t => t.type === 'exchange_outflow').length;

  if (inflows === 0 && outflows === 0) return null;

  let exchangeNetflow: OnChainData['exchangeNetflow'] = 'neutral';
  if (outflows > inflows) exchangeNetflow = 'outflow';
  else if (inflows > outflows) exchangeNetflow = 'inflow';

  // Heuristic, but based on real on-chain classifications:
  // outflow (to wallets) is more accumulation; inflow (to exchanges) is more distribution.
  let whaleActivity: OnChainData['whaleActivity'] = 'neutral';
  if (outflows > inflows) whaleActivity = 'buying';
  else if (inflows > outflows) whaleActivity = 'selling';

  return { exchangeNetflow, whaleActivity };
}

export async function fetchOnChainDataForPrediction(coinId: string): Promise<OnChainData | null> {
  const id = coinId.toLowerCase();

  if (id === 'bitcoin') {
    const activeAddresses = await fetchBtcUniqueAddressesTrend();
    if (!activeAddresses) return null;
    return { activeAddresses };
  }

  if (id === 'ethereum') {
    const flow = await fetchEthWhaleFlow();
    if (!flow) return null;
    return {
      exchangeNetflow: flow.exchangeNetflow,
      whaleActivity: flow.whaleActivity,
    };
  }

  return null;
}
