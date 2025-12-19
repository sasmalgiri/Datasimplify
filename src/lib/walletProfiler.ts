/**
 * Wallet Profiler
 * Track and analyze significant impact wallets (whales, exchanges, funds)
 */

import { supabaseAdmin, isSupabaseConfigured } from './supabase';

// ============================================
// TYPES
// ============================================

export type WalletType = 'whale' | 'exchange' | 'fund' | 'miner' | 'protocol' | 'smart_money' | 'unknown';
export type EntityCategory = 'exchange' | 'institutional' | 'defi_protocol' | 'cex_whale' | 'retail_whale';
export type TradeFrequency = 'high' | 'medium' | 'low';
export type SignalReliability = 'high' | 'medium' | 'low' | 'unknown';

export interface WalletProfile {
  id: string;
  address: string;
  blockchain: string;

  // Classification
  walletType: WalletType;
  label?: string;
  knownEntity?: string;
  entityCategory?: EntityCategory;

  // Impact Metrics
  impactScore: number;
  historicalAccuracy: number;
  totalVolume30d: number;
  avgTradeSize: number;
  profitLossRatio?: number;

  // Activity Profile
  tradeFrequency: TradeFrequency;
  avgHoldDuration?: string;
  preferredCoins?: string[];
  lastActivity?: Date;
  transactionCount: number;
  isActive: boolean;

  // Signal Quality
  signalReliability: SignalReliability;
  contrarianIndicator: boolean;

  // Metadata
  firstSeen: Date;
  updatedAt: Date;
  notes?: string;
}

export interface WalletTransaction {
  id: string;
  timestamp: Date;
  walletId: string;

  txHash: string;
  blockchain: string;
  direction: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';

  amount: number;
  amountUsd: number;
  coinSymbol: string;
  coinId?: string;

  // Context at time of transaction
  priceAtTx: number;
  marketCapAtTx?: number;
  fearGreedAtTx?: number;

  // Outcome tracking
  price1hAfter?: number;
  price24hAfter?: number;
  price7dAfter?: number;
  direction24h?: string;
  wasProfitable?: boolean;
  profitPct?: number;
  impactOnPrice?: number;

  // Metadata
  fromAddress?: string;
  toAddress?: string;
  isExchangeRelated: boolean;
  exchangeName?: string;
}

export interface WalletSignals {
  buyVolume: number;
  sellVolume: number;
  netFlow: number;
  whaleSentiment: 'bullish' | 'bearish' | 'neutral';
  topWalletsBuying: number;
  topWalletsSelling: number;
  smartMoneyDirection?: 'accumulating' | 'distributing' | 'neutral';
  confidenceLevel: number;
}

// Known Exchange Wallets - Pre-seeded from migration
const KNOWN_EXCHANGE_WALLETS: Record<string, { name: string; type: WalletType }> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': { name: 'Binance Hot Wallet 1', type: 'exchange' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { name: 'Binance Hot Wallet 2', type: 'exchange' },
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': { name: 'Binance Hot Wallet 3', type: 'exchange' },
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { name: 'Coinbase Hot Wallet', type: 'exchange' },
  '0xa090e606e30bd747d4e6245a1517ebe430f0057e': { name: 'Coinbase Cold Wallet', type: 'exchange' },
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { name: 'Kraken Hot Wallet', type: 'exchange' },
  '0x98ec059dc3adfbdd63429454aeb0c990fba4a128': { name: 'OKX Hot Wallet', type: 'exchange' },
  '0x1151314c646ce4e0efd76d1af4760ae66a9fe30f': { name: 'Bitfinex Hot Wallet', type: 'exchange' },
  '0x00000000219ab540356cbb839cbe05303d7705fa': { name: 'ETH 2.0 Deposit Contract', type: 'protocol' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function checkSupabase() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error('Supabase not configured for wallet profiling');
  }
  return supabaseAdmin;
}

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * Classify a wallet address
 */
export function classifyWallet(address: string): { type: WalletType; label?: string; knownEntity?: string } {
  const lowerAddress = address.toLowerCase();

  // Check known wallets
  if (KNOWN_EXCHANGE_WALLETS[lowerAddress]) {
    return {
      type: KNOWN_EXCHANGE_WALLETS[lowerAddress].type,
      label: KNOWN_EXCHANGE_WALLETS[lowerAddress].name,
      knownEntity: KNOWN_EXCHANGE_WALLETS[lowerAddress].name.split(' ')[0],
    };
  }

  // Default to unknown whale if not recognized
  return { type: 'unknown' };
}

