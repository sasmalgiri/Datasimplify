// ============================================
// ON-CHAIN DATA FETCHER - Professional-grade blockchain analytics
// ============================================
// Uses FREE public RPC nodes to get blockchain data

import { isFeatureEnabled } from '@/lib/featureFlags';

// FREE RPC Endpoints (no API key needed)
const RPC_ENDPOINTS = {
  ethereum: [
    'https://eth.public-rpc.com',
    'https://rpc.ankr.com/eth',
    'https://ethereum.publicnode.com',
  ],
  bitcoin: [
    'https://bitcoin.drpc.org',
    'https://rpc.ankr.com/btc',
  ],
  bsc: [
    'https://bsc-dataseed.binance.org',
    'https://rpc.ankr.com/bsc',
  ],
  polygon: [
    'https://polygon-rpc.com',
    'https://rpc.ankr.com/polygon',
  ],
  arbitrum: [
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum',
  ],
  solana: [
    'https://api.mainnet-beta.solana.com',
  ],
};

// FREE APIs for additional on-chain data
const FREE_ONCHAIN_APIS = {
  // DeFi TVL - FREE
  defiLlama: 'https://api.llama.fi',
  // Fear & Greed Index - FREE
  fearGreed: 'https://api.alternative.me/fng/',
  // Bitcoin specific - FREE
  blockchainInfo: 'https://blockchain.info',
  // Ethereum gas - FREE
  ethGas: 'https://api.etherscan.io/api', // Free tier available
};

// ============================================
// TYPES
// ============================================

export interface OnChainMetrics {
  // Network Activity
  activeAddresses24h: number;
  transactionCount24h: number;
  avgTransactionValue: number;
  
  // Supply Metrics
  circulatingSupply: number;
  totalSupply: number;
  
  // Exchange Metrics (estimated)
  exchangeInflow24h: number;
  exchangeOutflow24h: number;
  exchangeNetFlow24h: number;
  
  // Gas/Fees
  avgGasPrice: number;
  avgTransactionFee: number;
  
  // DeFi (from DefiLlama)
  totalTVL: number;
  tvlChange24h: number;
  
  // Sentiment
  fearGreedIndex: number;
  fearGreedLabel: string;
  
  timestamp: string;
}

export interface DeFiProtocol {
  name: string;
  chain: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  category: string;
  symbol: string;
}

export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  valueUsd: number;
  timestamp: string;
  type: 'inflow' | 'outflow' | 'transfer';
}

// ============================================
// FREE ON-CHAIN DATA FETCHERS
// ============================================

