'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  ChevronRight,
  ChevronLeft,
  Key,
  Download,
  CheckCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Wallet,
  Activity,
  Gauge,
  LineChart,
  Sparkles,
  Loader2,
  Globe,
  Layers,
  PieChart,
  Flame,
  Building2,
  Coins,
  Grid3x3,
  Filter,
  Star,
  Anchor,
  Image,
  Fish,
  Link2,
  Package,
  Bitcoin,
  Gem,
  Zap,
  Dog,
  Cpu,
  Calculator,
  Target,
  Landmark,
  Bomb,
  Percent,
  Moon,
  Unlock,
  Banknote,
  MessageCircle,
  GitBranch,
  Database,
  Sprout,
  Glasses,
  Lock,
  HardHat,
  Monitor,
  RefreshCw,
} from 'lucide-react';

type DashboardType =
  | 'complete-suite'
  | 'market-overview'
  | 'portfolio-tracker'
  | 'technical-analysis'
  | 'fear-greed'
  | 'gainers-losers'
  | 'trending'
  | 'defi-dashboard'
  | 'nft-tracker'
  | 'derivatives'
  | 'whale-tracker'
  | 'on-chain'
  | 'correlation'
  | 'heatmap'
  | 'screener'
  | 'etf-tracker'
  | 'stablecoins'
  | 'exchanges'
  | 'categories'
  | 'bitcoin-dashboard'
  | 'ethereum-dashboard'
  | 'layer1-compare'
  | 'layer2-compare'
  | 'meme-coins'
  | 'ai-gaming'
  | 'calculator'
  | 'volatility'
  | 'rwa'
  | 'liquidations'
  | 'funding-rates'
  | 'altcoin-season'
  | 'token-unlocks'
  | 'staking-yields'
  | 'social-sentiment'
  | 'dev-activity'
  | 'exchange-reserves'
  | 'defi-yields'
  | 'metaverse'
  | 'privacy-coins'
  | 'mining-calc'
  | 'custom';

interface DashboardOption {
  id: DashboardType;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  category: 'featured' | 'market' | 'analysis' | 'sector' | 'trading';
  sheets: number;
}

