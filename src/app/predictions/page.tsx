'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Target,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { AIPredictionDisclaimer } from '@/components/ui/DisclaimerBanner';

// Coin categories
const CATEGORIES = [
  { id: 'all', label: 'All Coins', color: 'bg-gray-600' },
  { id: 'layer1', label: 'Layer 1', color: 'bg-blue-600' },
  { id: 'layer2', label: 'Layer 2', color: 'bg-purple-600' },
  { id: 'defi', label: 'DeFi', color: 'bg-green-600' },
  { id: 'exchange', label: 'Exchange', color: 'bg-orange-600' },
  { id: 'meme', label: 'Meme', color: 'bg-yellow-600' },
  { id: 'ai', label: 'AI & Infra', color: 'bg-red-600' },
  { id: 'gaming', label: 'Gaming', color: 'bg-pink-600' },
  { id: 'privacy', label: 'Privacy', color: 'bg-indigo-600' },
];

// Extended coin list with categories - matching predictionIngestion.ts
const ALL_COINS = [
  // Major Layer 1s
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', category: 'layer1' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', category: 'layer1' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', category: 'layer1' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', category: 'layer1' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', category: 'layer1' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', category: 'layer1' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos', category: 'layer1' },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', category: 'layer1' },
  { id: 'sui', symbol: 'SUI', name: 'Sui', category: 'layer1' },
  { id: 'aptos', symbol: 'APT', name: 'Aptos', category: 'layer1' },
  { id: 'internet-computer', symbol: 'ICP', name: 'Internet Computer', category: 'layer1' },
  { id: 'toncoin', symbol: 'TON', name: 'Toncoin', category: 'layer1' },
  { id: 'tron', symbol: 'TRX', name: 'TRON', category: 'layer1' },
  { id: 'algorand', symbol: 'ALGO', name: 'Algorand', category: 'layer1' },
  { id: 'hedera-hashgraph', symbol: 'HBAR', name: 'Hedera', category: 'layer1' },
  { id: 'fantom', symbol: 'FTM', name: 'Fantom', category: 'layer1' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar', category: 'layer1' },
  { id: 'vechain', symbol: 'VET', name: 'VeChain', category: 'layer1' },
  { id: 'kaspa', symbol: 'KAS', name: 'Kaspa', category: 'layer1' },
  { id: 'injective-protocol', symbol: 'INJ', name: 'Injective', category: 'layer1' },
  { id: 'sei-network', symbol: 'SEI', name: 'Sei', category: 'layer1' },
  { id: 'celestia', symbol: 'TIA', name: 'Celestia', category: 'layer1' },

  // Layer 2s
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon', category: 'layer2' },
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', category: 'layer2' },
  { id: 'optimism', symbol: 'OP', name: 'Optimism', category: 'layer2' },
  { id: 'immutable-x', symbol: 'IMX', name: 'Immutable X', category: 'layer2' },
  { id: 'starknet', symbol: 'STRK', name: 'Starknet', category: 'layer2' },
  { id: 'mantle', symbol: 'MNT', name: 'Mantle', category: 'layer2' },

  // DeFi Protocols
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', category: 'defi' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', category: 'defi' },
  { id: 'aave', symbol: 'AAVE', name: 'Aave', category: 'defi' },
  { id: 'maker', symbol: 'MKR', name: 'Maker', category: 'defi' },
  { id: 'lido-dao', symbol: 'LDO', name: 'Lido DAO', category: 'defi' },
  { id: 'curve-dao-token', symbol: 'CRV', name: 'Curve', category: 'defi' },
  { id: 'synthetix-network-token', symbol: 'SNX', name: 'Synthetix', category: 'defi' },
  { id: 'compound-governance-token', symbol: 'COMP', name: 'Compound', category: 'defi' },
  { id: 'pancakeswap-token', symbol: 'CAKE', name: 'PancakeSwap', category: 'defi' },
  { id: 'the-graph', symbol: 'GRT', name: 'The Graph', category: 'defi' },
  { id: '1inch', symbol: '1INCH', name: '1inch', category: 'defi' },
  { id: 'gmx', symbol: 'GMX', name: 'GMX', category: 'defi' },
  { id: 'dydx', symbol: 'DYDX', name: 'dYdX', category: 'defi' },
  { id: 'jupiter-exchange-solana', symbol: 'JUP', name: 'Jupiter', category: 'defi' },

  // Exchange Tokens
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', category: 'exchange' },
  { id: 'okb', symbol: 'OKB', name: 'OKB', category: 'exchange' },
  { id: 'crypto-com-chain', symbol: 'CRO', name: 'Cronos', category: 'exchange' },
  { id: 'kucoin-shares', symbol: 'KCS', name: 'KuCoin Token', category: 'exchange' },
  { id: 'bitget-token', symbol: 'BGB', name: 'Bitget Token', category: 'exchange' },

  // Meme Coins
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', category: 'meme' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', category: 'meme' },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', category: 'meme' },
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', category: 'meme' },
  { id: 'floki', symbol: 'FLOKI', name: 'Floki', category: 'meme' },
  { id: 'dogwifcoin', symbol: 'WIF', name: 'dogwifhat', category: 'meme' },

  // AI & Infrastructure
  { id: 'render-token', symbol: 'RNDR', name: 'Render', category: 'ai' },
  { id: 'fetch-ai', symbol: 'FET', name: 'Fetch.ai', category: 'ai' },
  { id: 'singularitynet', symbol: 'AGIX', name: 'SingularityNET', category: 'ai' },
  { id: 'ocean-protocol', symbol: 'OCEAN', name: 'Ocean Protocol', category: 'ai' },
  { id: 'filecoin', symbol: 'FIL', name: 'Filecoin', category: 'ai' },
  { id: 'arweave', symbol: 'AR', name: 'Arweave', category: 'ai' },
  { id: 'theta-token', symbol: 'THETA', name: 'Theta Network', category: 'ai' },
  { id: 'akash-network', symbol: 'AKT', name: 'Akash Network', category: 'ai' },

  // Gaming & Metaverse
  { id: 'axie-infinity', symbol: 'AXS', name: 'Axie Infinity', category: 'gaming' },
  { id: 'the-sandbox', symbol: 'SAND', name: 'The Sandbox', category: 'gaming' },
  { id: 'decentraland', symbol: 'MANA', name: 'Decentraland', category: 'gaming' },
  { id: 'gala', symbol: 'GALA', name: 'Gala', category: 'gaming' },
  { id: 'illuvium', symbol: 'ILV', name: 'Illuvium', category: 'gaming' },
  { id: 'enjincoin', symbol: 'ENJ', name: 'Enjin Coin', category: 'gaming' },

  // Privacy
  { id: 'monero', symbol: 'XMR', name: 'Monero', category: 'privacy' },
  { id: 'zcash', symbol: 'ZEC', name: 'Zcash', category: 'privacy' },
];

