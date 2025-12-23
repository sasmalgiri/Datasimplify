'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';

// Help icon with tooltip
function HelpIcon({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center ml-2"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help w-5 h-5 rounded-full bg-gray-700 text-emerald-400 text-xs flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors font-bold">
        ?
      </span>
      {isVisible && (
        <span className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 text-sm text-white bg-gray-900 rounded-lg shadow-2xl border border-emerald-500/50 min-w-[250px] max-w-[350px] text-left">
          {text}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
        </span>
      )}
    </span>
  );
}

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
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

// Extended coin list with categories - 50+ coins
const ALL_COINS = [
  // Layer 1
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', category: 'layer1' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', category: 'layer1' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', category: 'layer1' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', category: 'layer1' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', category: 'layer1' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', category: 'layer1' },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', category: 'layer1' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos', category: 'layer1' },
  { id: 'internet-computer', symbol: 'ICP', name: 'Internet Computer', category: 'layer1' },
  { id: 'aptos', symbol: 'APT', name: 'Aptos', category: 'layer1' },
  { id: 'sui', symbol: 'SUI', name: 'Sui', category: 'layer1' },
  { id: 'fantom', symbol: 'FTM', name: 'Fantom', category: 'layer1' },
  { id: 'algorand', symbol: 'ALGO', name: 'Algorand', category: 'layer1' },
  { id: 'tezos', symbol: 'XTZ', name: 'Tezos', category: 'layer1' },
  { id: 'hedera-hashgraph', symbol: 'HBAR', name: 'Hedera', category: 'layer1' },
  { id: 'kaspa', symbol: 'KAS', name: 'Kaspa', category: 'layer1' },
  { id: 'sei-network', symbol: 'SEI', name: 'Sei', category: 'layer1' },
  { id: 'injective-protocol', symbol: 'INJ', name: 'Injective', category: 'layer1' },

  // Layer 2
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', category: 'layer2' },
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', category: 'layer2' },
  { id: 'optimism', symbol: 'OP', name: 'Optimism', category: 'layer2' },
  { id: 'immutable-x', symbol: 'IMX', name: 'Immutable', category: 'layer2' },
  { id: 'starknet', symbol: 'STRK', name: 'Starknet', category: 'layer2' },
  { id: 'mantle', symbol: 'MNT', name: 'Mantle', category: 'layer2' },

  // DeFi
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', category: 'defi' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', category: 'defi' },
  { id: 'aave', symbol: 'AAVE', name: 'Aave', category: 'defi' },
  { id: 'maker', symbol: 'MKR', name: 'Maker', category: 'defi' },
  { id: 'lido-dao', symbol: 'LDO', name: 'Lido DAO', category: 'defi' },
  { id: 'the-graph', symbol: 'GRT', name: 'The Graph', category: 'defi' },
  { id: 'curve-dao-token', symbol: 'CRV', name: 'Curve', category: 'defi' },
  { id: 'jupiter-exchange-solana', symbol: 'JUP', name: 'Jupiter', category: 'defi' },
  { id: 'raydium', symbol: 'RAY', name: 'Raydium', category: 'defi' },
  { id: 'pancakeswap-token', symbol: 'CAKE', name: 'PancakeSwap', category: 'defi' },

  // Gaming / Metaverse
  { id: 'render-token', symbol: 'RNDR', name: 'Render', category: 'gaming' },
  { id: 'the-sandbox', symbol: 'SAND', name: 'The Sandbox', category: 'gaming' },
  { id: 'decentraland', symbol: 'MANA', name: 'Decentraland', category: 'gaming' },
  { id: 'axie-infinity', symbol: 'AXS', name: 'Axie Infinity', category: 'gaming' },
  { id: 'gala', symbol: 'GALA', name: 'Gala', category: 'gaming' },
  { id: 'enjincoin', symbol: 'ENJ', name: 'Enjin Coin', category: 'gaming' },
  { id: 'illuvium', symbol: 'ILV', name: 'Illuvium', category: 'gaming' },

  // Meme
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', category: 'meme' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', category: 'meme' },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', category: 'meme' },
  { id: 'dogwifcoin', symbol: 'WIF', name: 'dogwifhat', category: 'meme' },
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', category: 'meme' },
  { id: 'floki', symbol: 'FLOKI', name: 'Floki', category: 'meme' },

  // Exchange Tokens
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', category: 'exchange' },
  { id: 'okb', symbol: 'OKB', name: 'OKB', category: 'exchange' },
  { id: 'crypto-com-chain', symbol: 'CRO', name: 'Cronos', category: 'exchange' },
  { id: 'kucoin-shares', symbol: 'KCS', name: 'KuCoin Token', category: 'exchange' },

  // Payments
  { id: 'ripple', symbol: 'XRP', name: 'XRP', category: 'payments' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar', category: 'payments' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', category: 'payments' },
  { id: 'tron', symbol: 'TRX', name: 'TRON', category: 'payments' },
  { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash', category: 'payments' },

  // Storage
  { id: 'filecoin', symbol: 'FIL', name: 'Filecoin', category: 'storage' },
  { id: 'arweave', symbol: 'AR', name: 'Arweave', category: 'storage' },

  // AI
  { id: 'fetch-ai', symbol: 'FET', name: 'Fetch.ai', category: 'ai' },
  { id: 'singularitynet', symbol: 'AGIX', name: 'SingularityNET', category: 'ai' },
  { id: 'ocean-protocol', symbol: 'OCEAN', name: 'Ocean Protocol', category: 'ai' },
  { id: 'bittensor', symbol: 'TAO', name: 'Bittensor', category: 'ai' },
];