// ============================================
// WALLET PROFILE OPERATIONS
// ============================================

/**
 * Create or update a wallet profile
 */
export async function createWalletProfile(
  address: string,
  blockchain: string,
  data?: Partial<WalletProfile>
): Promise<WalletProfile | null> {
  const db = checkSupabase();

  const classification = classifyWallet(address);

  const record = {
    address: address.toLowerCase(),
    blockchain,
    wallet_type: data?.walletType || classification.type,
    label: data?.label || classification.label,
    known_entity: data?.knownEntity || classification.knownEntity,
    entity_category: data?.entityCategory,
    impact_score: data?.impactScore || 0,
    historical_accuracy: data?.historicalAccuracy || 50,
    total_volume_30d: data?.totalVolume30d || 0,
    avg_trade_size: data?.avgTradeSize || 0,
    trade_frequency: data?.tradeFrequency || 'low',
    transaction_count: data?.transactionCount || 0,
    is_active: data?.isActive ?? true,
    signal_reliability: data?.signalReliability || 'unknown',
    contrarian_indicator: data?.contrarianIndicator || false,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data: result, error } = await db
      .from('wallet_profiles')
      .upsert(record, { onConflict: 'address,blockchain' })
      .select()
      .single();

    if (error) {
      console.error('Error creating wallet profile:', error);
      return null;
    }

    return snakeToCamel(result) as unknown as WalletProfile;
  } catch (error) {
    console.error('Exception creating wallet profile:', error);
    return null;
  }
}

/**
 * Get wallet profile by address
 */
export async function getWalletProfile(
  address: string,
  blockchain?: string
): Promise<WalletProfile | null> {
  const db = checkSupabase();

  let query = db
    .from('wallet_profiles')
    .select('*')
    .eq('address', address.toLowerCase());

  if (blockchain) {
    query = query.eq('blockchain', blockchain);
  }

  const { data, error } = await query.limit(1).single();

  if (error || !data) {
    return null;
  }

  return snakeToCamel(data) as unknown as WalletProfile;
}

/**
 * Get high impact wallets
 */