// 1. Fear & Greed Index (FREE - updates daily)
export async function fetchFearGreedIndex(): Promise<{
  value: number | null;
  label: string;
  timestamp: string;
  error?: string;
}> {
  try {
    const response = await fetch(FREE_ONCHAIN_APIS.fearGreed, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`Fear & Greed API returned ${response.status}`);
      return { value: null, label: 'Unavailable', timestamp: new Date().toISOString(), error: `API returned ${response.status}` };
    }

    const data = await response.json();

    if (!data.data || !data.data[0]) {
      console.error('Fear & Greed API returned invalid data:', data);
      return { value: null, label: 'Unavailable', timestamp: new Date().toISOString(), error: 'Invalid API response' };
    }

    const parsedValue = Number.parseInt(data.data[0].value);
    if (!Number.isFinite(parsedValue)) {
      console.error('Fear & Greed API returned non-numeric value:', data.data?.[0]?.value);
      return { value: null, label: 'Unavailable', timestamp: new Date().toISOString(), error: 'Non-numeric API value' };
    }

    return {
      value: parsedValue,
      label: data.data[0].value_classification,
      timestamp: new Date(parseInt(data.data[0].timestamp) * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error fetching fear & greed:', error);
    return { value: null, label: 'Unavailable', timestamp: new Date().toISOString(), error: String(error) };
  }
}

// 2. DeFi TVL from DefiLlama (FREE - comprehensive)
export async function fetchDeFiTVL(): Promise<{
  totalTVL: number;
  chains: { name: string; tvl: number }[];
  error?: string;
}> {
  try {
    const response = await fetch(`${FREE_ONCHAIN_APIS.defiLlama}/v2/chains`, {
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      console.error(`DeFiLlama chains API returned ${response.status}`);
      return { totalTVL: 0, chains: [], error: `API returned ${response.status}` };
    }

    const chains = await response.json();

    if (!Array.isArray(chains)) {
      console.error('DeFiLlama returned invalid chains data');
      return { totalTVL: 0, chains: [], error: 'Invalid API response' };
    }

    const totalTVL = chains.reduce((sum: number, c: { tvl: number }) => sum + (c.tvl || 0), 0);

    return {
      totalTVL,
      chains: chains
        .sort((a: { tvl: number }, b: { tvl: number }) => b.tvl - a.tvl)
        .slice(0, 20)
        .map((c: { name: string; tvl: number }) => ({
          name: c.name,
          tvl: c.tvl,
        })),
    };
  } catch (error) {
    console.error('Error fetching DeFi TVL:', error);
    return { totalTVL: 0, chains: [], error: String(error) };
  }
}

// 3. Top DeFi Protocols (FREE)
export async function fetchTopDeFiProtocols(limit: number = 50): Promise<DeFiProtocol[]> {
  try {
    const response = await fetch(`${FREE_ONCHAIN_APIS.defiLlama}/protocols`);
    const protocols = await response.json();
    
    return protocols
      .sort((a: { tvl: number }, b: { tvl: number }) => b.tvl - a.tvl)
      .slice(0, limit)
      .map((p: Record<string, unknown>) => ({
        name: p.name as string,
        chain: p.chain as string || 'Multi-chain',
        tvl: p.tvl as number,
        tvlChange24h: p.change_1d as number || 0,
        tvlChange7d: p.change_7d as number || 0,
        category: p.category as string || 'Unknown',
        symbol: p.symbol as string || '',
      }));
  } catch (error) {
    console.error('Error fetching DeFi protocols:', error);
    return [];
  }
}

// 4. Stablecoin Market Cap (FREE)
export async function fetchStablecoinData(): Promise<{
  totalMarketCap: number;
  stablecoins: { name: string; symbol: string; marketCap: number; chain: string }[];
}> {
  try {
    const response = await fetch(`${FREE_ONCHAIN_APIS.defiLlama}/stablecoins`);
    const data = await response.json();
    
    const stablecoins = data.peggedAssets
      .sort((a: { circulating: { peggedUSD: number } }, b: { circulating: { peggedUSD: number } }) => 
        (b.circulating?.peggedUSD || 0) - (a.circulating?.peggedUSD || 0)
      )
      .slice(0, 20)
      .map((s: Record<string, unknown>) => ({
        name: s.name as string,
        symbol: s.symbol as string,
        marketCap: (s.circulating as { peggedUSD: number })?.peggedUSD || 0,
        chain: (s.chains as string[])?.[0] || 'Multi-chain',
      }));
    
    const totalMarketCap = stablecoins.reduce((sum: number, s: { marketCap: number }) => sum + s.marketCap, 0);
    
    return { totalMarketCap, stablecoins };
  } catch (error) {
    console.error('Error fetching stablecoin data:', error);
    return { totalMarketCap: 0, stablecoins: [] };
  }
}

// 5. Yield/APY Data (FREE)
export async function fetchYieldData(limit: number = 50): Promise<{
  pools: {
    protocol: string;
    chain: string;
    symbol: string;
    tvl: number;
    apy: number;
    apyBase: number | null;
    apyReward: number | null;
  }[];
}> {
  try {
    const response = await fetch(`${FREE_ONCHAIN_APIS.defiLlama}/pools`);
    const data = await response.json();
    
    const pools = data.data
      .filter((p: { tvlUsd: number; apy: number }) => p.tvlUsd > 1000000 && p.apy > 0) // Min $1M TVL
      .sort((a: { apy: number }, b: { apy: number }) => b.apy - a.apy)
      .slice(0, limit)
      .map((p: Record<string, unknown>) => ({
        protocol: p.project as string,
        chain: p.chain as string,
        symbol: p.symbol as string,
        tvl: p.tvlUsd as number,
        apy: p.apy as number,
        apyBase: typeof p.apyBase === 'number' && Number.isFinite(p.apyBase) ? (p.apyBase as number) : null,
        apyReward: typeof p.apyReward === 'number' && Number.isFinite(p.apyReward) ? (p.apyReward as number) : null,
      }));
    
    return { pools };
  } catch (error) {
    console.error('Error fetching yield data:', error);
    return { pools: [] };
  }
}

// 6. Bitcoin Blockchain Stats (FREE from blockchain.info)
export async function fetchBitcoinStats(): Promise<{
  hashRate: number | null;
  difficulty: number | null;
  blockHeight: number | null;
  avgBlockTime: number | null;
  unconfirmedTxs: number | null;
  memPoolSize: number | null;
  error?: string;
}> {
  try {
    const response = await fetch(`${FREE_ONCHAIN_APIS.blockchainInfo}/stats?format=json`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`Blockchain.info API returned ${response.status}`);
      return {
        hashRate: null,
        difficulty: null,
        blockHeight: null,
        avgBlockTime: null,
        unconfirmedTxs: null,
        memPoolSize: null,
        error: `API returned ${response.status}`
      };
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      console.error('Blockchain.info returned invalid data');
      return {
        hashRate: null,
        difficulty: null,
        blockHeight: null,
        avgBlockTime: null,
        unconfirmedTxs: null,
        memPoolSize: null,
        error: 'Invalid API response'
      };
    }

    const hashRate = (data as any).hash_rate;
    const difficulty = (data as any).difficulty;
    const blockHeight = (data as any).n_blocks_total;
    const avgBlockTime = (data as any).minutes_between_blocks;
    const unconfirmedTxs = (data as any).n_tx_unconfirmed;
    const memPoolSize = (data as any).mempool_size;

    return {
      hashRate: typeof hashRate === 'number' && Number.isFinite(hashRate) ? hashRate : null,
      difficulty: typeof difficulty === 'number' && Number.isFinite(difficulty) ? difficulty : null,
      blockHeight: typeof blockHeight === 'number' && Number.isFinite(blockHeight) ? blockHeight : null,
      avgBlockTime: typeof avgBlockTime === 'number' && Number.isFinite(avgBlockTime) ? avgBlockTime : null,
      unconfirmedTxs: typeof unconfirmedTxs === 'number' && Number.isFinite(unconfirmedTxs) ? unconfirmedTxs : null,
      memPoolSize: typeof memPoolSize === 'number' && Number.isFinite(memPoolSize) ? memPoolSize : null,
    };
  } catch (error) {
    console.error('Error fetching Bitcoin stats:', error);
    return {
      hashRate: null,
      difficulty: null,
      blockHeight: null,
      avgBlockTime: null,
      unconfirmedTxs: null,
      memPoolSize: null,
      error: String(error)
    };
  }
}

// 7. Ethereum Gas Prices (FREE)
export async function fetchEthGasPrices(): Promise<{
  slow: number | null;
  standard: number | null;
  fast: number | null;
  baseFee: number | null;
  error?: string;
}> {
  try {
    if (!isFeatureEnabled('publicRpc')) {
      return { slow: null, standard: null, fast: null, baseFee: null, error: 'Public RPC is disabled.' };
    }

    // Use public RPC to get gas price
    const response = await fetch(RPC_ENDPOINTS.ethereum[0], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1,
      }),
    });
    
    if (!response.ok) {
      return { slow: null, standard: null, fast: null, baseFee: null, error: `RPC returned ${response.status}` };
    }

    const data = await response.json();
    const parsed = typeof data?.result === 'string' ? Number.parseInt(data.result, 16) : NaN;
    const gasPrice = Number.isFinite(parsed) ? parsed / 1e9 : NaN; // Convert to Gwei

    if (!Number.isFinite(gasPrice)) {
      return { slow: null, standard: null, fast: null, baseFee: null, error: 'Invalid RPC response' };
    }
    
    return {
      slow: gasPrice * 0.8,
      standard: gasPrice,
      fast: gasPrice * 1.2,
      baseFee: gasPrice,
    };
  } catch (error) {
    console.error('Error fetching gas prices:', error);
    return { slow: null, standard: null, fast: null, baseFee: null, error: String(error) };
  }
}

