'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadButton } from '@/components/TemplateDownloadButton';
import { CoinGeckoAttribution } from '@/components/CoinGeckoAttribution';
import { SUPPORTED_COINS } from '@/lib/dataTypes';
import { useViewMode } from '@/lib/viewMode';
import { ChevronDown, ChevronUp, Search, TrendingUp, DollarSign, BarChart3, Target, Percent, Zap, Info } from 'lucide-react';

// Help icon with tooltip
function HelpIcon({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center ml-1.5"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help w-4 h-4 rounded-full bg-gray-700 text-emerald-400 text-[10px] flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors font-bold">
        ?
      </span>
      {isVisible && (
        <span className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-2xl border border-emerald-500/50 min-w-[220px] max-w-[300px] text-left leading-relaxed">
          {text}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-6 border-transparent border-t-gray-900"></span>
        </span>
      )}
    </span>
  );
}

// Inline explanation banner
function MetricExplainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5 text-[11px] text-gray-500 mt-1 leading-relaxed">
      <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-600" />
      <span>{children}</span>
    </div>
  );
}

// "What If Market Cap" Calculator Component
function WhatIfMarketCapCalculator({ coins }: { coins: Coin[] }) {
  const [coinA, setCoinA] = useState<string>(() => coins[0]?.id || '');
  const [coinB, setCoinB] = useState<string>(() => coins[1]?.id || '');

  const selectedCoinA = coins.find(c => c.id === coinA) || coins[0];
  const selectedCoinB = coins.find(c => c.id === coinB) || coins[1];

  const hypotheticalPrice =
    selectedCoinA && selectedCoinB && selectedCoinA.circulating_supply > 0
      ? selectedCoinB.market_cap / selectedCoinA.circulating_supply
      : null;

  const priceMultiplier =
    selectedCoinA && hypotheticalPrice
      ? hypotheticalPrice / selectedCoinA.current_price
      : null;

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.0001) return `$${price.toFixed(6)}`;
    return `$${price.toExponential(2)}`;
  };

  const formatLargeNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="mt-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-4">
      <h3 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
        <span>🤔</span>
        What-If Market Cap Calculator
        <HelpIcon text="Shows what Coin A's price would be if it had Coin B's market cap. Formula: Coin B MCap / Coin A Supply = Hypothetical Price. Educational only." />
      </h3>
      <p className="text-gray-400 text-xs mb-3">
        What would {selectedCoinA?.name || 'a coin'}&apos;s price be with {selectedCoinB?.name || 'another coin'}&apos;s market cap?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label htmlFor="coinA" className="block text-xs font-medium text-gray-300 mb-1">
            Calculate Price For
          </label>
          <select
            id="coinA"
            value={coinA}
            onChange={(e) => setCoinA(e.target.value)}
            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:border-purple-500 focus:outline-none"
          >
            {coins.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.symbol.toUpperCase()})
              </option>
            ))}
          </select>
          {selectedCoinA && (
            <p className="mt-0.5 text-[10px] text-gray-500">
              Current: {formatPrice(selectedCoinA.current_price)} · MCap: {formatLargeNumber(selectedCoinA.market_cap)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="coinB" className="block text-xs font-medium text-gray-300 mb-1">
            If It Had MCap Of
          </label>
          <select
            id="coinB"
            value={coinB}
            onChange={(e) => setCoinB(e.target.value)}
            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:border-purple-500 focus:outline-none"
          >
            {coins.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.symbol.toUpperCase()})
              </option>
            ))}
          </select>
          {selectedCoinB && (
            <p className="mt-0.5 text-[10px] text-gray-500">
              MCap: {formatLargeNumber(selectedCoinB.market_cap)}
            </p>
          )}
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3 flex flex-col justify-center">
          <div className="text-xs text-gray-400 mb-0.5">Hypothetical Price:</div>
          {hypotheticalPrice !== null ? (
            <>
              <div className="text-xl font-bold text-purple-400">
                {formatPrice(hypotheticalPrice)}
              </div>
              <div className={`text-xs mt-0.5 ${(priceMultiplier || 0) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                {priceMultiplier !== null && (
                  <span>
                    {priceMultiplier >= 1 ? '📈' : '📉'} {priceMultiplier.toFixed(2)}x {priceMultiplier >= 1 ? 'increase' : 'decrease'}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-sm">Select different coins</div>
          )}
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-2 text-[10px] text-gray-400">
        <strong className="text-gray-300">Formula:</strong>{' '}
        {selectedCoinB?.name || 'Coin B'} MCap ({formatLargeNumber(selectedCoinB?.market_cap)}) ÷{' '}
        {selectedCoinA?.name || 'Coin A'} Supply ({selectedCoinA?.circulating_supply?.toLocaleString() || 'N/A'}) ={' '}
        <span className="text-purple-400">{hypotheticalPrice !== null ? formatPrice(hypotheticalPrice) : 'N/A'}</span>
        <span className="ml-2 text-yellow-500/80">
          ⚠️ Educational only — ignores tokenomics, utility, and adoption differences.
        </span>
      </div>
    </div>
  );
}

// Head-to-Head Comparison for exactly 2 coins
function HeadToHead({ coins, formatPrice, formatLargeNumber }: {
  coins: Coin[];
  formatPrice: (p: number) => string;
  formatLargeNumber: (n: number | undefined) => string;
}) {
  if (coins.length !== 2) return null;
  const [a, b] = coins;

  const metrics = [
    {
      label: 'Price',
      aVal: formatPrice(a.current_price),
      bVal: formatPrice(b.current_price),
      ratio: a.current_price / b.current_price,
      winner: a.current_price > b.current_price ? 'a' : 'b',
      explain: 'Raw price is meaningless for comparison — market cap matters more',
    },
    {
      label: 'Market Cap',
      aVal: formatLargeNumber(a.market_cap),
      bVal: formatLargeNumber(b.market_cap),
      ratio: a.market_cap / b.market_cap,
      winner: a.market_cap > b.market_cap ? 'a' : 'b',
      explain: 'Total value of all circulating coins. The true measure of a project\'s size',
    },
    {
      label: '24h Volume',
      aVal: formatLargeNumber(a.total_volume),
      bVal: formatLargeNumber(b.total_volume),
      ratio: a.total_volume / b.total_volume,
      winner: a.total_volume > b.total_volume ? 'a' : 'b',
      explain: 'How much was traded in 24h. Higher volume = more liquid and easier to trade',
    },
    {
      label: '24h Change',
      aVal: `${(a.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(a.price_change_percentage_24h || 0).toFixed(2)}%`,
      bVal: `${(b.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(b.price_change_percentage_24h || 0).toFixed(2)}%`,
      ratio: null,
      winner: (a.price_change_percentage_24h || 0) > (b.price_change_percentage_24h || 0) ? 'a' : 'b',
      explain: 'Which coin performed better in the last 24 hours',
    },
    {
      label: 'From ATH',
      aVal: `${(a.ath_change_percentage || 0).toFixed(1)}%`,
      bVal: `${(b.ath_change_percentage || 0).toFixed(1)}%`,
      ratio: null,
      winner: (a.ath_change_percentage || -100) > (b.ath_change_percentage || -100) ? 'a' : 'b',
      explain: 'Distance from all-time high. Closer to 0% = near its peak. Closer to ATH may mean less upside',
    },
    {
      label: 'Vol/MCap',
      aVal: a.market_cap > 0 ? (a.total_volume / a.market_cap).toFixed(3) : 'N/A',
      bVal: b.market_cap > 0 ? (b.total_volume / b.market_cap).toFixed(3) : 'N/A',
      ratio: null,
      winner: (a.total_volume / a.market_cap) > (b.total_volume / b.market_cap) ? 'a' : 'b',
      explain: 'Volume relative to market cap. Higher ratio = more trading activity relative to size',
    },
  ];

  const aWins = metrics.filter(m => m.winner === 'a').length;
  const bWins = metrics.filter(m => m.winner === 'b').length;

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mt-4">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
        ⚔️ Head-to-Head: {a.symbol.toUpperCase()} vs {b.symbol.toUpperCase()}
        <span className="ml-auto text-xs font-normal">
          <span className="text-emerald-400">{a.symbol.toUpperCase()} {aWins}</span>
          <span className="text-gray-500 mx-1">—</span>
          <span className="text-blue-400">{bWins} {b.symbol.toUpperCase()}</span>
        </span>
      </h3>

      <div className="space-y-1.5">
        {metrics.map((m) => (
          <div key={m.label} className="group">
            <div className="grid grid-cols-[1fr_80px_1fr] gap-2 items-center text-xs">
              <div className={`text-right font-medium ${m.winner === 'a' ? 'text-emerald-400' : 'text-gray-300'}`}>
                {m.aVal} {m.winner === 'a' && '✓'}
              </div>
              <div className="text-center text-gray-500 text-[10px] font-medium">{m.label}</div>
              <div className={`text-left font-medium ${m.winner === 'b' ? 'text-blue-400' : 'text-gray-300'}`}>
                {m.winner === 'b' && '✓ '}{m.bVal}
              </div>
            </div>
            {m.ratio !== null && (
              <div className="text-center text-[10px] text-gray-600">
                {a.symbol.toUpperCase()} is {m.ratio > 1 ? `${m.ratio.toFixed(1)}x larger` : `${(1 / m.ratio).toFixed(1)}x smaller`}
              </div>
            )}
            <div className="text-center text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {m.explain}
            </div>
          </div>
        ))}
      </div>

      <MetricExplainer>
        Winning a metric doesn&apos;t mean being &quot;better&quot; — each metric tells a different story. Market cap shows project size, volume shows liquidity, and ATH distance shows recovery potential.
      </MetricExplainer>
    </div>
  );
}

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  high_24h?: number;
  low_24h?: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  price_change_percentage_1y_in_currency?: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation?: number;
  total_volume: number;
  circulating_supply: number;
  total_supply?: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi?: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
}

// Categories with colors
const CATEGORIES = [
  { id: 'all', label: 'All', color: 'bg-gray-600' },
  { id: 'layer1', label: 'Layer 1', color: 'bg-blue-600' },
  { id: 'layer2', label: 'Layer 2', color: 'bg-purple-600' },
  { id: 'defi', label: 'DeFi', color: 'bg-green-600' },
  { id: 'gaming', label: 'Gaming', color: 'bg-pink-600' },
  { id: 'meme', label: 'Meme', color: 'bg-yellow-600' },
  { id: 'exchange', label: 'Exchange', color: 'bg-orange-600' },
  { id: 'payments', label: 'Payments', color: 'bg-cyan-600' },
  { id: 'storage', label: 'Storage', color: 'bg-indigo-600' },
  { id: 'ai', label: 'AI', color: 'bg-red-600' },
];

// Initial coin list from static config
const INITIAL_ALL_COINS = SUPPORTED_COINS.map(coin => ({
  id: coin.symbol.toLowerCase(),
  symbol: coin.symbol,
  name: coin.name,
  category: coin.category,
}));

let ALL_COINS = INITIAL_ALL_COINS;

// Sort options
const SORT_OPTIONS = [
  { id: 'market_cap_desc', label: 'Market Cap (High → Low)' },
  { id: 'market_cap_asc', label: 'Market Cap (Low → High)' },
  { id: 'price_change_24h_desc', label: '24h Change (Best First)' },
  { id: 'price_change_24h_asc', label: '24h Change (Worst First)' },
  { id: 'volume_desc', label: 'Volume (High → Low)' },
  { id: 'ath_change_desc', label: 'Closest to ATH' },
  { id: 'ath_change_asc', label: 'Furthest from ATH' },
];

// Preset comparison groups
const PRESET_GROUPS = [
  { label: 'Top 5', icon: '🏆', ids: ['bitcoin', 'ethereum', 'tether', 'xrp', 'solana'] },
  { label: 'Layer 1s', icon: '🔗', ids: ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2', 'near', 'sui'] },
  { label: 'Layer 2s', icon: '⚡', ids: ['matic-network', 'arbitrum', 'optimism', 'starknet'] },
  { label: 'DeFi', icon: '🏦', ids: ['uniswap', 'aave', 'lido-dao', 'maker', 'chainlink'] },
  { label: 'Meme Coins', icon: '🐕', ids: ['dogecoin', 'shiba-inu', 'pepe', 'bonk', 'floki'] },
  { label: 'AI Tokens', icon: '🤖', ids: ['render-token', 'fetch-ai', 'bittensor', 'the-graph'] },
  { label: 'Exchange', icon: '🏛️', ids: ['binancecoin', 'uniswap', 'okb', 'crypto-com-chain'] },
  { label: 'BTC vs ETH', icon: '⚔️', ids: ['bitcoin', 'ethereum'] },
];

// Visible columns configuration
const COLUMN_OPTIONS = [
  // Market Data
  { id: 'price', label: 'Price', default: true, category: 'Market', tip: 'Current trading price in USD' },
  { id: 'change_24h', label: '24h Change', default: true, category: 'Market', tip: 'Price change over last 24 hours' },
  { id: 'change_7d', label: '7d Change', default: true, category: 'Market', tip: 'Price change over last 7 days' },
  { id: 'change_30d', label: '30d Change', default: false, category: 'Market', tip: 'Price change over last 30 days' },
  { id: 'change_1y', label: '1Y Change', default: false, category: 'Market', tip: 'Price change over last 12 months' },
  { id: 'market_cap', label: 'Market Cap', default: true, category: 'Market', tip: 'Price × Circulating Supply. The total value of all coins in circulation' },
  { id: 'fdv', label: 'FDV', default: false, category: 'Market', tip: 'Fully Diluted Valuation = Price × Max Supply. Shows potential dilution' },
  { id: 'volume', label: '24h Volume', default: true, category: 'Market', tip: 'Total value traded in last 24h. Higher = more liquid' },
  { id: 'vol_mcap_ratio', label: 'Vol/MCap', default: false, category: 'Market', tip: 'Volume/MarketCap ratio. Above 0.1 = very active trading' },
  { id: 'circulating', label: 'Circ. Supply', default: false, category: 'Market', tip: 'Number of coins currently in circulation' },
  { id: 'max_supply', label: 'Max Supply', default: false, category: 'Market', tip: 'Maximum coins that will ever exist. Null = potentially inflationary' },
  { id: 'supply_ratio', label: 'Circ/Max %', default: false, category: 'Market', tip: 'Percentage of max supply already in circulation. Higher = less future dilution' },

  // Price Levels
  { id: 'ath', label: 'ATH', default: true, category: 'Price Levels', tip: 'All-Time High price ever reached' },
  { id: 'from_ath', label: 'From ATH', default: true, category: 'Price Levels', tip: 'How far below the all-time high. Closer to 0% = near its peak' },
  { id: 'atl', label: 'ATL', default: false, category: 'Price Levels', tip: 'All-Time Low price ever reached' },
  { id: 'from_atl', label: 'From ATL', default: false, category: 'Price Levels', tip: 'How far above the all-time low. Shows total recovery' },
  { id: 'high_24h', label: '24h High', default: false, category: 'Price Levels', tip: 'Highest price in the last 24 hours' },
  { id: 'low_24h', label: '24h Low', default: false, category: 'Price Levels', tip: 'Lowest price in the last 24 hours' },
  { id: 'price_range_24h', label: '24h Range', default: false, category: 'Price Levels', tip: 'Price range as % of low. Higher = more intraday volatility' },

  // Technical Indicators
  { id: 'rsi', label: 'RSI', default: false, category: 'Technical', tip: 'Relative Strength Index (0-100). Below 30 = oversold, above 70 = overbought' },
  { id: 'volatility', label: 'Vol 30d', default: false, category: 'Technical', tip: '30-day price volatility. Higher = riskier but potentially more rewarding' },
  { id: 'momentum', label: 'Mom 30d', default: false, category: 'Technical', tip: '30-day momentum. Positive = uptrend, negative = downtrend' },
  { id: 'sharpe', label: 'Sharpe', default: false, category: 'Technical', tip: 'Risk-adjusted return. Above 1 = good, above 2 = great, below 0 = losing money' },
  { id: 'max_drawdown', label: 'Max DD', default: false, category: 'Technical', tip: 'Largest peak-to-trough decline. Shows worst-case loss scenario' },

  // Market Dominance & Ratios
  { id: 'dominance', label: 'Dominance', default: false, category: 'Dominance', tip: 'Share of total market cap among compared coins' },
  { id: 'ratio_btc', label: 'In BTC', default: false, category: 'Dominance', tip: 'Price denominated in Bitcoin. Shows performance relative to BTC' },
  { id: 'ratio_eth', label: 'In ETH', default: false, category: 'Dominance', tip: 'Price denominated in Ethereum. Shows performance relative to ETH' },
];

type TechnicalMetrics = {
  rsi14: number | null;
  volatility30dPct: number | null;
  momentum30dPct: number | null;
  sharpeRatio: number | null;
  maxDrawdown: number | null;
  source: string | null;
  lastUpdate: string | null;
};

export default function ComparePage() {
  const { isSimple, isPro } = useViewMode();
  const [selectedIds, setSelectedIds] = useState<string[]>(['bitcoin', 'ethereum', 'solana']);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [technicals, setTechnicals] = useState<Map<string, TechnicalMetrics>>(new Map());
  const [technicalsLoading, setTechnicalsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('market_cap_desc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    COLUMN_OPTIONS.filter(c => c.default).map(c => c.id)
  );
  const [showFilters, setShowFilters] = useState(false);
  const [availableCoins, setAvailableCoins] = useState(INITIAL_ALL_COINS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch all available coins dynamically
  useEffect(() => {
    async function fetchAllCoins() {
      try {
        const res = await fetch('/api/crypto/all');
        const data = await res.json();
        if (data.success && data.coins && data.coins.length > 0) {
          const coinsList = data.coins.map((c: { id: string; name: string; symbol: string; category: string }) => ({
            id: c.id,
            symbol: c.symbol,
            name: c.name,
            category: c.category || 'other',
          }));
          setAvailableCoins(coinsList);
          ALL_COINS = coinsList;
        }
      } catch (error) {
        console.error('Failed to fetch coins:', error);
      }
    }
    fetchAllCoins();
  }, []);

  const fetchCoins = async () => {
    if (selectedIds.length === 0) {
      setCoins([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ids = selectedIds.join(',');
      const res = await fetch(`/api/crypto?ids=${ids}`);
      const json = await res.json();
      const data = json.data;

      if (Array.isArray(data)) {
        const sortedData = [...data];
        switch (sortBy) {
          case 'market_cap_asc':
            sortedData.sort((a, b) => a.market_cap - b.market_cap);
            break;
          case 'price_change_24h_desc':
            sortedData.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
            break;
          case 'price_change_24h_asc':
            sortedData.sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0));
            break;
          case 'volume_desc':
            sortedData.sort((a, b) => b.total_volume - a.total_volume);
            break;
          case 'ath_change_desc':
            sortedData.sort((a, b) => (b.ath_change_percentage || -100) - (a.ath_change_percentage || -100));
            break;
          case 'ath_change_asc':
            sortedData.sort((a, b) => (a.ath_change_percentage || -100) - (b.ath_change_percentage || -100));
            break;
          default:
            sortedData.sort((a, b) => b.market_cap - a.market_cap);
        }
        setCoins(sortedData);
      } else {
        setError('Failed to load data');
      }
    } catch {
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
  }, [selectedIds, sortBy]);

  useEffect(() => {
    if (coins.length > 0) {
      fetchTechnicals();
    }
  }, [coins]);

  const fetchTechnicals = async () => {
    setTechnicalsLoading(true);
    try {
      const requests = coins.map(async (coin) => {
        try {
          const res = await fetch(`/api/technical?coin=${encodeURIComponent(coin.id)}&timeframe=1d`);
          const json = await res.json();

          if (!res.ok || !json?.success || !json?.data) {
            return [coin.id, {
              rsi14: null, volatility30dPct: null, momentum30dPct: null,
              sharpeRatio: null, maxDrawdown: null, source: null, lastUpdate: null,
            }] as const;
          }

          const indicators = Array.isArray(json.data.indicators) ? json.data.indicators : [];
          const rsi = indicators.find((i: { shortName?: string; name?: string }) =>
            i?.shortName === 'RSI (14)' || i?.name === 'Relative Strength Index'
          )?.value;

          const metrics = json.data.metrics || {};

          return [coin.id, {
            rsi14: typeof rsi === 'number' ? rsi : null,
            volatility30dPct: typeof metrics.volatility30dPct === 'number' ? metrics.volatility30dPct : null,
            momentum30dPct: typeof metrics.momentum30dPct === 'number' ? metrics.momentum30dPct : null,
            sharpeRatio: typeof metrics.sharpeRatio === 'number' ? metrics.sharpeRatio : null,
            maxDrawdown: typeof metrics.maxDrawdownPct === 'number' ? metrics.maxDrawdownPct : null,
            source: typeof json.data?.meta?.source === 'string' ? json.data.meta.source : null,
            lastUpdate: typeof json.data?.meta?.lastUpdate === 'string' ? json.data.meta.lastUpdate : null,
          }] as const;
        } catch {
          return [coin.id, {
            rsi14: null, volatility30dPct: null, momentum30dPct: null,
            sharpeRatio: null, maxDrawdown: null, source: null, lastUpdate: null,
          }] as const;
        }
      });

      const results = await Promise.all(requests);
      const next = new Map<string, TechnicalMetrics>();
      for (const [coinId, data] of results) next.set(coinId, data);
      setTechnicals(next);
    } finally {
      setTechnicalsLoading(false);
    }
  };

  const toggleCoin = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 10) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleColumn = (colId: string) => {
    setVisibleColumns(prev =>
      prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
    );
  };

  const selectAllInCategory = (cat: string) => {
    const catCoins = availableCoins.filter(c => c.category === cat).map(c => c.id);
    const newSelection = [...new Set([...selectedIds, ...catCoins])].slice(0, 10);
    setSelectedIds(newSelection);
  };

  const clearSelection = () => setSelectedIds([]);

  const filteredCoins = availableCoins.filter(coin => {
    const matchesCategory = categoryFilter === 'all' || coin.category === categoryFilter;
    const matchesSearch = searchQuery === '' ||
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Format helpers
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.0001) return `$${price.toFixed(6)}`;
    return `$${price.toExponential(2)}`;
  };

  const formatLargeNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatSupply = (num: number | undefined) => {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const formatPercent = (pct: number | undefined) => {
    if (pct === undefined || pct === null) return 'N/A';
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  };

  const formatNullablePercent = (pct: number | null | undefined) => {
    if (pct === undefined || pct === null) return 'N/A';
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  };

  // Best/worst highlighting
  const getBestWorst = (field: keyof Coin) => {
    if (coins.length === 0) return { best: '', worst: '' };
    const values = coins.map(c => ({ id: c.id, val: Number(c[field]) || 0 }));
    values.sort((a, b) => b.val - a.val);
    return { best: values[0]?.id, worst: values[values.length - 1]?.id };
  };

  const priceChangeBW = getBestWorst('price_change_percentage_24h');
  const marketCapBW = getBestWorst('market_cap');
  const volumeBW = getBestWorst('total_volume');

  // Comparison verdict
  const verdict = useMemo(() => {
    if (coins.length < 2) return null;

    const gaining = coins.filter(c => (c.price_change_percentage_24h || 0) > 0);
    const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
    const topCoin = [...coins].sort((a, b) => b.market_cap - a.market_cap)[0];
    const topDom = totalMcap > 0 ? ((topCoin.market_cap / totalMcap) * 100).toFixed(1) : '0';
    const bestPerf = [...coins].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))[0];
    const worstPerf = [...coins].sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))[0];
    const avgChange = coins.reduce((s, c) => s + (c.price_change_percentage_24h || 0), 0) / coins.length;
    const closestATH = [...coins].sort((a, b) => (b.ath_change_percentage || -100) - (a.ath_change_percentage || -100))[0];
    const highestVolRatio = [...coins].sort((a, b) => {
      const rA = a.market_cap > 0 ? a.total_volume / a.market_cap : 0;
      const rB = b.market_cap > 0 ? b.total_volume / b.market_cap : 0;
      return rB - rA;
    })[0];
    const volRatio = highestVolRatio.market_cap > 0 ? (highestVolRatio.total_volume / highestVolRatio.market_cap).toFixed(3) : '0';

    const parts: string[] = [];
    parts.push(`${gaining.length}/${coins.length} coins are green in the last 24h with an average change of ${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`);
    parts.push(`${topCoin.symbol.toUpperCase()} dominates at ${topDom}% of compared market cap (${formatLargeNumber(topCoin.market_cap)})`);
    parts.push(`Best performer: ${bestPerf.symbol.toUpperCase()} (${(bestPerf.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(bestPerf.price_change_percentage_24h || 0).toFixed(2)}%), worst: ${worstPerf.symbol.toUpperCase()} (${(worstPerf.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(worstPerf.price_change_percentage_24h || 0).toFixed(2)}%)`);
    parts.push(`${closestATH.symbol.toUpperCase()} is closest to its ATH (${(closestATH.ath_change_percentage || 0).toFixed(1)}%)`);
    parts.push(`${highestVolRatio.symbol.toUpperCase()} has the highest trading activity (Vol/MCap: ${volRatio})`);

    return parts.join('. ') + '.';
  }, [coins]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header — compact */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Compare Cryptocurrencies</h1>
            <p className="text-gray-400 text-sm">
              {isSimple
                ? 'Quick comparison of any two coins · Free, no login required'
                : 'Compare up to 10 coins side-by-side with 50+ metrics · Free, no login required'
              }
            </p>
            <div className="mt-1">
              <CoinGeckoAttribution variant="compact" showIcon />
            </div>
          </div>
          <div className="flex gap-2 mt-3 md:mt-0">
            <TemplateDownloadButton
              pageContext={{
                pageId: 'compare',
                comparedCoins: selectedIds,
                visibleColumns,
                timeframe: '24h',
                currency: 'USD',
                customizations: { sortBy, categoryFilter, includeCharts: true },
              }}
              variant="outline"
              size="md"
            />
          </div>
        </div>

        {/* Simple Mode */}
        {isSimple && (
          <>
            {/* Quick Search */}
            <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search coins (e.g., Bitcoin, ETH, Solana)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {searchQuery && filteredCoins.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {filteredCoins.slice(0, 12).map((coin) => {
                    const isSelected = selectedIds.includes(coin.id);
                    return (
                      <button
                        key={coin.id}
                        type="button"
                        onClick={() => toggleCoin(coin.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {coin.symbol.toUpperCase()} ({coin.name})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* What-If Calculator */}
            {coins.length >= 2 && <WhatIfMarketCapCalculator coins={coins} />}

            {/* Head-to-Head for 2 coins */}
            {coins.length === 2 && !loading && (
              <HeadToHead coins={coins} formatPrice={formatPrice} formatLargeNumber={formatLargeNumber} />
            )}

            {/* Core Metrics Cards */}
            {coins.length >= 2 && !loading && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {coins.slice(0, 2).map((coin) => (
                  <div key={coin.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                      <div>
                        <h3 className="font-bold text-white text-sm">{coin.name}</h3>
                        <span className="text-gray-400 text-xs uppercase">{coin.symbol}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" /> Price
                        </span>
                        <span className="font-medium text-white">{formatPrice(coin.current_price)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5" /> Market Cap
                        </span>
                        <span className="font-medium text-white">{formatLargeNumber(coin.market_cap)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <Percent className="w-3.5 h-3.5" /> Circulating
                        </span>
                        <span className="font-medium text-white">{formatSupply(coin.circulating_supply)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" /> ATH
                        </span>
                        <div className="text-right">
                          <span className="font-medium text-white">{formatPrice(coin.ath)}</span>
                          <span className={`ml-1.5 text-xs ${(coin.ath_change_percentage || 0) >= -10 ? 'text-green-400' : 'text-red-400'}`}>
                            ({formatPercent(coin.ath_change_percentage)})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" /> 24h Change
                        </span>
                        <span className={`font-medium ${(coin.price_change_percentage_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(coin.price_change_percentage_24h)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent"></div>
              </div>
            )}

            {/* Empty state */}
            {!loading && coins.length < 2 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-lg text-white mb-1">Select 2 coins to compare</p>
                <p className="text-gray-400 text-sm">Search above or pick from popular coins below</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin', 'xrp'].map((coinId) => {
                    const coin = availableCoins.find(c => c.id === coinId);
                    const isSelected = selectedIds.includes(coinId);
                    if (!coin) return null;
                    return (
                      <button
                        key={coinId}
                        type="button"
                        onClick={() => toggleCoin(coinId)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {coin.symbol.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show Advanced Toggle */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-emerald-400 transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showAdvanced ? 'Hide advanced comparison' : 'Show advanced (10 coins, filters, columns)'}
              </button>
            </div>
          </>
        )}

        {/* Pro Mode OR Simple + Advanced */}
        {(isPro || (isSimple && showAdvanced)) && (
          <>
            {/* Pro feature highlight */}
            {isPro && (
              <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-lg p-3 mb-4 text-xs">
                <p className="text-emerald-400 flex items-start gap-1.5">
                  <span>🚀</span>
                  <span>
                    <strong>Compare up to 10 coins</strong> side-by-side with 26 metrics, technical indicators, category filters, and visual charts.
                  </span>
                </p>
              </div>
            )}

            {/* Filters */}
            <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white flex items-center">
                  🔍 Filter & Search
                  <HelpIcon text="Filter coins by category, search by name/symbol, or select from the list below. Compare up to 10 coins at once." />
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  {showFilters ? '▼ Hide' : '▶ Advanced'}
                </button>
              </div>

              {/* Search */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search coins by name or symbol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      categoryFilter === cat.id
                        ? `${cat.color} text-white`
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cat.label}
                    <span className="ml-1 text-[10px] opacity-75">
                      ({cat.id === 'all' ? availableCoins.length : availableCoins.filter(c => c.category === cat.id).length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="border-t border-gray-700 pt-3 mt-3 space-y-3">
                  <div>
                    <label htmlFor="sort-select" className="block text-xs font-medium text-gray-400 mb-1">Sort By</label>
                    <select
                      id="sort-select"
                      title="Sort Results By"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full md:w-56 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                    >
                      {SORT_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Column Selection — grouped by category */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Visible Columns</label>
                    {['Market', 'Price Levels', 'Technical', 'Dominance'].map((cat) => (
                      <div key={cat} className="mb-1.5">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{cat}</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {COLUMN_OPTIONS.filter(c => c.category === cat).map((col) => (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => toggleColumn(col.id)}
                              title={col.tip}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                                visibleColumns.includes(col.id)
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                              }`}
                            >
                              {col.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <MetricExplainer>Hover over column buttons above for metric descriptions. Enable Technical columns to see RSI, volatility, momentum, Sharpe ratio, and max drawdown.</MetricExplainer>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-1.5">
                    {categoryFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => selectAllInCategory(categoryFilter)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium text-white"
                      >
                        Select All {CATEGORIES.find(c => c.id === categoryFilter)?.label}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium text-white"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-white mb-2 flex items-center">
                <Zap className="w-4 h-4 text-emerald-400 mr-1.5" />
                Quick Presets
                <HelpIcon text="Load preset coin groups for instant comparison. Click to replace your current selection." />
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_GROUPS.map((group) => (
                  <button
                    key={group.label}
                    type="button"
                    onClick={() => setSelectedIds(group.ids)}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-emerald-600/20 hover:border-emerald-500/30 border border-gray-600 rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-all"
                  >
                    <span className="mr-1">{group.icon}</span>
                    {group.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Coin Selection */}
            <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-white mb-2 flex items-center">
                Select Coins ({selectedIds.length}/10)
                <HelpIcon text="Click coins to add/remove from comparison. Green = selected. Max 10 coins." />
              </h2>
              <div className="flex flex-wrap gap-1.5 max-h-[240px] overflow-y-auto pr-1">
                {filteredCoins.map((coin) => {
                  const isSelected = selectedIds.includes(coin.id);
                  const catColor = CATEGORIES.find(c => c.id === coin.category)?.color || 'bg-gray-600';
                  return (
                    <button
                      key={coin.id}
                      type="button"
                      onClick={() => toggleCoin(coin.id)}
                      disabled={!isSelected && selectedIds.length >= 10}
                      className={`px-2 py-1 rounded-lg border transition-all text-xs ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                          : selectedIds.length >= 10
                            ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <span className="font-medium">{coin.symbol}</span>
                      <span className="text-[10px] opacity-75 ml-0.5">({coin.name})</span>
                      <span className={`ml-1 px-1 py-0.5 rounded text-[9px] ${catColor} opacity-75`}>
                        {coin.category}
                      </span>
                    </button>
                  );
                })}
              </div>
              {filteredCoins.length === 0 && (
                <p className="text-gray-400 text-center py-3 text-sm">No coins match your search/filter</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent"></div>
              </div>
            )}

            {/* Comparison Verdict */}
            {!loading && verdict && (
              <div className="bg-gradient-to-r from-gray-800 to-gray-800/80 rounded-lg p-3 mb-3 border border-emerald-500/20">
                <h3 className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Comparison Summary
                </h3>
                <p className="text-[11px] text-gray-300 leading-relaxed">{verdict}</p>
              </div>
            )}

            {/* Active Column Guide — compact inline */}
            {!loading && coins.length > 0 && (
              <div className="bg-gray-800/60 rounded-lg px-3 py-2 mb-3 border border-gray-700/50">
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px]">
                  {visibleColumns.map((colId) => {
                    const col = COLUMN_OPTIONS.find(c => c.id === colId);
                    if (!col) return null;
                    return (
                      <span key={colId} className="text-gray-500">
                        <span className="text-emerald-400/80 font-medium">{col.label}:</span> {col.tip}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comparison Table — compact */}
            {!loading && coins.length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10 bg-gray-900">
                      <tr className="bg-gray-900 border-b border-gray-700">
                        <th className="px-2 py-2 text-left text-emerald-400 font-medium sticky left-0 bg-gray-900 w-8">#</th>
                        <th className="px-2 py-2 text-left text-emerald-400 font-medium">Coin</th>
                        {visibleColumns.includes('price') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">Price</th>}
                        {visibleColumns.includes('change_24h') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">24h</th>}
                        {visibleColumns.includes('change_7d') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">7d</th>}
                        {visibleColumns.includes('change_30d') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">30d</th>}
                        {visibleColumns.includes('change_1y') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">1Y</th>}
                        {visibleColumns.includes('market_cap') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">MCap</th>}
                        {visibleColumns.includes('fdv') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">FDV</th>}
                        {visibleColumns.includes('volume') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">Volume</th>}
                        {visibleColumns.includes('vol_mcap_ratio') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">V/M</th>}
                        {visibleColumns.includes('circulating') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">Circ</th>}
                        {visibleColumns.includes('max_supply') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">Max</th>}
                        {visibleColumns.includes('supply_ratio') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">C/M</th>}
                        {visibleColumns.includes('ath') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">ATH</th>}
                        {visibleColumns.includes('from_ath') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">%ATH</th>}
                        {visibleColumns.includes('atl') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">ATL</th>}
                        {visibleColumns.includes('from_atl') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">%ATL</th>}
                        {visibleColumns.includes('high_24h') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">Hi</th>}
                        {visibleColumns.includes('low_24h') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">Lo</th>}
                        {visibleColumns.includes('price_range_24h') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">Rng</th>}
                        {visibleColumns.includes('rsi') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">RSI</th>}
                        {visibleColumns.includes('volatility') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">Vol</th>}
                        {visibleColumns.includes('momentum') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">Mom</th>}
                        {visibleColumns.includes('sharpe') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">Shp</th>}
                        {visibleColumns.includes('max_drawdown') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">DD</th>}
                        {visibleColumns.includes('dominance') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">Dom</th>}
                        {visibleColumns.includes('ratio_btc') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">BTC</th>}
                        {visibleColumns.includes('ratio_eth') && <th className="px-2 py-2 text-right text-emerald-400 font-medium">ETH</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {coins.map((coin, index) => (
                        <tr
                          key={coin.id}
                          className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors group"
                        >
                          <td className="px-2 py-1.5 text-gray-500 sticky left-0 bg-gray-800 group-hover:bg-gray-700/30">{index + 1}</td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full" />
                              <span className="font-medium text-white group-hover:text-emerald-400 transition-colors text-xs">{coin.name}</span>
                              <span className="text-gray-500 uppercase text-[10px]">{coin.symbol}</span>
                            </div>
                          </td>
                          {visibleColumns.includes('price') && (
                            <td className="px-2 py-1.5 text-right font-medium text-white">{formatPrice(coin.current_price)}</td>
                          )}
                          {visibleColumns.includes('change_24h') && (
                            <td className={`px-2 py-1.5 text-right font-medium ${
                              coin.id === priceChangeBW.best ? 'text-green-400 bg-green-400/10' :
                              coin.id === priceChangeBW.worst && coins.length > 2 ? 'text-red-400 bg-red-400/10' :
                              (coin.price_change_percentage_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatPercent(coin.price_change_percentage_24h)}
                              {coin.id === priceChangeBW.best && <span className="ml-0.5">🏆</span>}
                            </td>
                          )}
                          {visibleColumns.includes('change_7d') && (
                            <td className={`px-2 py-1.5 text-right font-medium ${
                              (coin.price_change_percentage_7d_in_currency || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatPercent(coin.price_change_percentage_7d_in_currency)}
                            </td>
                          )}
                          {visibleColumns.includes('change_30d') && (
                            <td className={`px-2 py-1.5 text-right font-medium ${
                              (coin.price_change_percentage_30d_in_currency || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatPercent(coin.price_change_percentage_30d_in_currency)}
                            </td>
                          )}
                          {visibleColumns.includes('change_1y') && (
                            <td className={`px-2 py-1.5 text-right font-medium ${
                              (coin.price_change_percentage_1y_in_currency || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatPercent(coin.price_change_percentage_1y_in_currency)}
                            </td>
                          )}
                          {visibleColumns.includes('market_cap') && (
                            <td className={`px-2 py-1.5 text-right ${
                              coin.id === marketCapBW.best ? 'text-blue-400 font-medium' : 'text-gray-300'
                            }`}>
                              {formatLargeNumber(coin.market_cap)}
                              {coin.id === marketCapBW.best && <span className="ml-0.5">👑</span>}
                            </td>
                          )}
                          {visibleColumns.includes('fdv') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">{formatLargeNumber(coin.fully_diluted_valuation)}</td>
                          )}
                          {visibleColumns.includes('volume') && (
                            <td className={`px-2 py-1.5 text-right ${
                              coin.id === volumeBW.best ? 'text-purple-400 font-medium' : 'text-gray-300'
                            }`}>
                              {formatLargeNumber(coin.total_volume)}
                              {coin.id === volumeBW.best && <span className="ml-0.5">🔥</span>}
                            </td>
                          )}
                          {visibleColumns.includes('vol_mcap_ratio') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">
                              {coin.market_cap > 0 ? (coin.total_volume / coin.market_cap).toFixed(3) : 'N/A'}
                            </td>
                          )}
                          {visibleColumns.includes('circulating') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">{formatSupply(coin.circulating_supply)}</td>
                          )}
                          {visibleColumns.includes('max_supply') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">
                              {typeof coin.max_supply === 'number' ? formatSupply(coin.max_supply) : '∞'}
                            </td>
                          )}
                          {visibleColumns.includes('supply_ratio') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">
                              {typeof coin.max_supply === 'number' && coin.max_supply > 0
                                ? `${((coin.circulating_supply / coin.max_supply) * 100).toFixed(1)}%`
                                : 'N/A'
                              }
                            </td>
                          )}
                          {visibleColumns.includes('ath') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">{formatPrice(coin.ath)}</td>
                          )}
                          {visibleColumns.includes('from_ath') && (
                            <td className={`px-2 py-1.5 text-right ${
                              (coin.ath_change_percentage || -100) >= -10 ? 'text-green-400' :
                              (coin.ath_change_percentage || -100) >= -50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {formatPercent(coin.ath_change_percentage)}
                            </td>
                          )}
                          {visibleColumns.includes('atl') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">{formatPrice(coin.atl)}</td>
                          )}
                          {visibleColumns.includes('from_atl') && (
                            <td className="px-2 py-1.5 text-right text-green-400">
                              {formatPercent(coin.atl_change_percentage)}
                            </td>
                          )}
                          {visibleColumns.includes('high_24h') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">
                              {typeof coin.high_24h === 'number' ? formatPrice(coin.high_24h) : 'N/A'}
                            </td>
                          )}
                          {visibleColumns.includes('low_24h') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">
                              {typeof coin.low_24h === 'number' ? formatPrice(coin.low_24h) : 'N/A'}
                            </td>
                          )}
                          {visibleColumns.includes('price_range_24h') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">
                              {typeof coin.high_24h === 'number' && typeof coin.low_24h === 'number' && coin.low_24h > 0
                                ? formatNullablePercent(((coin.high_24h - coin.low_24h) / coin.low_24h) * 100)
                                : 'N/A'
                              }
                            </td>
                          )}
                          {visibleColumns.includes('rsi') && (
                            <td className={`px-2 py-1.5 text-right ${
                              (() => {
                                const rsi = technicals.get(coin.id)?.rsi14;
                                if (rsi == null) return 'text-gray-300';
                                return rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-green-400' : 'text-gray-300';
                              })()
                            }`}>
                              {technicalsLoading ? '…' : (() => {
                                const rsi = technicals.get(coin.id)?.rsi14;
                                if (rsi == null) return 'N/A';
                                return `${rsi.toFixed(0)}`;
                              })()}
                            </td>
                          )}
                          {visibleColumns.includes('volatility') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">
                              {technicalsLoading ? '…' : formatNullablePercent(technicals.get(coin.id)?.volatility30dPct)}
                            </td>
                          )}
                          {visibleColumns.includes('momentum') && (
                            <td className={`px-2 py-1.5 text-right ${
                              (technicals.get(coin.id)?.momentum30dPct || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {technicalsLoading ? '…' : formatNullablePercent(technicals.get(coin.id)?.momentum30dPct)}
                            </td>
                          )}
                          {visibleColumns.includes('sharpe') && (
                            <td className={`px-2 py-1.5 text-right ${
                              (technicals.get(coin.id)?.sharpeRatio || 0) > 1 ? 'text-green-400' :
                              (technicals.get(coin.id)?.sharpeRatio || 0) < 0 ? 'text-red-400' : 'text-gray-300'
                            }`}>
                              {technicalsLoading ? '…' : (technicals.get(coin.id)?.sharpeRatio?.toFixed(2) ?? 'N/A')}
                            </td>
                          )}
                          {visibleColumns.includes('max_drawdown') && (
                            <td className={`px-2 py-1.5 text-right ${
                              (technicals.get(coin.id)?.maxDrawdown ?? 0) < -20 ? 'text-red-400' : 'text-gray-300'
                            }`}>
                              {technicalsLoading ? '…' : formatNullablePercent(technicals.get(coin.id)?.maxDrawdown)}
                            </td>
                          )}
                          {visibleColumns.includes('dominance') && (
                            <td className="px-2 py-1.5 text-right text-gray-300">
                              {(() => {
                                const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
                                return totalMcap > 0 ? `${((coin.market_cap / totalMcap) * 100).toFixed(1)}%` : 'N/A';
                              })()}
                            </td>
                          )}
                          {visibleColumns.includes('ratio_btc') && (
                            <td className="px-2 py-1.5 text-right text-gray-300 text-[10px]">
                              {(() => {
                                const btc = coins.find(c => c.id === 'bitcoin');
                                return btc && btc.current_price > 0
                                  ? `₿${(coin.current_price / btc.current_price).toFixed(8)}`
                                  : coin.id === 'bitcoin' ? '₿1.00' : 'N/A';
                              })()}
                            </td>
                          )}
                          {visibleColumns.includes('ratio_eth') && (
                            <td className="px-2 py-1.5 text-right text-gray-300 text-[10px]">
                              {(() => {
                                const eth = coins.find(c => c.id === 'ethereum');
                                return eth && eth.current_price > 0
                                  ? `Ξ${(coin.current_price / eth.current_price).toFixed(6)}`
                                  : coin.id === 'ethereum' ? 'Ξ1.00' : 'N/A';
                              })()}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Visual Comparison Charts — 2x2 compact grid */}
            {!loading && coins.length >= 2 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Market Cap */}
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
                    📊 Market Cap
                    <HelpIcon text="Market Cap = Price × Circulating Supply. Bar width shows relative size. The largest coin gets a full bar." />
                  </h3>
                  <div className="space-y-1.5">
                    {coins.map((coin) => {
                      const maxMcap = Math.max(...coins.map(c => c.market_cap || 0));
                      const pct = maxMcap > 0 ? ((coin.market_cap || 0) / maxMcap) * 100 : 0;
                      return (
                        <div key={coin.id} className="flex items-center gap-2">
                          <div className="w-10 text-[10px] text-gray-400 font-medium uppercase text-right flex-shrink-0">{coin.symbol}</div>
                          <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full flex items-center justify-end pr-1 transition-all duration-500"
                              style={{ width: `${Math.max(pct, 3)}%` }}
                            >
                              {pct > 20 && <span className="text-[9px] font-medium text-white">{formatLargeNumber(coin.market_cap)}</span>}
                            </div>
                          </div>
                          {pct <= 20 && <span className="text-[10px] text-gray-400">{formatLargeNumber(coin.market_cap)}</span>}
                        </div>
                      );
                    })}
                  </div>
                  <MetricExplainer>Market cap is the best measure of a project&apos;s size. A low-price coin can have a higher market cap than a high-price coin.</MetricExplainer>
                </div>

                {/* 24h Performance */}
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
                    📈 24h Performance
                    <HelpIcon text="Price change in the last 24 hours. Green bars = gaining, red bars = losing. Bar height is relative." />
                  </h3>
                  <div className="flex items-end gap-1 h-32 px-1">
                    {coins.map((coin) => {
                      const change = coin.price_change_percentage_24h || 0;
                      const maxAbs = Math.max(1, ...coins.map(c => Math.abs(c.price_change_percentage_24h || 0)));
                      const barHeight = (Math.abs(change) / maxAbs) * 80;
                      const isPositive = change >= 0;
                      return (
                        <div key={coin.id} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                          <span className={`text-[9px] font-bold mb-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                          </span>
                          <div className="w-full flex justify-center">
                            <div
                              className={`w-6 max-w-full rounded-t transition-all duration-500 ${
                                isPositive ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gradient-to-t from-red-600 to-red-400'
                              }`}
                              style={{ height: `${Math.max(barHeight, 4)}%` }}
                            />
                          </div>
                          <div className="w-full border-t border-gray-600 mt-0" />
                          <span className="text-[9px] text-gray-400 mt-1 uppercase font-medium truncate w-full text-center">{coin.symbol}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Volume */}
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
                    💹 24h Volume
                    <HelpIcon text="Total trading volume in the last 24 hours. Higher volume means more liquidity — easier to buy/sell without moving the price." />
                  </h3>
                  <div className="space-y-1.5">
                    {coins.map((coin) => {
                      const maxVol = Math.max(...coins.map(c => c.total_volume || 0));
                      const pct = maxVol > 0 ? ((coin.total_volume || 0) / maxVol) * 100 : 0;
                      return (
                        <div key={coin.id} className="flex items-center gap-2">
                          <div className="w-10 text-[10px] text-gray-400 font-medium uppercase text-right flex-shrink-0">{coin.symbol}</div>
                          <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-400 rounded-full flex items-center justify-end pr-1 transition-all duration-500"
                              style={{ width: `${Math.max(pct, 3)}%` }}
                            >
                              {pct > 20 && <span className="text-[9px] font-medium text-white">{formatLargeNumber(coin.total_volume)}</span>}
                            </div>
                          </div>
                          {pct <= 20 && <span className="text-[10px] text-gray-400">{formatLargeNumber(coin.total_volume)}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ATH Distance */}
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
                    🎯 Distance from ATH
                    <HelpIcon text="How far each coin is from its all-time high. Green = near ATH (less upside?), yellow = moderate, red = far from ATH (potential recovery)." />
                  </h3>
                  <div className="space-y-1.5">
                    {coins.map((coin) => {
                      const athPct = coin.ath_change_percentage || -100;
                      const fillPct = Math.min(100, 100 + athPct);
                      return (
                        <div key={coin.id} className="flex items-center gap-2">
                          <div className="w-10 text-[10px] text-gray-400 font-medium uppercase text-right flex-shrink-0">{coin.symbol}</div>
                          <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-full rounded-full flex items-center justify-end pr-1 transition-all duration-500 ${
                                fillPct > 70 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                                fillPct > 40 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                                'bg-gradient-to-r from-red-600 to-red-400'
                              }`}
                              style={{ width: `${Math.max(fillPct, 3)}%` }}
                            >
                              {fillPct > 20 && (
                                <span className="text-[9px] font-medium text-white">
                                  {athPct.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                          {fillPct <= 20 && <span className="text-[10px] text-gray-400">{athPct.toFixed(1)}%</span>}
                        </div>
                      );
                    })}
                  </div>
                  <MetricExplainer>Coins far from ATH may have more upside potential, but they may also be declining projects. Always check fundamentals.</MetricExplainer>
                </div>
              </div>
            )}

            {/* Head-to-Head for Pro mode with 2 coins */}
            {!loading && coins.length === 2 && (
              <HeadToHead coins={coins} formatPrice={formatPrice} formatLargeNumber={formatLargeNumber} />
            )}

            {/* No Selection */}
            {!loading && coins.length === 0 && selectedIds.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-lg">Select coins above to compare them</p>
                <p className="text-sm mt-1">Compare up to 10 coins side-by-side</p>
              </div>
            )}

            {/* What-If Calculator */}
            {coins.length >= 2 && <WhatIfMarketCapCalculator coins={coins} />}

            {/* Legend — compact inline */}
            <div className="mt-4 bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h3 className="font-medium text-white text-xs mb-2">Reading the Data:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 text-[10px] text-gray-400">
                <div><span className="text-green-400">🏆</span> Best 24h performer</div>
                <div><span className="text-blue-400">👑</span> Highest market cap</div>
                <div><span className="text-purple-400">🔥</span> Highest volume</div>
                <div><span className="text-green-400">Green</span> = positive change</div>
                <div><span className="text-red-400">Red</span> = negative change</div>
                <div><span className="text-yellow-400">Yellow</span> = within 50% of ATH</div>
                <div>∞ = no max supply</div>
                <div>FDV = Price × Max Supply</div>
                <div>V/M = Volume ÷ Market Cap</div>
                <div>RSI &gt;70 overbought, &lt;30 oversold</div>
                <div>Sharpe &gt;1 good, &gt;2 great</div>
                <div>ATH/ATL = All-Time High/Low</div>
              </div>
              <MetricExplainer>
                These metrics provide a snapshot — not investment advice. Combine with fundamental analysis (team, technology, adoption) for informed decisions. Past performance does not guarantee future results.
              </MetricExplainer>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-gray-400 text-xs">
          <p className="mb-1">
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline font-medium"
            >
              Powered by CoinGecko
            </a>
            {' '}· Updates frequently · {isPro ? '50+ coins available' : 'Quick compare tool'}
          </p>
          <p>
            Want historical charts, alerts, and analytics? <Link href="/pricing" className="text-emerald-400 hover:underline">View pricing</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