// Sort options
const SORT_OPTIONS = [
  { id: 'market_cap_desc', label: 'Market Cap (High to Low)' },
  { id: 'market_cap_asc', label: 'Market Cap (Low to High)' },
  { id: 'price_change_24h_desc', label: '24h Change (Best First)' },
  { id: 'price_change_24h_asc', label: '24h Change (Worst First)' },
  { id: 'volume_desc', label: 'Volume (High to Low)' },
  { id: 'ath_change_desc', label: 'Closest to ATH' },
  { id: 'ath_change_asc', label: 'Furthest from ATH' },
];

// Visible columns configuration - expanded to match Download page parity
const COLUMN_OPTIONS = [
  // Market Data
  { id: 'price', label: 'Price', default: true, category: 'Market' },
  { id: 'change_24h', label: '24h Change', default: true, category: 'Market' },
  { id: 'change_7d', label: '7d Change', default: true, category: 'Market' },
  { id: 'change_30d', label: '30d Change', default: false, category: 'Market' },
  { id: 'change_1y', label: '1Y Change', default: false, category: 'Market' },
  { id: 'market_cap', label: 'Market Cap', default: true, category: 'Market' },
  { id: 'fdv', label: 'Fully Diluted Val.', default: false, category: 'Market' },
  { id: 'volume', label: '24h Volume', default: true, category: 'Market' },
  { id: 'vol_mcap_ratio', label: 'Vol/MCap Ratio', default: false, category: 'Market' },
  { id: 'circulating', label: 'Circulating Supply', default: false, category: 'Market' },
  { id: 'max_supply', label: 'Max Supply', default: false, category: 'Market' },
  { id: 'supply_ratio', label: 'Circ/Max Supply %', default: false, category: 'Market' },

  // Price Levels
  { id: 'ath', label: 'ATH', default: true, category: 'Price Levels' },
  { id: 'from_ath', label: 'From ATH', default: true, category: 'Price Levels' },
  { id: 'atl', label: 'ATL', default: false, category: 'Price Levels' },
  { id: 'from_atl', label: 'From ATL', default: false, category: 'Price Levels' },
  { id: 'high_24h', label: '24h High', default: false, category: 'Price Levels' },
  { id: 'low_24h', label: '24h Low', default: false, category: 'Price Levels' },
  { id: 'price_range_24h', label: '24h Range %', default: false, category: 'Price Levels' },

  // AI & Signals
  { id: 'ai_signal', label: 'AI Signal', default: true, category: 'AI' },
  { id: 'ai_confidence', label: 'AI Confidence', default: false, category: 'AI' },
  { id: 'risk_level', label: 'Risk Level', default: false, category: 'AI' },

  // Technical Indicators (simulated)
  { id: 'rsi', label: 'RSI (14)', default: false, category: 'Technical' },
  { id: 'volatility', label: 'Volatility', default: false, category: 'Technical' },
  { id: 'momentum', label: 'Momentum', default: false, category: 'Technical' },

  // Market Dominance
  { id: 'dominance', label: 'Market Dominance', default: false, category: 'Dominance' },
];