// 8. Get Latest Ethereum Block (FREE via RPC)
export async function fetchLatestEthBlock(): Promise<{
  blockNumber: number | null;
  timestamp: string | null;
  transactionCount: number | null;
  gasUsed: number | null;
  gasLimit: number | null;
  error?: string;
}> {
  try {
    if (!isFeatureEnabled('publicRpc')) {
      return {
        blockNumber: null,
        timestamp: null,
        transactionCount: null,
        gasUsed: null,
        gasLimit: null,
        error: 'Public RPC is disabled.',
      };
    }

    const response = await fetch(RPC_ENDPOINTS.ethereum[0], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
        id: 1,
      }),
    });
    
    if (!response.ok) {
      return {
        blockNumber: null,
        timestamp: null,
        transactionCount: null,
        gasUsed: null,
        gasLimit: null,
        error: `RPC returned ${response.status}`,
      };
    }

    const data = await response.json();
    const block = data.result;
    
    return {
      blockNumber: parseInt(block.number, 16),
      timestamp: new Date(parseInt(block.timestamp, 16) * 1000).toISOString(),
      transactionCount: block.transactions?.length || 0,
      gasUsed: parseInt(block.gasUsed, 16),
      gasLimit: parseInt(block.gasLimit, 16),
    };
  } catch (error) {
    console.error('Error fetching ETH block:', error);
    return {
      blockNumber: null,
      timestamp: null,
      transactionCount: null,
      gasUsed: null,
      gasLimit: null,
      error: String(error),
    };
  }
}