const dashboards: DashboardOption[] = [
  // Featured
  {
    id: 'complete-suite',
    name: 'Complete Suite',
    description: 'Everything in one file - all 40 dashboards, charts, and analytics included',
    icon: <Package className="w-6 h-6" />,
    features: ['All 40 Sheets', 'Every Dashboard', 'Full Analytics', 'Best Value'],
    category: 'featured',
    sheets: 40,
  },
  // Market
  {
    id: 'market-overview',
    name: 'Market Overview',
    description: 'Complete crypto market snapshot with top coins and global stats',
    icon: <Globe className="w-6 h-6" />,
    features: ['Top 100 Coins', 'Global Stats', 'Dominance Charts', 'Auto-refresh'],
    category: 'market',
    sheets: 4,
  },
  {
    id: 'gainers-losers',
    name: 'Gainers & Losers',
    description: 'Top 25 performing and worst performing coins in 24h',
    icon: <TrendingUp className="w-6 h-6" />,
    features: ['Top 25 Gainers', 'Top 25 Losers', 'Visual Charts', 'Quick Scan'],
    category: 'market',
    sheets: 3,
  },
  {
    id: 'trending',
    name: 'Trending Coins',
    description: 'Currently trending cryptocurrencies based on search volume',
    icon: <Flame className="w-6 h-6" />,
    features: ['Trending Now', 'Social Buzz', 'Discovery', 'Momentum'],
    category: 'market',
    sheets: 2,
  },
  {
    id: 'heatmap',
    name: 'Market Heatmap',
    description: 'Visual heatmap of top 50 coins by 24h price change',
    icon: <Grid3x3 className="w-6 h-6" />,
    features: ['Color-coded', '50 Coins', 'At-a-glance View', 'Trend Spotting'],
    category: 'market',
    sheets: 2,
  },
  // Analysis
  {
    id: 'portfolio-tracker',
    name: 'Portfolio Tracker',
    description: 'Track your crypto holdings with live prices and P/L calculations',
    icon: <Wallet className="w-6 h-6" />,
    features: ['Holdings Tracking', 'P/L Calculations', 'ATH Comparison', 'Editable'],
    category: 'analysis',
    sheets: 3,
  },
  {
    id: 'technical-analysis',
    name: 'Technical Analysis',
    description: 'OHLC candlestick data and price indicators for any coin',
    icon: <LineChart className="w-6 h-6" />,
    features: ['30-day OHLC', 'Candlestick Data', 'Price Trends', 'High/Low'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'fear-greed',
    name: 'Fear & Greed Index',
    description: 'Market sentiment analysis with 90-day historical data',
    icon: <Gauge className="w-6 h-6" />,
    features: ['90-day History', 'Visual Gauge', 'Trend Analysis', 'Interpretation'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'correlation',
    name: 'Correlation Matrix',
    description: 'See how different crypto assets move together',
    icon: <Link2 className="w-6 h-6" />,
    features: ['15x15 Matrix', 'Color-coded', 'Diversification', 'Pattern Finding'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'screener',
    name: 'Crypto Screener',
    description: 'Full coin screener with Excel filters for custom analysis',
    icon: <Filter className="w-6 h-6" />,
    features: ['100 Coins', 'All Metrics', 'Excel Filters', 'Sort & Search'],
    category: 'analysis',
    sheets: 2,
  },
  // Sector
  {
    id: 'defi-dashboard',
    name: 'DeFi Dashboard',
    description: 'Top DeFi protocols with market cap and performance',
    icon: <Layers className="w-6 h-6" />,
    features: ['Top DeFi', 'TVL Metrics', 'Protocol Rankings', 'Sector Stats'],
    category: 'sector',
    sheets: 2,
  },
  {
    id: 'stablecoins',
    name: 'Stablecoins',
    description: 'Track major stablecoins and their peg accuracy',
    icon: <Coins className="w-6 h-6" />,
    features: ['Top 10 Stables', 'Peg Accuracy', 'Volume', 'Market Cap'],
    category: 'sector',
    sheets: 2,
  },
  {
    id: 'nft-tracker',
    name: 'NFT Tracker',
    description: 'Popular NFT collections across platforms',
    icon: <Image className="w-6 h-6" />,
    features: ['Top Collections', 'Multi-chain', 'Rankings', 'Discovery'],
    category: 'sector',
    sheets: 2,
  },
  {
    id: 'categories',
    name: 'Categories',
    description: 'Crypto sectors and categories performance breakdown',
    icon: <PieChart className="w-6 h-6" />,
    features: ['All Sectors', 'Market Cap', '24h Change', 'Coin Counts'],
    category: 'sector',
    sheets: 2,
  },
  // Trading
  {
    id: 'exchanges',
    name: 'Exchanges',
    description: 'Top 50 cryptocurrency exchanges by volume and trust score',
    icon: <Building2 className="w-6 h-6" />,
    features: ['50 Exchanges', 'Trust Scores', '24h Volume', 'Rankings'],
    category: 'trading',
    sheets: 2,
  },
  {
    id: 'derivatives',
    name: 'Derivatives',
    description: 'Futures and perpetuals market data',
    icon: <Activity className="w-6 h-6" />,
    features: ['Futures Data', 'Basis Info', 'Volume', 'Index Prices'],
    category: 'trading',
    sheets: 2,
  },
  {
    id: 'whale-tracker',
    name: 'Whale Tracker',
    description: 'Large transaction monitoring (requires additional integration)',
    icon: <Fish className="w-6 h-6" />,
    features: ['Big Moves', 'Exchange Flows', 'Alerts', 'Coming Soon'],
    category: 'trading',
    sheets: 2,
  },
  {
    id: 'etf-tracker',
    name: 'ETF Tracker',
    description: 'Bitcoin and crypto ETF tracking (requires premium API)',
    icon: <Anchor className="w-6 h-6" />,
    features: ['BTC ETFs', 'Flows', 'Performance', 'Premium Feature'],
    category: 'trading',
    sheets: 2,
  },
  {
    id: 'on-chain',
    name: 'On-Chain Analytics',
    description: 'Blockchain metrics and on-chain data',
    icon: <BarChart3 className="w-6 h-6" />,
    features: ['Metrics', 'Hash Rate', 'Addresses', 'Coming Soon'],
    category: 'trading',
    sheets: 2,
  },
  // Coin-specific
  {
    id: 'bitcoin-dashboard',
    name: 'Bitcoin Dashboard',
    description: 'Complete Bitcoin analysis with halving, dominance, and ATH tracking',
    icon: <Bitcoin className="w-6 h-6" />,
    features: ['BTC Analytics', 'Halving Info', 'Dominance', 'ATH Tracking'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'ethereum-dashboard',
    name: 'Ethereum Dashboard',
    description: 'ETH ecosystem analysis with DeFi stats and network metrics',
    icon: <Gem className="w-6 h-6" />,
    features: ['ETH Analytics', 'DeFi Stats', 'PoS Info', 'Gas Tracker'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'layer1-compare',
    name: 'Layer 1 Comparison',
    description: 'Compare top L1 blockchains: BTC, ETH, SOL, ADA, AVAX and more',
    icon: <Layers className="w-6 h-6" />,
    features: ['10+ L1 Chains', 'Side-by-side', 'Performance', 'Metrics'],
    category: 'sector',
    sheets: 2,
  },
  {
    id: 'layer2-compare',
    name: 'Layer 2 Comparison',
    description: 'Compare Layer 2 solutions: Arbitrum, Optimism, Polygon, zkSync',
    icon: <Zap className="w-6 h-6" />,
    features: ['L2 Scaling', 'Rollups', 'TVL Data', 'Comparison'],
    category: 'sector',
    sheets: 2,
  },
  {
    id: 'meme-coins',
    name: 'Meme Coins',
    description: 'Track popular meme tokens: DOGE, SHIB, PEPE, BONK and more',
    icon: <Dog className="w-6 h-6" />,
    features: ['Meme Tokens', 'Price Data', 'Volume', 'Trend Analysis'],
    category: 'sector',
    sheets: 2,
  },
  {
    id: 'ai-gaming',
    name: 'AI & Gaming Tokens',
    description: 'AI and gaming crypto tokens with sector analysis',
    icon: <Cpu className="w-6 h-6" />,
    features: ['AI Tokens', 'Gaming Coins', 'Sector Split', 'Performance'],
    category: 'sector',
    sheets: 2,
  },
  {
    id: 'calculator',
    name: 'Investment Calculator',
    description: 'DCA calculator, profit calculator, and price target tools',
    icon: <Calculator className="w-6 h-6" />,
    features: ['DCA Calc', 'Profit Calc', 'Price Targets', 'Editable'],
    category: 'analysis',
    sheets: 3,
  },
  {
    id: 'volatility',
    name: 'Volatility Analysis',
    description: 'Analyze price volatility with risk levels and metrics',
    icon: <Target className="w-6 h-6" />,
    features: ['24h Volatility', 'Risk Levels', 'Price Range', 'Comparison'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'rwa',
    name: 'Real World Assets',
    description: 'Track tokenized real world assets (RWA) sector',
    icon: <Landmark className="w-6 h-6" />,
    features: ['RWA Tokens', 'Tokenization', 'TradFi Bridge', 'Emerging Sector'],
    category: 'sector',
    sheets: 2,
  },
  {
    id: 'metaverse',
    name: 'Metaverse Tokens',
    description: 'Virtual worlds, gaming, and metaverse cryptocurrencies',
    icon: <Glasses className="w-6 h-6" />,
    features: ['Virtual Worlds', 'Gaming Tokens', 'Digital Land', 'NFT Gaming'],
    category: 'sector',
    sheets: 2,
  },
  {
    id: 'privacy-coins',
    name: 'Privacy Coins',
    description: 'Privacy-focused cryptocurrencies like Monero, Zcash',
    icon: <Lock className="w-6 h-6" />,
    features: ['Privacy Tech', 'Anonymity', 'Ring Signatures', 'zk-SNARKs'],
    category: 'sector',
    sheets: 2,
  },
  // Trading Tools
  {
    id: 'liquidations',
    name: 'Liquidations Tracker',
    description: 'Track potential liquidation zones and leverage risk',
    icon: <Bomb className="w-6 h-6" />,
    features: ['Liq. Zones', 'Risk Levels', 'Leverage Data', 'Alerts'],
    category: 'trading',
    sheets: 2,
  },
  {
    id: 'funding-rates',
    name: 'Funding Rates',
    description: 'Perpetual futures funding rates and trading signals',
    icon: <Percent className="w-6 h-6" />,
    features: ['Funding 8h', 'Annual APR', 'Sentiment', 'Signals'],
    category: 'trading',
    sheets: 2,
  },
  {
    id: 'altcoin-season',
    name: 'Altcoin Season Index',
    description: 'Track if it\'s Bitcoin or Altcoin season',
    icon: <Moon className="w-6 h-6" />,
    features: ['Season Index', 'BTC Dominance', 'Alt Performance', 'Timing'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'token-unlocks',
    name: 'Token Unlocks',
    description: 'Track upcoming token unlock schedules',
    icon: <Unlock className="w-6 h-6" />,
    features: ['Unlock Dates', 'Supply Impact', 'Risk Levels', 'Planning'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'staking-yields',
    name: 'Staking Yields',
    description: 'Compare PoS staking rewards across chains',
    icon: <Banknote className="w-6 h-6" />,
    features: ['APY Compare', 'Lockup Info', 'Min Stakes', 'Passive Income'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'social-sentiment',
    name: 'Social Sentiment',
    description: 'Social media buzz and sentiment analysis',
    icon: <MessageCircle className="w-6 h-6" />,
    features: ['Trend Scores', 'Sentiment', 'Social Buzz', 'Signals'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'dev-activity',
    name: 'Developer Activity',
    description: 'GitHub commits and developer metrics',
    icon: <GitBranch className="w-6 h-6" />,
    features: ['Commits', 'Contributors', 'Dev Score', 'Project Health'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'exchange-reserves',
    name: 'Exchange Reserves',
    description: 'Track crypto held on exchanges (supply indicator)',
    icon: <Database className="w-6 h-6" />,
    features: ['Reserve %', 'Trends', 'Signals', 'Supply Flow'],
    category: 'analysis',
    sheets: 2,
  },
  {
    id: 'defi-yields',
    name: 'DeFi Yields',
    description: 'Best DeFi yield farming opportunities',
    icon: <Sprout className="w-6 h-6" />,
    features: ['Top Yields', 'TVL', 'Risk Levels', 'Protocols'],
    category: 'sector',
    sheets: 2,
  },
  {
    id: 'mining-calc',
    name: 'Mining Calculator',
    description: 'Bitcoin mining profitability calculator',
    icon: <HardHat className="w-6 h-6" />,
    features: ['Hash Rate', 'Power Cost', 'Profitability', 'ROI'],
    category: 'analysis',
    sheets: 2,
  },
  // Custom
  {
    id: 'custom',
    name: 'Custom Watchlist',
    description: 'Build your own dashboard with your selected coins',
    icon: <Star className="w-6 h-6" />,
    features: ['Choose Coins', 'Full Metrics', 'Personal List', 'Flexible'],
    category: 'analysis',
    sheets: 2,
  },
];

const categories = [
  { id: 'featured', name: '⭐ Featured', description: 'Most popular choice' },
  { id: 'market', name: '📊 Market', description: 'Market-wide analytics' },
  { id: 'analysis', name: '📈 Analysis', description: 'Deep dive tools' },
  { id: 'sector', name: '🏛️ Sectors', description: 'Industry breakdown' },
  { id: 'trading', name: '💹 Trading', description: 'Trading tools' },
];

const popularCoins = [
  'bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot', 'avalanche-2',
  'chainlink', 'polygon-ecosystem-token', 'uniswap', 'aave', 'maker',
  'the-graph', 'render-token', 'injective-protocol', 'sui', 'aptos',
  'dogecoin', 'shiba-inu', 'pepe', 'bonk', 'ripple', 'binancecoin',
  'tron', 'litecoin', 'cosmos', 'near', 'optimism', 'arbitrum',
];

type OutputMode = 'static' | 'live' | 'interactive';
type RefreshInterval = 'realtime' | 'frequent' | 'hourly' | 'daily' | 'manual';
type ChartStyle = 'minimal' | 'professional' | 'colorful';

const outputModes = [
  {
    id: 'static' as OutputMode,
    name: 'Static Report',
    description: 'Beautiful snapshot with embedded charts. Best for sharing and presentations.',
    icon: '📊',
    features: ['Chart images', 'Styled cells', 'One-time data', 'PDF-ready'],
    recommended: false,
  },
  {
    id: 'live' as OutputMode,
    name: 'Live Excel',
    description: 'Auto-refreshing data with Power Query. Best for daily analysis.',
    icon: '⚡',
    features: ['Power Query', 'Auto-refresh', 'Live prices', 'Editable'],
    recommended: true,
  },
  {
    id: 'interactive' as OutputMode,
    name: 'Interactive',
    description: 'Prefetched data with embedded charts. Use our web dashboards for real-time data.',
    icon: '🚀',
    features: ['Prefetched data', 'Embedded charts', 'Styled formatting', 'Web dashboards'],
    recommended: false,
  },
];

const refreshOptions = [
  { id: 'realtime' as RefreshInterval, label: 'Real-time (5 min)', minutes: 5 },
  { id: 'frequent' as RefreshInterval, label: 'Frequent (15 min)', minutes: 15 },
  { id: 'hourly' as RefreshInterval, label: 'Hourly', minutes: 60 },
  { id: 'daily' as RefreshInterval, label: 'Daily', minutes: 1440 },
  { id: 'manual' as RefreshInterval, label: 'Manual only', minutes: 0 },
];

const chartStyles = [
  { id: 'minimal' as ChartStyle, name: 'Minimal', description: 'Clean and simple' },
  { id: 'professional' as ChartStyle, name: 'Professional', description: 'Detailed with labels' },
  { id: 'colorful' as ChartStyle, name: 'Colorful', description: 'Vibrant OtherLevel-style' },
];

export default function WizardPage() {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [keyType, setKeyType] = useState<'demo' | 'pro'>('demo');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [keyError, setKeyError] = useState('');
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardType | null>(null);
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot']);
  const [coinLimit, setCoinLimit] = useState(100);
  const [days, setDays] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('featured');
  // New output mode options
  const [outputMode, setOutputMode] = useState<OutputMode>('live');
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>('hourly');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('professional');


  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setKeyValid(null);
      return;
    }

    setIsValidatingKey(true);
    setKeyError('');

    try {
      // Determine key type based on prefix
      const isPro = apiKey.startsWith('CG-') && apiKey.length > 30;
      setKeyType(isPro ? 'pro' : 'demo');

      // Test the key with CoinGecko
      const baseUrl = isPro
        ? 'https://pro-api.coingecko.com/api/v3'
        : 'https://api.coingecko.com/api/v3';

      const headers: Record<string, string> = {};
      if (isPro) {
        headers['x-cg-pro-api-key'] = apiKey;
      } else {
        headers['x-cg-demo-api-key'] = apiKey;
      }

      const response = await fetch(`${baseUrl}/ping`, { headers });

      if (response.ok) {
        setKeyValid(true);
      } else {
        setKeyValid(false);
        setKeyError('Invalid API key. Please check and try again.');
      }
    } catch {
      setKeyValid(false);
      setKeyError('Could not validate key. Check your connection.');
    } finally {
      setIsValidatingKey(false);
    }
  };

  const generateDashboard = async () => {
    if (!selectedDashboard) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/powerquery/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboard: selectedDashboard,
          apiKey: apiKey || undefined,
          coins: selectedCoins,
          limit: coinLimit,
          days: days,
          outputMode: outputMode,
          refreshInterval: refreshInterval,
          chartStyle: chartStyle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate dashboard');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = `CryptoReportKit_${selectedDashboard}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStep(4); // Success step
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCoin = (coin: string) => {
    setSelectedCoins(prev =>
      prev.includes(coin)
        ? prev.filter(c => c !== coin)
        : [...prev, coin]
    );
  };

  const filteredDashboards = dashboards.filter(d => d.category === activeCategory);
  const selectedDashboardInfo = dashboards.find(d => d.id === selectedDashboard);

  return (
    <div className="min-h-screen bg-gray-900">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Excel Dashboard Generator
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Create professional cryptocurrency dashboards for Excel with live data,
            charts, and analytics. Works exactly like what you see on our website.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {[
            { num: 1, label: 'API Key' },
            { num: 2, label: 'Dashboard' },
            { num: 3, label: 'Configure' },
            { num: 4, label: 'Download' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step >= s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-xs mt-1 ${step >= s.num ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
              {i < 3 && (
                <div
                  className={`w-16 md:w-24 h-1 mx-2 ${
                    step > s.num ? 'bg-emerald-600' : 'bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: API Key */}
        {step === 1 && (
          <div className="bg-gray-800 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <Key className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Connect Your API Key</h2>
                <p className="text-gray-400 text-sm">Optional - skip for free tier access</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CoinGecko API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setKeyValid(null);
                    }}
                    placeholder="CG-xxxxx..."
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={validateApiKey}
                    disabled={isValidatingKey || !apiKey.trim()}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition"
                  >
                    {isValidatingKey ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </button>
                </div>

                {keyValid === true && (
                  <div className="flex items-center gap-2 mt-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Valid {keyType === 'pro' ? 'Pro' : 'Demo'} API key</span>
                  </div>
                )}

                {keyValid === false && (
                  <div className="flex items-center gap-2 mt-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{keyError}</span>
                  </div>
                )}
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-3">📋 Get a Free API Key</h3>
                <ol className="space-y-2 text-sm text-gray-400">
                  <li>1. Go to <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">coingecko.com/api/pricing</a></li>
                  <li>2. Click "Get Started" (Demo API is FREE)</li>
                  <li>3. Create account (no credit card)</li>
                  <li>4. Copy your API key</li>
                </ol>
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <p className="text-xs text-gray-500">
                    Free tier: 10,000 calls/month (plenty for personal use)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
              >
                {apiKey ? 'Continue' : 'Skip & Use Free Tier'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Dashboard */}
        {step === 2 && (
          <div className="bg-gray-800 rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-2">Choose Your Dashboard</h2>
            <p className="text-gray-400 mb-6">
              Select the type of Excel dashboard you want to generate. Each includes styled formatting,
              charts, and live data matching our website.
            </p>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeCategory === cat.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {filteredDashboards.map((dashboard) => (
                <button
                  key={dashboard.id}
                  onClick={() => setSelectedDashboard(dashboard.id)}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    selectedDashboard === dashboard.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedDashboard === dashboard.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {dashboard.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{dashboard.name}</h3>
                        <span className="text-xs text-gray-500">{dashboard.sheets} sheets</span>
                      </div>
                    </div>
                    {dashboard.id === 'complete-suite' && (
                      <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                        Best Value
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{dashboard.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dashboard.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDashboard}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Configure & Generate */}
        {step === 3 && (
          <div className="bg-gray-800 rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-2">Configure Your Dashboard</h2>
            <p className="text-gray-400 mb-6">
              Customize your <span className="text-emerald-400">{selectedDashboardInfo?.name}</span> dashboard.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Configuration Options */}
              <div className="space-y-6">
                {/* Coin Selection for relevant dashboards */}
                {(selectedDashboard === 'portfolio-tracker' ||
                  selectedDashboard === 'technical-analysis' ||
                  selectedDashboard === 'correlation' ||
                  selectedDashboard === 'custom') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Select Coins ({selectedCoins.length} selected)
                    </label>
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-700/50 rounded-lg max-h-48 overflow-y-auto">
                      {popularCoins.map((coin) => (
                        <button
                          type="button"
                          key={coin}
                          onClick={() => toggleCoin(coin)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition ${
                            selectedCoins.includes(coin)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {coin.charAt(0).toUpperCase() + coin.slice(1).replace(/-/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Limit selection */}
                {(selectedDashboard === 'market-overview' ||
                  selectedDashboard === 'screener' ||
                  selectedDashboard === 'heatmap' ||
                  selectedDashboard === 'complete-suite') && (
                  <div>
                    <label htmlFor="coin-limit" className="block text-sm font-medium text-gray-300 mb-2">
                      Number of Coins
                    </label>
                    <select
                      id="coin-limit"
                      title="Number of coins to include"
                      value={coinLimit}
                      onChange={(e) => setCoinLimit(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={25}>Top 25</option>
                      <option value={50}>Top 50</option>
                      <option value={100}>Top 100 (Recommended)</option>
                      <option value={250}>Top 250</option>
                    </select>
                  </div>
                )}

                {/* Days selection for technical analysis */}
                {(selectedDashboard === 'technical-analysis' ||
                  selectedDashboard === 'fear-greed') && (
                  <div>
                    <label htmlFor="days-period" className="block text-sm font-medium text-gray-300 mb-2">
                      Historical Data Period
                    </label>
                    <select
                      id="days-period"
                      title="Historical data period"
                      value={days}
                      onChange={(e) => setDays(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days (Recommended)</option>
                      <option value={90}>90 Days</option>
                      <option value={180}>180 Days</option>
                      <option value={365}>1 Year</option>
                    </select>
                  </div>
                )}

                {/* Output Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Output Mode
                  </label>
                  <div className="space-y-3">
                    {outputModes.map((mode) => (
                      <button
                        type="button"
                        key={mode.id}
                        onClick={() => setOutputMode(mode.id)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition ${
                          outputMode === mode.id
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{mode.icon}</span>
                            <span className="font-medium text-white">{mode.name}</span>
                          </div>
                          {mode.recommended && (
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{mode.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {mode.features.map((f) => (
                            <span key={f} className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Refresh Interval (for Live mode) */}
                {outputMode === 'live' && (
                  <div>
                    <label htmlFor="refresh-interval" className="block text-sm font-medium text-gray-300 mb-2">
                      Data Refresh Interval
                    </label>
                    <select
                      id="refresh-interval"
                      title="Data refresh interval"
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(e.target.value as RefreshInterval)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      {refreshOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Excel will automatically refresh data at this interval
                    </p>
                  </div>
                )}

                {/* Chart Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chart Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {chartStyles.map((style) => (
                      <button
                        type="button"
                        key={style.id}
                        onClick={() => setChartStyle(style.id)}
                        className={`p-3 rounded-lg border-2 text-center transition ${
                          chartStyle === style.id
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <span className="block text-sm font-medium text-white">{style.name}</span>
                        <span className="text-xs text-gray-400">{style.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Summary */}
              <div>
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="font-medium text-white mb-4">📋 Dashboard Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Dashboard:</span>
                      <span className="text-white font-medium">{selectedDashboardInfo?.name}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Sheets Included:</span>
                      <span className="text-white">{selectedDashboardInfo?.sheets} sheets</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Output Mode:</span>
                      <span className="text-emerald-400 font-medium">
                        {outputModes.find(m => m.id === outputMode)?.name}
                      </span>
                    </div>
                    {outputMode === 'live' && (
                      <div className="flex justify-between text-gray-400">
                        <span>Refresh:</span>
                        <span className="text-white">
                          {refreshOptions.find(r => r.id === refreshInterval)?.label}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-400">
                      <span>Chart Style:</span>
                      <span className="text-white">
                        {chartStyles.find(s => s.id === chartStyle)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>API Key:</span>
                      <span className={apiKey ? 'text-emerald-400' : 'text-gray-500'}>
                        {apiKey ? `${keyType} key` : 'Free tier'}
                      </span>
                    </div>
                    {coinLimit && (
                      <div className="flex justify-between text-gray-400">
                        <span>Coins:</span>
                        <span className="text-white">Top {coinLimit}</span>
                      </div>
                    )}
                    {selectedCoins.length > 0 && selectedDashboard === 'custom' && (
                      <div className="flex justify-between text-gray-400">
                        <span>Watchlist:</span>
                        <span className="text-white">{selectedCoins.length} coins</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <h4 className="text-sm font-medium text-white mb-2">What You Get:</h4>
                    <div className="space-y-2">
                      {outputMode === 'static' && (
                        <>
                          <p className="text-xs text-gray-400">📊 Beautiful charts embedded as images</p>
                          <p className="text-xs text-gray-400">🎨 Professional styling and colors</p>
                          <p className="text-xs text-gray-400">📄 Ready for PDF export or sharing</p>
                        </>
                      )}
                      {outputMode === 'live' && (
                        <>
                          <p className="text-xs text-gray-400">⚡ Power Query connections for live data</p>
                          <p className="text-xs text-gray-400">🔄 Auto-refresh at your chosen interval</p>
                          <p className="text-xs text-gray-400">📋 Setup instructions included</p>
                        </>
                      )}
                      {outputMode === 'interactive' && (
                        <>
                          <p className="text-xs text-gray-400">🚀 Prefetched data with embedded charts</p>
                          <p className="text-xs text-gray-400">🌐 Use web dashboards for real-time data</p>
                          <p className="text-xs text-gray-400">📊 Professional styling and formatting</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <p className="text-sm text-emerald-400">
                    ✨ Your Excel will match the quality shown on our website with
                    {chartStyle === 'colorful' ? ' OtherLevel-style vibrant charts' : ' professional formatting'}
                    {outputMode === 'live' ? ' and live data refresh!' : '.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={generateDashboard}
                disabled={isGenerating}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Generate & Download
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="bg-gray-800 rounded-xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Dashboard Generated! 🎉</h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                Your <span className="text-emerald-400">{selectedDashboardInfo?.name}</span> Excel dashboard
                has been downloaded. Open it in Excel to see your styled data and charts.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* What's in Your File */}
              <div className="bg-gray-700/50 rounded-lg p-6">
                <h3 className="font-medium text-white mb-4">📋 What's in Your File:</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>{selectedDashboardInfo?.sheets} professionally styled sheets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Color-coded data (green = gains, red = losses)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Visual charts and progress bars</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Live data from CoinGecko API</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Help & documentation sheet</span>
                  </li>
                </ul>
              </div>

              {/* Power Query Setup (shown for Live mode) */}
              {outputMode === 'live' && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <RefreshCw className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Enable Live Refresh</h3>
                      <p className="text-xs text-gray-400">Power Query is pre-configured</p>
                    </div>
                  </div>

                  <ol className="space-y-3 text-sm text-gray-300 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">1</span>
                      <span>Open your downloaded Excel file</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">2</span>
                      <span>Go to <strong>Data → Refresh All</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">3</span>
                      <span>See the "Power Query Setup" sheet for advanced options</span>
                    </li>
                  </ol>

                  <p className="text-xs text-gray-400">
                    ⏰ Set to refresh every {refreshOptions.find(r => r.id === refreshInterval)?.label || 'hour'}
                  </p>
                </div>
              )}

              {/* Static Report Info */}
              {outputMode === 'static' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <Monitor className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Static Report</h3>
                      <p className="text-xs text-gray-400">Ready for sharing & presentations</p>
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-400" />
                      <span>Charts embedded as images</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-400" />
                      <span>Perfect for PDF export</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-400" />
                      <span>Ready to use immediately</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-400" />
                      <span>Data snapshot from generation time</span>
                    </li>
                  </ul>

                  <p className="text-xs text-gray-400 mt-4">
                    💡 Want live data? Go back and select "Live Excel" mode, or use our web dashboards.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
                >
                  <Download className="w-5 h-5" />
                  Download Again
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setSelectedDashboard(null);
                  setDownloadUrl(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Create Another
              </button>
              <Link
                href="/templates"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                View Templates
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