// Prediction interface
interface Prediction {
  coinId: string;
  coinName: string;
  prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  reasons: string[];
  technicalScore: number;
  sentimentScore: number;
  onChainScore: number;
  macroScore: number;
  overallScore: number;
  timestamp: string;
}

// Sort options
const SORT_OPTIONS = [
  { id: 'confidence_desc', label: 'Confidence (High to Low)' },
  { id: 'confidence_asc', label: 'Confidence (Low to High)' },
  { id: 'score_desc', label: 'Overall Score (High to Low)' },
  { id: 'score_asc', label: 'Overall Score (Low to High)' },
  { id: 'bullish_first', label: 'Bullish First' },
  { id: 'bearish_first', label: 'Bearish First' },
  { id: 'risk_asc', label: 'Risk (Low to High)' },
  { id: 'risk_desc', label: 'Risk (High to Low)' },
];

// Signal filter options
const SIGNAL_FILTERS = [
  { id: 'all', label: 'All Signals' },
  { id: 'bullish', label: 'Bullish Only' },
  { id: 'bearish', label: 'Bearish Only' },
  { id: 'neutral', label: 'Neutral Only' },
];

function PredictionSignalBadge({ prediction, confidence }: { prediction: string; confidence: number }) {
  const getStyle = () => {
    switch (prediction) {
      case 'BULLISH':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'BEARISH':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
      default:
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    }
  };

  const style = getStyle();

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
      {prediction === 'BULLISH' ? (
        <TrendingUp className="w-4 h-4" />
      ) : prediction === 'BEARISH' ? (
        <TrendingDown className="w-4 h-4" />
      ) : (
        <Minus className="w-4 h-4" />
      )}
      <span className="font-medium text-sm">{prediction}</span>
      <span className="text-xs opacity-75">{confidence}%</span>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const getStyle = () => {
    switch (level) {
      case 'LOW':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
      case 'MEDIUM':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400' };
      case 'HIGH':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400' };
      case 'EXTREME':
        return { bg: 'bg-red-500/20', text: 'text-red-400' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400' };
    }
  };

  const style = getStyle();

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
      {level}
    </span>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const barRef = useRef<HTMLDivElement>(null);

  const getColor = () => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${score}%`;
    }
  }, [score]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className={`h-full rounded-full transition-all ${getColor()}`}
        />
      </div>
      <span className="text-xs text-gray-300 w-8 text-right">{score}</span>
    </div>
  );
}

export default function PredictionsPage() {
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['bitcoin', 'ethereum', 'solana']);
  const [predictions, setPredictions] = useState<Map<string, Prediction>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [signalFilter, setSignalFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('confidence_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch predictions for selected coins
  const fetchPredictions = async () => {
    if (selectedCoins.length === 0) {
      setPredictions(new Map());
      return;
    }

    setLoading(true);
    setError('');

    try {
      const coins = selectedCoins.map(id => {
        const coin = ALL_COINS.find(c => c.id === id);
        return { id, name: coin?.name || id };
      });

      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const predMap = new Map<string, Prediction>();
        data.data.forEach((pred: Prediction) => {
          if (pred.coinId) {
            predMap.set(pred.coinId, pred);
          }
        });
        setPredictions(predMap);
      } else {
        setError('Failed to fetch predictions');
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError('Error connecting to prediction service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCoins.length > 0) {
      fetchPredictions();
    }
  }, []);

  // Filter coins by category and search
  const filteredCoins = ALL_COINS.filter(coin => {
    const matchesCategory = categoryFilter === 'all' || coin.category === categoryFilter;
    const matchesSearch = searchQuery === '' ||
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get predictions for display
  const displayPredictions = Array.from(predictions.entries())
    .map(([, pred]) => pred)
    .filter(pred => {
      if (signalFilter === 'all') return true;
      return pred.prediction.toLowerCase() === signalFilter;
    });

  // Sort predictions
  const sortedPredictions = [...displayPredictions].sort((a, b) => {
    switch (sortBy) {
      case 'confidence_desc':
        return b.confidence - a.confidence;
      case 'confidence_asc':
        return a.confidence - b.confidence;
      case 'score_desc':
        return b.overallScore - a.overallScore;
      case 'score_asc':
        return a.overallScore - b.overallScore;
      case 'bullish_first':
        if (a.prediction === 'BULLISH' && b.prediction !== 'BULLISH') return -1;
        if (b.prediction === 'BULLISH' && a.prediction !== 'BULLISH') return 1;
        return b.confidence - a.confidence;
      case 'bearish_first':
        if (a.prediction === 'BEARISH' && b.prediction !== 'BEARISH') return -1;
        if (b.prediction === 'BEARISH' && a.prediction !== 'BEARISH') return 1;
        return b.confidence - a.confidence;
      case 'risk_asc':
        const riskOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, EXTREME: 3 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      case 'risk_desc':
        const riskOrderDesc = { LOW: 0, MEDIUM: 1, HIGH: 2, EXTREME: 3 };
        return riskOrderDesc[b.riskLevel] - riskOrderDesc[a.riskLevel];
      default:
        return 0;
    }
  });

  // Toggle coin selection
  const toggleCoin = (coinId: string) => {
    setSelectedCoins(prev =>
      prev.includes(coinId)
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId]
    );
  };

  // Select/deselect all in current filter
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCoins([]);
    } else {
      setSelectedCoins(filteredCoins.map(c => c.id));
    }
    setSelectAll(!selectAll);
  };

  // Quick select by category
  const selectCategory = (category: string) => {
    const categoryCoins = ALL_COINS
      .filter(c => c.category === category)
      .map(c => c.id);
    setSelectedCoins(prev => {
      const newSelection = [...prev];
      categoryCoins.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  // Stats calculations
  const stats = {
    total: sortedPredictions.length,
    bullish: sortedPredictions.filter(p => p.prediction === 'BULLISH').length,
    bearish: sortedPredictions.filter(p => p.prediction === 'BEARISH').length,
    neutral: sortedPredictions.filter(p => p.prediction === 'NEUTRAL').length,
    avgConfidence: sortedPredictions.length > 0
      ? Math.round(sortedPredictions.reduce((sum, p) => sum + p.confidence, 0) / sortedPredictions.length)
      : 0,
  };

  // Export predictions as CSV
  const exportCSV = () => {
    const headers = ['Coin', 'Symbol', 'Signal', 'Confidence', 'Risk', 'Overall Score', 'Technical', 'Sentiment', 'On-Chain', 'Macro', 'Reasons'];
    const rows = sortedPredictions.map(pred => {
      const coin = ALL_COINS.find(c => c.id === pred.coinId);
      return [
        coin?.name || pred.coinId,
        coin?.symbol || '',
        pred.prediction,
        pred.confidence,
        pred.riskLevel,
        pred.overallScore,
        pred.technicalScore,
        pred.sentimentScore,
        pred.onChainScore,
        pred.macroScore,
        pred.reasons.join('; '),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <FreeNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">AI Prediction Center</h1>
          </div>
          <p className="text-gray-400">
            Get AI-powered predictions for any cryptocurrency. Select coins below to generate predictions.
          </p>
        </div>

        {/* Disclaimer */}
        <AIPredictionDisclaimer className="mb-6" />

        {/* Coin Selection */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Select Coins ({selectedCoins.length} selected)
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
              >
                {selectAll ? 'Clear All' : 'Select All'}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search coins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${
                    categoryFilter === cat.id
                      ? `${cat.color} text-white`
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Category Add */}
          {showFilters && (
            <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Quick add by category:</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat.id)}
                    className={`px-3 py-1 text-xs ${cat.color} text-white rounded-lg hover:opacity-80 transition`}
                  >
                    + Add All {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coin Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {filteredCoins.map(coin => (
              <button
                key={coin.id}
                type="button"
                onClick={() => toggleCoin(coin.id)}
                className={`flex items-center gap-2 p-2 rounded-lg transition text-left ${
                  selectedCoins.includes(coin.id)
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                    : 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {selectedCoins.includes(coin.id) ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{coin.symbol}</div>
                  <div className="text-xs text-gray-500 truncate">{coin.name}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Generate Button */}
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={fetchPredictions}
              disabled={loading || selectedCoins.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Generate Predictions
                </>
              )}
            </button>
            {selectedCoins.length === 0 && (
              <span className="text-yellow-400 text-sm flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Select at least one coin
              </span>
            )}
          </div>
        </div>

        {/* Results Section */}
        {predictions.size > 0 && (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Predictions</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-emerald-400">{stats.bullish}</div>
                <div className="text-sm text-emerald-400/70">Bullish</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-red-400">{stats.bearish}</div>
                <div className="text-sm text-red-400/70">Bearish</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-yellow-400">{stats.neutral}</div>
                <div className="text-sm text-yellow-400/70">Neutral</div>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="text-2xl font-bold text-white">{stats.avgConfidence}%</div>
                <div className="text-sm text-gray-400">Avg Confidence</div>
              </div>
            </div>

            {/* Sort & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-gray-400 text-sm">Sort by:</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  aria-label="Sort predictions by"
                  title="Sort predictions by"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Filter:</span>
                {SIGNAL_FILTERS.map(filter => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSignalFilter(filter.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      signalFilter === filter.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <button
                type="button"
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {/* Predictions Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPredictions.map(pred => {
                const coin = ALL_COINS.find(c => c.id === pred.coinId);
                return (
                  <div
                    key={pred.coinId}
                    className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link
                          href={`/coin/${pred.coinId}`}
                          className="text-lg font-semibold text-white hover:text-emerald-400 transition"
                        >
                          {coin?.name || pred.coinName}
                        </Link>
                        <div className="text-sm text-gray-400">{coin?.symbol}</div>
                      </div>
                      <PredictionSignalBadge prediction={pred.prediction} confidence={pred.confidence} />
                    </div>

                    {/* Risk & Score */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">Risk:</span>
                        <RiskBadge level={pred.riskLevel} />
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-400">Score: </span>
                        <span className={`font-semibold ${
                          pred.overallScore >= 60 ? 'text-emerald-400' :
                          pred.overallScore <= 40 ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {pred.overallScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="space-y-1 mb-3">
                      <ScoreBar score={pred.technicalScore} label="Technical" />
                      <ScoreBar score={pred.sentimentScore} label="Sentiment" />
                      <ScoreBar score={pred.onChainScore} label="On-Chain" />
                      <ScoreBar score={pred.macroScore} label="Macro" />
                    </div>

                    {/* Reasons */}
                    {pred.reasons.length > 0 && (
                      <div className="border-t border-gray-700 pt-3">
                        <div className="text-xs text-gray-500 mb-1">Key Factors:</div>
                        <ul className="space-y-1">
                          {pred.reasons.slice(0, 2).map((reason, idx) => (
                            <li key={idx} className="text-xs text-gray-400 flex items-start gap-1">
                              <Activity className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* View Details Link */}
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <Link
                        href={`/coin/${pred.coinId}`}
                        className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        View Full Analysis
                        <ChevronDown className="w-4 h-4 -rotate-90" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty State */}
        {predictions.size === 0 && !loading && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
            <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Predictions Yet</h3>
            <p className="text-gray-400 mb-4">
              Select coins above and click &quot;Generate Predictions&quot; to get AI-powered market analysis.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
            <RefreshCw className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-white mb-2">Generating Predictions...</h3>
            <p className="text-gray-400">
              Analyzing {selectedCoins.length} coins across technical, sentiment, on-chain, and macro factors.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          Predictions are updated every 6 hours. Data sources: CoinGecko, Alternative.me, DeFiLlama.
        </div>
      </div>
    </div>
  );
}