// ============================================
// AGGREGATED ON-CHAIN DASHBOARD
// ============================================

export async function fetchOnChainDashboard(): Promise<{
  fearGreed: { value: number | null; label: string };
  defi: { totalTVL: number | null; topChains: { name: string; tvl: number }[] };
  stablecoins: { totalMarketCap: number | null; top5: { name: string; marketCap: number }[] };
  bitcoin: { hashRate: number | null; difficulty: number | null; blockHeight: number | null };
  ethereum: { gasPrice: number | null; blockNumber: number | null };
  timestamp: string;
}> {
  const [fearGreed, defi, stablecoins, bitcoin, ethGas, ethBlock] = await Promise.all([
    fetchFearGreedIndex(),
    fetchDeFiTVL(),
    fetchStablecoinData(),
    fetchBitcoinStats(),
    fetchEthGasPrices(),
    fetchLatestEthBlock(),
  ]);
  
  return {
    fearGreed: { value: fearGreed.value, label: fearGreed.label },
    defi: { 
      totalTVL: typeof defi?.totalTVL === 'number' && Number.isFinite(defi.totalTVL) ? defi.totalTVL : null,
      topChains: defi.chains.slice(0, 10) 
    },
    stablecoins: { 
      totalMarketCap: typeof stablecoins?.totalMarketCap === 'number' && Number.isFinite(stablecoins.totalMarketCap) ? stablecoins.totalMarketCap : null,
      top5: stablecoins.stablecoins.slice(0, 5) 
    },
    bitcoin: {
      hashRate: bitcoin.hashRate,
      difficulty: bitcoin.difficulty,
      blockHeight: bitcoin.blockHeight,
    },
    ethereum: {
      gasPrice: ethGas.standard,
      blockNumber: ethBlock.blockNumber,
    },
    timestamp: new Date().toISOString(),
  };
}