export async function getHighImpactWallets(options?: {
  minImpactScore?: number;
  walletType?: WalletType;
  blockchain?: string;
  limit?: number;
  onlyActive?: boolean;
}): Promise<WalletProfile[]> {
  const db = checkSupabase();

  let query = db
    .from('wallet_profiles')
    .select('*')
    .order('impact_score', { ascending: false });

  if (options?.minImpactScore) {
    query = query.gte('impact_score', options.minImpactScore);
  }

  if (options?.walletType) {
    query = query.eq('wallet_type', options.walletType);
  }

  if (options?.blockchain) {
    query = query.eq('blockchain', options.blockchain);
  }

  if (options?.onlyActive !== false) {
    query = query.eq('is_active', true);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(row => snakeToCamel(row) as unknown as WalletProfile);
}

/**
 * Update wallet metrics based on recent transactions
 */
export async function updateWalletMetrics(address: string, blockchain?: string): Promise<boolean> {
  const db = checkSupabase();

  // Get wallet profile
  const profile = await getWalletProfile(address, blockchain);
  if (!profile) {
    return false;
  }

  // Get recent transactions (30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: transactions, error: txError } = await db
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', profile.id)
    .gte('timestamp', thirtyDaysAgo.toISOString());

  if (txError || !transactions || transactions.length === 0) {
    return false;
  }

  // Calculate metrics
  const totalVolume = transactions.reduce((sum, tx) => sum + (tx.amount_usd || 0), 0);
  const avgTradeSize = totalVolume / transactions.length;

  // Calculate accuracy (for transactions with outcome data)
  const txWithOutcome = transactions.filter(tx => tx.was_profitable !== null);
  const accuracy = txWithOutcome.length > 0
    ? (txWithOutcome.filter(tx => tx.was_profitable).length / txWithOutcome.length) * 100
    : 50;

  // Determine trade frequency
  const txPerDay = transactions.length / 30;
  let tradeFrequency: TradeFrequency = 'low';
  if (txPerDay >= 5) tradeFrequency = 'high';
  else if (txPerDay >= 1) tradeFrequency = 'medium';

  // Calculate impact score
  const impactScore = calculateImpactScore(accuracy, totalVolume, transactions.length);

  // Determine signal reliability
  let signalReliability: SignalReliability = 'unknown';
  if (txWithOutcome.length >= 20) {
    if (accuracy >= 60) signalReliability = 'high';
    else if (accuracy >= 50) signalReliability = 'medium';
    else signalReliability = 'low';
  }

  // Update profile
  const { error: updateError } = await db
    .from('wallet_profiles')
    .update({
      impact_score: impactScore,
      historical_accuracy: accuracy,
      total_volume_30d: totalVolume,
      avg_trade_size: avgTradeSize,
      trade_frequency: tradeFrequency,
      transaction_count: (profile.transactionCount || 0) + transactions.length,
      signal_reliability: signalReliability,
      contrarian_indicator: accuracy < 40 && txWithOutcome.length >= 10,
      last_activity: transactions[0]?.timestamp,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  return !updateError;
}

/**
 * Calculate wallet impact score
 */
function calculateImpactScore(
  accuracy: number,
  volume: number,
  tradeCount: number
): number {
  // Impact = accuracy * log(volume) * sqrt(trade_count)
  // Normalized to 0-100
  const volumeScore = Math.log10(Math.max(volume, 1)) / 10; // 0-1 scale for volumes up to $10B
  const countScore = Math.sqrt(tradeCount) / 10; // Diminishing returns for trade count
  const accuracyScore = accuracy / 100;

  const rawScore = accuracyScore * volumeScore * countScore * 100;
  return Math.min(100, Math.max(0, Math.round(rawScore)));
}

// ============================================
// TRANSACTION TRACKING
// ============================================

/**
 * Track a new wallet transaction
 */
export async function trackWalletTransaction(tx: {
  walletAddress: string;
  blockchain: string;
  txHash: string;
  direction: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  amount: number;
  amountUsd: number;
  coinSymbol: string;
  coinId?: string;
  priceAtTx: number;
  marketCapAtTx?: number;
  fearGreedAtTx?: number;
  fromAddress?: string;
  toAddress?: string;
}): Promise<{ id: string } | null> {
  const db = checkSupabase();

  // Get or create wallet profile
  let profile = await getWalletProfile(tx.walletAddress, tx.blockchain);
  if (!profile) {
    profile = await createWalletProfile(tx.walletAddress, tx.blockchain);
    if (!profile) {
      console.error('Failed to create wallet profile for transaction');
      return null;
    }
  }

  // Determine if exchange-related
  const isExchangeRelated =
    profile.walletType === 'exchange' ||
    (tx.toAddress && classifyWallet(tx.toAddress).type === 'exchange') ||
    (tx.fromAddress && classifyWallet(tx.fromAddress).type === 'exchange');

  let exchangeName: string | undefined;
  if (tx.toAddress && KNOWN_EXCHANGE_WALLETS[tx.toAddress.toLowerCase()]) {
    exchangeName = KNOWN_EXCHANGE_WALLETS[tx.toAddress.toLowerCase()].name.split(' ')[0];
  } else if (tx.fromAddress && KNOWN_EXCHANGE_WALLETS[tx.fromAddress.toLowerCase()]) {
    exchangeName = KNOWN_EXCHANGE_WALLETS[tx.fromAddress.toLowerCase()].name.split(' ')[0];
  }

  const record = {
    wallet_id: profile.id,
    tx_hash: tx.txHash,
    blockchain: tx.blockchain,
    direction: tx.direction,
    amount: tx.amount,
    amount_usd: tx.amountUsd,
    coin_symbol: tx.coinSymbol,
    coin_id: tx.coinId,
    price_at_tx: tx.priceAtTx,
    market_cap_at_tx: tx.marketCapAtTx,
    fear_greed_at_tx: tx.fearGreedAtTx,
    from_address: tx.fromAddress,
    to_address: tx.toAddress,
    is_exchange_related: isExchangeRelated,
    exchange_name: exchangeName,
    timestamp: new Date().toISOString(),
  };

  try {
    const { data: result, error } = await db
      .from('wallet_transactions')
      .upsert(record, { onConflict: 'tx_hash,wallet_id' })
      .select('id')
      .single();

    if (error) {
      console.error('Error tracking wallet transaction:', error);
      return null;
    }

    // Update wallet's last activity
    await db
      .from('wallet_profiles')
      .update({
        last_activity: new Date().toISOString(),
        transaction_count: (profile.transactionCount || 0) + 1,
      })
      .eq('id', profile.id);

    return { id: result.id };
  } catch (error) {
    console.error('Exception tracking wallet transaction:', error);
    return null;
  }
}

/**
 * Get recent transactions for a wallet
 */
export async function getWalletTransactions(
  walletAddress: string,
  options?: {
    blockchain?: string;
    coinSymbol?: string;
    limit?: number;
    startDate?: Date;
  }
): Promise<WalletTransaction[]> {
  const db = checkSupabase();

  const profile = await getWalletProfile(walletAddress, options?.blockchain);
  if (!profile) {
    return [];
  }

  let query = db
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', profile.id)
    .order('timestamp', { ascending: false });

  if (options?.coinSymbol) {
    query = query.eq('coin_symbol', options.coinSymbol);
  }

  if (options?.startDate) {
    query = query.gte('timestamp', options.startDate.toISOString());
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(row => snakeToCamel(row) as unknown as WalletTransaction);
}

// ============================================
// AGGREGATED SIGNALS
// ============================================

/**
 * Get aggregated wallet signals for a coin
 */
export async function getWalletSignals(
  coinSymbol: string,
  hours: number = 24
): Promise<WalletSignals> {
  const db = checkSupabase();

  const since = new Date();
  since.setHours(since.getHours() - hours);

  // Get transactions from high-impact wallets
  const { data: transactions, error } = await db
    .from('wallet_transactions')
    .select(`
      direction,
      amount_usd,
      wallet_profiles!inner (
        impact_score,
        wallet_type,
        signal_reliability
      )
    `)
    .eq('coin_symbol', coinSymbol)
    .gte('timestamp', since.toISOString())
    .gte('wallet_profiles.impact_score', 50);

  if (error || !transactions || transactions.length === 0) {
    return {
      buyVolume: 0,
      sellVolume: 0,
      netFlow: 0,
      whaleSentiment: 'neutral',
      topWalletsBuying: 0,
      topWalletsSelling: 0,
      confidenceLevel: 0,
    };
  }

  let buyVolume = 0;
  let sellVolume = 0;
  let topWalletsBuying = 0;
  let topWalletsSelling = 0;

  for (const tx of transactions) {
    const amount = tx.amount_usd || 0;

    if (tx.direction === 'buy' || tx.direction === 'transfer_in') {
      buyVolume += amount;
      topWalletsBuying++;
    } else if (tx.direction === 'sell' || tx.direction === 'transfer_out') {
      sellVolume += amount;
      topWalletsSelling++;
    }
  }

  const netFlow = buyVolume - sellVolume;

  // Determine sentiment
  let whaleSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  const netBuyers = topWalletsBuying - topWalletsSelling;

  if (netBuyers >= 3 || netFlow > buyVolume * 0.3) {
    whaleSentiment = 'bullish';
  } else if (netBuyers <= -3 || netFlow < -sellVolume * 0.3) {
    whaleSentiment = 'bearish';
  }

  // Determine smart money direction
  let smartMoneyDirection: 'accumulating' | 'distributing' | 'neutral' | undefined;
  if (netFlow > 0 && topWalletsBuying > topWalletsSelling) {
    smartMoneyDirection = 'accumulating';
  } else if (netFlow < 0 && topWalletsSelling > topWalletsBuying) {
    smartMoneyDirection = 'distributing';
  } else {
    smartMoneyDirection = 'neutral';
  }

  // Confidence level based on volume and consistency
  const totalVolume = buyVolume + sellVolume;
  const totalTx = transactions.length;
  const confidenceLevel = Math.min(100, Math.round(
    (Math.log10(totalVolume + 1) * 10) + (totalTx * 5)
  ));

  return {
    buyVolume,
    sellVolume,
    netFlow,
    whaleSentiment,
    topWalletsBuying,
    topWalletsSelling,
    smartMoneyDirection,
    confidenceLevel,
  };
}

/**
 * Calculate wallet accuracy over time
 */
export async function calculateWalletAccuracy(
  walletAddress: string,
  options?: {
    blockchain?: string;
    days?: number;
    coinSymbol?: string;
  }
): Promise<{
  accuracy: number;
  totalTrades: number;
  profitableTrades: number;
  avgProfit: number;
  bestTrade?: WalletTransaction;
  worstTrade?: WalletTransaction;
}> {
  const db = checkSupabase();

  const profile = await getWalletProfile(walletAddress, options?.blockchain);
  if (!profile) {
    return {
      accuracy: 50,
      totalTrades: 0,
      profitableTrades: 0,
      avgProfit: 0,
    };
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (options?.days || 30));

  let query = db
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', profile.id)
    .gte('timestamp', startDate.toISOString())
    .not('was_profitable', 'is', null);

  if (options?.coinSymbol) {
    query = query.eq('coin_symbol', options.coinSymbol);
  }

  const { data: transactions, error } = await query;

  if (error || !transactions || transactions.length === 0) {
    return {
      accuracy: 50,
      totalTrades: 0,
      profitableTrades: 0,
      avgProfit: 0,
    };
  }

  const profitableTrades = transactions.filter(tx => tx.was_profitable);
  const avgProfit = transactions.reduce((sum, tx) => sum + (tx.profit_pct || 0), 0) / transactions.length;

  // Find best and worst trades
  const sortedByProfit = [...transactions].sort((a, b) => (b.profit_pct || 0) - (a.profit_pct || 0));

  return {
    accuracy: (profitableTrades.length / transactions.length) * 100,
    totalTrades: transactions.length,
    profitableTrades: profitableTrades.length,
    avgProfit,
    bestTrade: sortedByProfit[0] ? snakeToCamel(sortedByProfit[0]) as unknown as WalletTransaction : undefined,
    worstTrade: sortedByProfit[sortedByProfit.length - 1]
      ? snakeToCamel(sortedByProfit[sortedByProfit.length - 1]) as unknown as WalletTransaction
      : undefined,
  };
}

/**
 * Get exchange flow summary
 */
export async function getExchangeFlowSummary(
  coinSymbol?: string,
  hours: number = 24
): Promise<{
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  byExchange: { name: string; inflow: number; outflow: number; net: number }[];
  trend: 'accumulation' | 'distribution' | 'neutral';
}> {
  const db = checkSupabase();

  const since = new Date();
  since.setHours(since.getHours() - hours);

  let query = db
    .from('wallet_transactions')
    .select(`
      direction,
      amount_usd,
      exchange_name,
      wallet_profiles!inner (wallet_type)
    `)
    .eq('is_exchange_related', true)
    .gte('timestamp', since.toISOString());

  if (coinSymbol) {
    query = query.eq('coin_symbol', coinSymbol);
  }

  const { data: transactions, error } = await query;

  if (error || !transactions) {
    return {
      totalInflow: 0,
      totalOutflow: 0,
      netFlow: 0,
      byExchange: [],
      trend: 'neutral',
    };
  }

  const exchangeFlows: Record<string, { inflow: number; outflow: number }> = {};
  let totalInflow = 0;
  let totalOutflow = 0;

  for (const tx of transactions) {
    const amount = tx.amount_usd || 0;
    const exchange = tx.exchange_name || 'Unknown';

    if (!exchangeFlows[exchange]) {
      exchangeFlows[exchange] = { inflow: 0, outflow: 0 };
    }

    // Exchange inflow = users sending to exchange (sell pressure)
    // Exchange outflow = users withdrawing from exchange (accumulation)
    if (tx.direction === 'transfer_in' || tx.direction === 'sell') {
      exchangeFlows[exchange].inflow += amount;
      totalInflow += amount;
    } else if (tx.direction === 'transfer_out' || tx.direction === 'buy') {
      exchangeFlows[exchange].outflow += amount;
      totalOutflow += amount;
    }
  }

  const netFlow = totalOutflow - totalInflow; // Positive = accumulation
  const byExchange = Object.entries(exchangeFlows)
    .map(([name, flows]) => ({
      name,
      inflow: flows.inflow,
      outflow: flows.outflow,
      net: flows.outflow - flows.inflow,
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  let trend: 'accumulation' | 'distribution' | 'neutral' = 'neutral';
  const threshold = Math.max(totalInflow, totalOutflow) * 0.2;
  if (netFlow > threshold) {
    trend = 'accumulation';
  } else if (netFlow < -threshold) {
    trend = 'distribution';
  }

  return {
    totalInflow,
    totalOutflow,
    netFlow,
    byExchange,
    trend,
  };
}

export default {
  createWalletProfile,
  getWalletProfile,
  getHighImpactWallets,
  updateWalletMetrics,
  trackWalletTransaction,
  getWalletTransactions,
  getWalletSignals,
  calculateWalletAccuracy,
  getExchangeFlowSummary,
  classifyWallet,
};