// Prediction interface
interface CoinPrediction {
  coinId: string;
  prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['bitcoin', 'ethereum', 'solana']);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [predictions, setPredictions] = useState<Map<string, CoinPrediction>>(new Map());
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('market_cap_desc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    COLUMN_OPTIONS.filter(c => c.default).map(c => c.id)
  );
  const [showFilters, setShowFilters] = useState(false);

  const fetchCoins = async () => {
    if (selectedIds.length === 0) {
      setCoins([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ids = selectedIds.join(',');
      // Use internal API which checks Supabase cache first, then falls back to CoinGecko
      const res = await fetch(`/api/crypto?ids=${ids}`);
      const json = await res.json();
      const data = json.data;

      if (Array.isArray(data)) {
        // Sort data based on selection
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

  // Fetch predictions when coins are loaded
  useEffect(() => {
    if (coins.length > 0) {
      fetchPredictions();
    }
  }, [coins]);

  const fetchPredictions = async () => {
    setPredictionsLoading(true);
    try {
      const coinsToPredict = coins.map(c => ({ id: c.id, name: c.name }));

      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins: coinsToPredict })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const predMap = new Map<string, CoinPrediction>();
          result.data.forEach((pred: { coinId: string; prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; confidence: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' }) => {
            if (pred.coinId && pred.prediction) {
              predMap.set(pred.coinId, {
                coinId: pred.coinId,
                prediction: pred.prediction,
                confidence: pred.confidence || 50,
                riskLevel: pred.riskLevel || 'MEDIUM'
              });
            }
          });
          setPredictions(predMap);
        }
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setPredictionsLoading(false);
    }
  };

  // Get prediction badge for a coin
  const getPredictionBadge = (coinId: string) => {
    const pred = predictions.get(coinId);
    if (!pred) {
      return predictionsLoading ? (
        <span className="text-gray-500 text-xs">...</span>
      ) : (
        <span className="text-gray-500 text-xs">-</span>
      );
    }

    const { prediction, confidence } = pred;
    const styles = {
      BULLISH: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', Icon: TrendingUp },
      BEARISH: { bg: 'bg-red-500/20', text: 'text-red-400', Icon: TrendingDown },
      NEUTRAL: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', Icon: Minus }
    };

    const style = styles[prediction];
    const Icon = style.Icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        <span>{prediction === 'BULLISH' ? 'Bull' : prediction === 'BEARISH' ? 'Bear' : 'Neut'}</span>
        <span className="opacity-60">{confidence}%</span>
      </span>
    );
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
      prev.includes(colId)
        ? prev.filter(c => c !== colId)
        : [...prev, colId]
    );
  };

  const selectAllInCategory = (cat: string) => {
    const catCoins = ALL_COINS.filter(c => c.category === cat).map(c => c.id);
    const newSelection = [...new Set([...selectedIds, ...catCoins])].slice(0, 10);
    setSelectedIds(newSelection);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Filter coins for display
  const filteredCoins = ALL_COINS.filter(coin => {
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
    if (!num) return '-';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatSupply = (num: number | undefined) => {
    if (!num) return '-';
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const formatPercent = (pct: number | undefined) => {
    if (pct === undefined || pct === null) return '-';
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  };

  // Download as CSV/Excel
  const downloadData = (format: 'csv' | 'json') => {
    if (coins.length === 0) return;

    const data = coins.map(coin => ({
      Name: coin.name,
      Symbol: coin.symbol.toUpperCase(),
      Rank: coin.market_cap_rank,
      Price: coin.current_price,
      '24h Change %': coin.price_change_percentage_24h?.toFixed(2) || 'N/A',
      '7d Change %': coin.price_change_percentage_7d_in_currency?.toFixed(2) || 'N/A',
      '30d Change %': coin.price_change_percentage_30d_in_currency?.toFixed(2) || 'N/A',
      'Market Cap': coin.market_cap,
      'FDV': coin.fully_diluted_valuation || 'N/A',
      'Volume 24h': coin.total_volume,
      'Circulating Supply': coin.circulating_supply,
      'Max Supply': coin.max_supply || 'Unlimited',
      'ATH': coin.ath,
      'ATH Change %': coin.ath_change_percentage?.toFixed(2) || 'N/A',
      'ATL': coin.atl,
      'ATL Change %': coin.atl_change_percentage?.toFixed(2) || 'N/A',
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crypto-comparison-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else {
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(h => (row as Record<string, unknown>)[h]));
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crypto-comparison-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  // Find best/worst for highlighting
  const getBestWorst = (field: keyof Coin) => {
    if (coins.length === 0) return { best: '', worst: '' };
    const values = coins.map(c => ({ id: c.id, val: Number(c[field]) || 0 }));
    values.sort((a, b) => b.val - a.val);
    return { best: values[0]?.id, worst: values[values.length - 1]?.id };
  };

  const priceChangeBW = getBestWorst('price_change_percentage_24h');
  const marketCapBW = getBestWorst('market_cap');
  const volumeBW = getBestWorst('total_volume');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <FreeNavbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Compare Cryptocurrencies</h1>
            <p className="text-gray-400">Compare up to 10 coins side-by-side with 50+ cryptocurrencies • Free, no login required</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={() => downloadData('csv')}
              disabled={coins.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
            >
              <span>📥</span> CSV
            </button>
            <button
              onClick={() => downloadData('json')}
              disabled={coins.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
            >
              <span>📥</span> JSON
            </button>
          </div>
        </div>

        {/* Feature Highlight */}
        <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-700/50 rounded-lg p-4 mb-6">
          <p className="text-emerald-300 text-sm flex items-start gap-2">
            <span>🚀</span>
            <span>
              <strong>More than competitors!</strong> Compare up to 10 coins (CoinGecko allows only 2).
              Filter by category, 50+ coins, 7d/30d changes, ATH/ATL, FDV, and export to CSV/JSON!
            </span>
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              🔍 Filter & Search
              <HelpIcon text="Filter coins by category, search by name/symbol, or select from the list below. You can compare up to 10 coins at once." />
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              {showFilters ? '▼ Hide Advanced' : '▶ Show Advanced'}
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search coins by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  categoryFilter === cat.id
                    ? `${cat.color} text-white`
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat.label}
                <span className="ml-1 text-xs opacity-75">
                  ({cat.id === 'all' ? ALL_COINS.length : ALL_COINS.filter(c => c.category === cat.id).length})
                </span>
              </button>
            ))}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t border-gray-700 pt-4 mt-4 space-y-4">
              {/* Sort By */}
              <div>
                <label htmlFor="sort-select" className="block text-sm font-medium text-gray-400 mb-2">Sort Results By</label>
                <select
                  id="sort-select"
                  title="Sort Results By"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Column Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Visible Columns</label>
                <div className="flex flex-wrap gap-2">
                  {COLUMN_OPTIONS.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => toggleColumn(col.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

              {/* Quick Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Quick Actions</label>
                <div className="flex flex-wrap gap-2">
                  {categoryFilter !== 'all' && (
                    <button
                      onClick={() => selectAllInCategory(categoryFilter)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium"
                    >
                      Select All {CATEGORIES.find(c => c.id === categoryFilter)?.label}
                    </button>
                  )}
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coin Selection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            Select Coins to Compare ({selectedIds.length}/10)
            <HelpIcon text="Click on any coin to add or remove it from comparison. Selected coins appear with a green border. Maximum 10 coins." />
          </h2>
          <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2">
            {filteredCoins.map((coin) => {
              const isSelected = selectedIds.includes(coin.id);
              const catColor = CATEGORIES.find(c => c.id === coin.category)?.color || 'bg-gray-600';
              return (
                <button
                  key={coin.id}
                  onClick={() => toggleCoin(coin.id)}
                  disabled={!isSelected && selectedIds.length >= 10}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                      : selectedIds.length >= 10
                        ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="font-medium">{coin.symbol}</span>
                  <span className="text-xs opacity-75 ml-1">({coin.name})</span>
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${catColor} opacity-75`}>
                    {coin.category}
                  </span>
                </button>
              );
            })}
          </div>
          {filteredCoins.length === 0 && (
            <p className="text-gray-500 text-center py-4">No coins match your search/filter criteria</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        )}

        {/* Column Guide */}
        {!loading && coins.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2 font-medium">📊 Column Guide:</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
              {visibleColumns.includes('price') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">Price:</span> Current USD</span>}
              {visibleColumns.includes('change_24h') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">24h:</span> Day change</span>}
              {visibleColumns.includes('change_7d') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">7d:</span> Week change</span>}
              {visibleColumns.includes('change_30d') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">30d:</span> Month change</span>}
              {visibleColumns.includes('ai_signal') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">AI:</span> AI prediction signal</span>}
              {visibleColumns.includes('market_cap') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">MCap:</span> Market cap</span>}
              {visibleColumns.includes('fdv') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">FDV:</span> Fully diluted value</span>}
              {visibleColumns.includes('volume') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">Vol:</span> 24h volume</span>}
              {visibleColumns.includes('ath') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">ATH:</span> All-time high</span>}
              {visibleColumns.includes('from_ath') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">%ATH:</span> Distance from peak</span>}
              {visibleColumns.includes('atl') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">ATL:</span> All-time low</span>}
              {visibleColumns.includes('from_atl') && <span className="text-gray-300"><span className="text-emerald-400 font-medium">%ATL:</span> Gain from bottom</span>}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {!loading && coins.length > 0 && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-900">
                  <tr className="bg-gray-900/50 border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-emerald-400 font-medium sticky left-0 bg-gray-900/95">#</th>
                    <th className="px-4 py-3 text-left text-emerald-400 font-medium">Coin</th>
                    {visibleColumns.includes('price') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Price</th>}
                    {visibleColumns.includes('change_24h') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">24h</th>}
                    {visibleColumns.includes('change_7d') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">7d</th>}
                    {visibleColumns.includes('change_30d') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">30d</th>}
                    {visibleColumns.includes('ai_signal') && <th className="px-4 py-3 text-center text-emerald-400 font-medium">AI Signal</th>}
                    {visibleColumns.includes('market_cap') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Market Cap</th>}
                    {visibleColumns.includes('fdv') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">FDV</th>}
                    {visibleColumns.includes('volume') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Volume 24h</th>}
                    {visibleColumns.includes('circulating') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Circulating</th>}
                    {visibleColumns.includes('max_supply') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Max Supply</th>}
                    {visibleColumns.includes('ath') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">ATH</th>}
                    {visibleColumns.includes('from_ath') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">From ATH</th>}
                    {visibleColumns.includes('atl') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">ATL</th>}
                    {visibleColumns.includes('from_atl') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">From ATL</th>}
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin, index) => (
                    <tr
                      key={coin.id}
                      className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors group"
                    >
                      <td className="px-4 py-3 text-gray-500 sticky left-0 bg-gray-800 group-hover:bg-gray-700/50">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                          <div>
                            <span className="font-medium group-hover:text-emerald-400 transition-colors">{coin.name}</span>
                            <span className="text-gray-500 ml-2 uppercase text-xs">{coin.symbol}</span>
                          </div>
                        </div>
                      </td>
                      {visibleColumns.includes('price') && (
                        <td className="px-4 py-3 text-right font-medium">{formatPrice(coin.current_price)}</td>
                      )}
                      {visibleColumns.includes('change_24h') && (
                        <td className={`px-4 py-3 text-right font-medium ${
                          coin.id === priceChangeBW.best ? 'text-green-400 bg-green-400/10' :
                          coin.id === priceChangeBW.worst && coins.length > 2 ? 'text-red-400 bg-red-400/10' :
                          (coin.price_change_percentage_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(coin.price_change_percentage_24h)}
                          {coin.id === priceChangeBW.best && <span className="ml-1">🏆</span>}
                        </td>
                      )}
                      {visibleColumns.includes('change_7d') && (
                        <td className={`px-4 py-3 text-right font-medium ${
                          (coin.price_change_percentage_7d_in_currency || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(coin.price_change_percentage_7d_in_currency)}
                        </td>
                      )}
                      {visibleColumns.includes('change_30d') && (
                        <td className={`px-4 py-3 text-right font-medium ${
                          (coin.price_change_percentage_30d_in_currency || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(coin.price_change_percentage_30d_in_currency)}
                        </td>
                      )}
                      {visibleColumns.includes('ai_signal') && (
                        <td className="px-4 py-3 text-center">
                          {getPredictionBadge(coin.id)}
                        </td>
                      )}
                      {visibleColumns.includes('market_cap') && (
                        <td className={`px-4 py-3 text-right ${
                          coin.id === marketCapBW.best ? 'text-blue-400 font-medium' : 'text-gray-300'
                        }`}>
                          {formatLargeNumber(coin.market_cap)}
                          {coin.id === marketCapBW.best && <span className="ml-1">👑</span>}
                        </td>
                      )}
                      {visibleColumns.includes('fdv') && (
                        <td className="px-4 py-3 text-right text-gray-300">{formatLargeNumber(coin.fully_diluted_valuation)}</td>
                      )}
                      {visibleColumns.includes('volume') && (
                        <td className={`px-4 py-3 text-right ${
                          coin.id === volumeBW.best ? 'text-purple-400 font-medium' : 'text-gray-300'
                        }`}>
                          {formatLargeNumber(coin.total_volume)}
                          {coin.id === volumeBW.best && <span className="ml-1">🔥</span>}
                        </td>
                      )}
                      {visibleColumns.includes('circulating') && (
                        <td className="px-4 py-3 text-right text-gray-300">{formatSupply(coin.circulating_supply)}</td>
                      )}
                      {visibleColumns.includes('max_supply') && (
                        <td className="px-4 py-3 text-right text-gray-300">
                          {coin.max_supply ? formatSupply(coin.max_supply) : '∞'}
                        </td>
                      )}
                      {visibleColumns.includes('ath') && (
                        <td className="px-4 py-3 text-right text-gray-300">{formatPrice(coin.ath)}</td>
                      )}
                      {visibleColumns.includes('from_ath') && (
                        <td className={`px-4 py-3 text-right ${
                          (coin.ath_change_percentage || -100) >= -10 ? 'text-green-400' :
                          (coin.ath_change_percentage || -100) >= -50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {formatPercent(coin.ath_change_percentage)}
                        </td>
                      )}
                      {visibleColumns.includes('atl') && (
                        <td className="px-4 py-3 text-right text-gray-300">{formatPrice(coin.atl)}</td>
                      )}
                      {visibleColumns.includes('from_atl') && (
                        <td className="px-4 py-3 text-right text-green-400">
                          {formatPercent(coin.atl_change_percentage)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Selection */}
        {!loading && coins.length === 0 && selectedIds.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-6xl mb-4">📊</p>
            <p className="text-xl">Select coins above to compare them</p>
            <p className="text-sm mt-2">You can compare up to 10 coins side-by-side</p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="font-medium mb-3">Understanding the Data:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-400">
            <div><span className="text-green-400">🏆 Trophy</span> = Best 24h performer</div>
            <div><span className="text-blue-400">👑 Crown</span> = Highest market cap</div>
            <div><span className="text-purple-400">🔥 Fire</span> = Highest volume</div>
            <div><span className="text-green-400">Green %</span> = Positive change</div>
            <div><span className="text-red-400">Red %</span> = Negative change</div>
            <div><span className="text-yellow-400">Yellow %</span> = Within 50% of ATH</div>
            <div><span>∞</span> = No max supply (inflationary)</div>
            <div><span>FDV</span> = Price × Max Supply</div>
            <div><span>ATH/ATL</span> = All-Time High/Low</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Data from CoinGecko API • Updates in real-time • 50+ coins available</p>
          <p className="mt-2">
            Need more features? <Link href="/pricing" className="text-emerald-400 hover:underline">Upgrade to Pro</Link> for historical charts, alerts, and AI analysis!
          </p>
        </div>
      </div>
    </div>
  );
}
