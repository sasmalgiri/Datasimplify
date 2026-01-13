// ============================================
// WHALE TRACKING - Professional-grade whale monitoring
// ============================================
// How it works: Monitor blockchain for large transactions using FREE APIs

import { isFeatureEnabled } from '@/lib/featureFlags';

// FREE APIs for whale tracking
const WHALE_APIS = {
  // Whale Alert (has free tier)
  whaleAlert: 'https://api.whale-alert.io/v1',
  
  // Etherscan (free tier: 5 calls/sec)
  etherscan: 'https://api.etherscan.io/api',
  
  // BscScan (free tier)
  bscscan: 'https://api.bscscan.com/api',
  
  // Blockchain.com (free)
  blockchainInfo: 'https://blockchain.info',
  
  // Blockchair (free tier: 30 req/min)
  blockchair: 'https://api.blockchair.com',
};

// Known exchange wallets (public information)
// These are well-documented and publicly available
const KNOWN_EXCHANGE_WALLETS: Record<string, { name: string; type: 'exchange' | 'fund' | 'whale' }> = {
  // Binance Hot Wallets (ETH)
  '0x28c6c06298d514db089934071355e5743bf21d60': { name: 'Binance Hot Wallet 1', type: 'exchange' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { name: 'Binance Hot Wallet 2', type: 'exchange' },
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': { name: 'Binance Hot Wallet 3', type: 'exchange' },
  
  // Coinbase
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { name: 'Coinbase Hot Wallet', type: 'exchange' },
  '0xa090e606e30bd747d4e6245a1517ebe430f0057e': { name: 'Coinbase Cold Wallet', type: 'exchange' },
  
  // Kraken
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { name: 'Kraken Hot Wallet', type: 'exchange' },
  
  // OKX
  '0x98ec059dc3adfbdd63429454aeb0c990fba4a128': { name: 'OKX Hot Wallet', type: 'exchange' },
  
  // Bitfinex
  '0x1151314c646ce4e0efd76d1af4760ae66a9fe30f': { name: 'Bitfinex Hot Wallet', type: 'exchange' },
  
  // FTX (defunct but still tracked)
  '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2': { name: 'FTX Hot Wallet', type: 'exchange' },
  
  // Known whale wallets (from public blockchain analysis)
  '0x00000000219ab540356cbb839cbe05303d7705fa': { name: 'ETH 2.0 Deposit Contract', type: 'fund' },
};

// Types
export interface WhaleTransaction {
  hash: string;
  blockchain: string;
  from: string;
  fromLabel: string;
  to: string;
  toLabel: string;
  amount: number;
  amountUsd: number;
  symbol: string;
  timestamp: string;
  type: 'exchange_inflow' | 'exchange_outflow' | 'whale_transfer' | 'unknown';
}

export interface WalletBalance {
  address: string;
  label: string;
  balance: number;
  balanceUsd: number;
  lastActivity: string;
  transactionCount: number;
}

export interface ExchangeFlow {
  exchange: string;
  inflow24h: number;
  outflow24h: number;
  netFlow24h: number;
  inflowUsd24h: number;
  outflowUsd24h: number;
  netFlowUsd24h: number;
}

async function fetchUsdPrice(coinId: 'bitcoin' | 'ethereum'): Promise<number | null> {
  if (!isFeatureEnabled('whales')) return null;
  if (!isFeatureEnabled('coingecko')) return null;

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 60 } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const price = data?.[coinId]?.usd;
    return typeof price === 'number' && Number.isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

// ============================================
// METHOD 1: Using Etherscan FREE API
// ============================================

// Get large ETH transactions (FREE - 5 calls/sec)
export async function getRecentLargeEthTransactions(
  minValueEth: number = 100,
  apiKey?: string
): Promise<WhaleTransaction[]> {
  if (!isFeatureEnabled('whales')) {
    return [];
  }

  try {
    const ethUsd = await fetchUsdPrice('ethereum');
    if (ethUsd === null) {
      // Without a real price we can't truthfully compute USD values.
      return [];
    }

    // Get latest block number
    const blockResponse = await fetch(
      `${WHALE_APIS.etherscan}?module=proxy&action=eth_blockNumber${apiKey ? `&apikey=${apiKey}` : ''}`
    );
    const blockData = await blockResponse.json();
    const latestBlock = parseInt(blockData.result, 16);
    
    // Get transactions from recent blocks
    const transactions: WhaleTransaction[] = [];
    
    // Check last 10 blocks (about 2 minutes of data)
    for (let i = 0; i < 10; i++) {
      const blockNum = (latestBlock - i).toString(16);
      const response = await fetch(
        `${WHALE_APIS.etherscan}?module=proxy&action=eth_getBlockByNumber&tag=0x${blockNum}&boolean=true${apiKey ? `&apikey=${apiKey}` : ''}`
      );
      const data = await response.json();
      
      if (data.result && data.result.transactions) {
        for (const tx of data.result.transactions) {
          const valueEth = parseInt(tx.value, 16) / 1e18;
          
          if (valueEth >= minValueEth) {
            const fromLabel = KNOWN_EXCHANGE_WALLETS[tx.from.toLowerCase()]?.name || 'Unknown';
            const toLabel = KNOWN_EXCHANGE_WALLETS[tx.to?.toLowerCase()]?.name || 'Unknown';
            
            // Determine transaction type
            let type: WhaleTransaction['type'] = 'unknown';
            if (KNOWN_EXCHANGE_WALLETS[tx.to?.toLowerCase()]?.type === 'exchange') {
              type = 'exchange_inflow';
            } else if (KNOWN_EXCHANGE_WALLETS[tx.from.toLowerCase()]?.type === 'exchange') {
              type = 'exchange_outflow';
            } else if (valueEth >= 1000) {
              type = 'whale_transfer';
            }
            
            transactions.push({
              hash: tx.hash,
              blockchain: 'ethereum',
              from: tx.from,
              fromLabel,
              to: tx.to || 'Contract Creation',
              toLabel,
              amount: valueEth,
              amountUsd: valueEth * ethUsd,
              symbol: 'ETH',
              timestamp: new Date(parseInt(data.result.timestamp, 16) * 1000).toISOString(),
              type,
            });
          }
        }
      }
      
      // Rate limit protection
      await new Promise(r => setTimeout(r, 200));
    }
    
    return transactions.sort((a, b) => b.amount - a.amount);
  } catch (error) {
    console.error('Error fetching whale transactions:', error);
    return [];
  }
}

// ============================================
// METHOD 2: Using Blockchair FREE API
// ============================================

// Get Bitcoin whale transactions (FREE - 30 req/min)
export async function getBitcoinWhaleTransactions(
  minValueBtc: number = 100
): Promise<WhaleTransaction[]> {
  if (!isFeatureEnabled('whales')) {
    return [];
  }

  try {
    const btcUsd = await fetchUsdPrice('bitcoin');
    if (btcUsd === null) {
      // Without a real price we can't truthfully compute USD values.
      return [];
    }

    const response = await fetch(
      `${WHALE_APIS.blockchair}/bitcoin/transactions?q=output_total(${minValueBtc * 1e8}...)&s=time(desc)&limit=20`
    );
    const data = await response.json();
    
    if (!data.data) return [];
    
    return data.data.map((tx: Record<string, unknown>) => ({
      hash: tx.hash as string,
      blockchain: 'bitcoin',
      from: 'Multiple Inputs',
      fromLabel: 'Unknown',
      to: 'Multiple Outputs',
      toLabel: 'Unknown',
      amount: (tx.output_total as number) / 1e8,
      amountUsd: ((tx.output_total as number) / 1e8) * btcUsd,
      symbol: 'BTC',
      timestamp: tx.time as string,
      type: 'whale_transfer' as const,
    }));
  } catch (error) {
    console.error('Error fetching BTC whale txs:', error);
    return [];
  }
}

// ============================================
// METHOD 3: Track Exchange Wallet Balances
// ============================================

// Get exchange wallet balance (FREE via Etherscan)
export async function getExchangeWalletBalance(
  walletAddress: string,
  apiKey?: string
): Promise<WalletBalance | null> {
  if (!isFeatureEnabled('whales')) {
    return null;
  }

  try {
    const ethUsd = await fetchUsdPrice('ethereum');
    if (ethUsd === null) return null;

    const response = await fetch(
      `${WHALE_APIS.etherscan}?module=account&action=balance&address=${walletAddress}&tag=latest${apiKey ? `&apikey=${apiKey}` : ''}`
    );
    const data = await response.json();
    
    if (data.status !== '1') return null;
    
    const balanceEth = parseInt(data.result) / 1e18;
    const label = KNOWN_EXCHANGE_WALLETS[walletAddress.toLowerCase()]?.name || 'Unknown';
    
    return {
      address: walletAddress,
      label,
      balance: balanceEth,
      balanceUsd: balanceEth * ethUsd,
      lastActivity: new Date().toISOString(),
      transactionCount: 0, // Would need separate API call
    };
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return null;
  }
}

// Get all exchange balances
export async function getAllExchangeBalances(apiKey?: string): Promise<WalletBalance[]> {
  if (!isFeatureEnabled('whales')) {
    return [];
  }

  const balances: WalletBalance[] = [];
  
  for (const [address, info] of Object.entries(KNOWN_EXCHANGE_WALLETS)) {
    if (info.type === 'exchange') {
      const balance = await getExchangeWalletBalance(address, apiKey);
      if (balance) {
        balances.push(balance);
      }
      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  return balances.sort((a, b) => b.balance - a.balance);
}

// ============================================
// METHOD 4: Calculate Exchange Flows
// ============================================

// This would need historical data stored in Supabase to calculate properly
// For now, we can estimate from recent transactions

export async function estimateExchangeFlows(): Promise<ExchangeFlow[]> {
  if (!isFeatureEnabled('whales')) {
    return [];
  }

  const transactions = await getRecentLargeEthTransactions(10);
  
  const flows: Record<string, ExchangeFlow> = {};
  
  for (const tx of transactions) {
    if (tx.type === 'exchange_inflow') {
      const exchange = tx.toLabel;
      if (!flows[exchange]) {
        flows[exchange] = {
          exchange,
          inflow24h: 0,
          outflow24h: 0,
          netFlow24h: 0,
          inflowUsd24h: 0,
          outflowUsd24h: 0,
          netFlowUsd24h: 0,
        };
      }
      flows[exchange].inflow24h += tx.amount;
      flows[exchange].inflowUsd24h += tx.amountUsd;
    } else if (tx.type === 'exchange_outflow') {
      const exchange = tx.fromLabel;
      if (!flows[exchange]) {
        flows[exchange] = {
          exchange,
          inflow24h: 0,
          outflow24h: 0,
          netFlow24h: 0,
          inflowUsd24h: 0,
          outflowUsd24h: 0,
          netFlowUsd24h: 0,
        };
      }
      flows[exchange].outflow24h += tx.amount;
      flows[exchange].outflowUsd24h += tx.amountUsd;
    }
  }
  
  // Calculate net flows
  return Object.values(flows).map(f => ({
    ...f,
    netFlow24h: f.inflow24h - f.outflow24h,
    netFlowUsd24h: f.inflowUsd24h - f.outflowUsd24h,
  }));
}

// ============================================
// AGGREGATED WHALE DASHBOARD
// ============================================

export async function getWhaleDashboard(etherscanApiKey?: string): Promise<{
  recentWhaleTransactions: WhaleTransaction[];
  exchangeBalances: WalletBalance[];
  exchangeFlows: ExchangeFlow[];
  summary: {
    totalWhaleVolume24h: number;
    largestTransaction: WhaleTransaction | null;
    netExchangeFlow: number;
  };
}> {
  if (!isFeatureEnabled('whales')) {
    return {
      recentWhaleTransactions: [],
      exchangeBalances: [],
      exchangeFlows: [],
      summary: {
        totalWhaleVolume24h: 0,
        largestTransaction: null,
        netExchangeFlow: 0,
      },
    };
  }

  const [ethTransactions, btcTransactions, exchangeBalances] = await Promise.all([
    getRecentLargeEthTransactions(100, etherscanApiKey),
    getBitcoinWhaleTransactions(100),
    getAllExchangeBalances(etherscanApiKey),
  ]);
  
  const allTransactions = [...ethTransactions, ...btcTransactions]
    .sort((a, b) => b.amountUsd - a.amountUsd);
  
  const exchangeFlows = await estimateExchangeFlows();
  
  return {
    recentWhaleTransactions: allTransactions.slice(0, 50),
    exchangeBalances,
    exchangeFlows,
    summary: {
      totalWhaleVolume24h: allTransactions.reduce((sum, tx) => sum + tx.amountUsd, 0),
      largestTransaction: allTransactions[0] || null,
      netExchangeFlow: exchangeFlows.reduce((sum, f) => sum + f.netFlowUsd24h, 0),
    },
  };
}
