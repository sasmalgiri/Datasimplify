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
} from 'lucide-react';

type DashboardType =
  | 'market-overview'
  | 'portfolio-tracker'
  | 'technical-analysis'
  | 'defi-dashboard'
  | 'fear-greed'
  | 'gainers-losers'
  | 'trending'
  | 'custom';

interface DashboardOption {
  id: DashboardType;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const dashboards: DashboardOption[] = [
  {
    id: 'market-overview',
    name: 'Market Overview',
    description: 'Complete crypto market snapshot with top coins and global stats',
    icon: <BarChart3 className="w-6 h-6" />,
    features: ['Top 100 Coins', 'Global Market Stats', 'BTC/ETH Dominance', 'Auto-refresh'],
  },
  {
    id: 'portfolio-tracker',
    name: 'Portfolio Tracker',
    description: 'Track your crypto holdings with live prices and P/L calculations',
    icon: <Wallet className="w-6 h-6" />,
    features: ['Holdings Tracking', 'P/L Calculations', 'ATH Comparison', 'Multi-coin Support'],
  },
  {
    id: 'technical-analysis',
    name: 'Technical Analysis',
    description: 'OHLC charts and technical indicators for any coin',
    icon: <LineChart className="w-6 h-6" />,
    features: ['30-day OHLC Data', 'SMA/EMA Indicators', 'Price Trends', 'ATH/ATL Analysis'],
  },
  {
    id: 'fear-greed',
    name: 'Fear & Greed Index',
    description: 'Market sentiment analysis with historical data',
    icon: <Gauge className="w-6 h-6" />,
    features: ['30-day History', 'Sentiment Classification', 'Trend Analysis', 'Statistics'],
  },
  {
    id: 'gainers-losers',
    name: 'Gainers & Losers',
    description: 'Top performing and worst performing coins in 24h',
    icon: <TrendingUp className="w-6 h-6" />,
    features: ['Top 20 Gainers', 'Top 20 Losers', 'Price Changes', 'Quick Scan'],
  },
  {
    id: 'trending',
    name: 'Trending Coins',
    description: 'Currently trending cryptocurrencies',
    icon: <Sparkles className="w-6 h-6" />,
    features: ['Trending Now', 'Market Cap Rank', 'Social Buzz', 'Discovery'],
  },
  {
    id: 'defi-dashboard',
    name: 'DeFi Dashboard',
    description: 'Top DeFi protocols by market cap',
    icon: <Activity className="w-6 h-6" />,
    features: ['Top 50 DeFi', 'TVL Data', 'Price Tracking', 'Protocol Rankings'],
  },
  {
    id: 'custom',
    name: 'Custom Watchlist',
    description: 'Build your own dashboard with selected coins',
    icon: <BarChart3 className="w-6 h-6" />,
    features: ['Choose Your Coins', 'Full Metrics', 'Personal Watchlist', 'Flexible'],
  },
];

const popularCoins = [
  'bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot', 'avalanche-2',
  'chainlink', 'polygon-ecosystem-token', 'uniswap', 'aave', 'maker',
  'the-graph', 'render-token', 'injective-protocol', 'sui', 'aptos',
  'dogecoin', 'shiba-inu', 'pepe', 'bonk',
];

export default function WizardPage() {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [keyType, setKeyType] = useState<'demo' | 'pro'>('demo');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [keyError, setKeyError] = useState('');
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardType | null>(null);
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['bitcoin', 'ethereum', 'solana']);
  const [coinLimit, setCoinLimit] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

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
          keyType,
          coins: selectedCoins,
          limit: coinLimit,
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
      a.download = `CRK_${selectedDashboard}_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  return (
    <div className="min-h-screen bg-gray-900">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step >= s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-20 h-1 ${
                    step > s ? 'bg-emerald-600' : 'bg-gray-700'
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
              <Key className="w-8 h-8 text-emerald-500" />
              <h1 className="text-2xl font-bold text-white">Connect Your API Key</h1>
            </div>

            <p className="text-gray-400 mb-6">
              Enter your CoinGecko API key for higher rate limits. This is optional - you can
              also use the free tier which has limited requests per minute.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CoinGecko API Key (Optional)
              </label>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setKeyValid(null);
                  }}
                  placeholder="CG-xxxxx or leave empty for free tier"
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={validateApiKey}
                  disabled={isValidatingKey || !apiKey.trim()}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition"
                >
                  {isValidatingKey ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Validate'
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

            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-white mb-2">Get a Free API Key</h3>
              <p className="text-sm text-gray-400 mb-3">
                CoinGecko offers free API keys with generous limits.
              </p>
              <a
                href="https://www.coingecko.com/en/api/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 text-sm"
              >
                Get your free CoinGecko API key →
              </a>
            </div>

            <div className="flex justify-end">
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
            <h1 className="text-2xl font-bold text-white mb-2">Choose Your Dashboard</h1>
            <p className="text-gray-400 mb-6">
              Select the type of Excel dashboard you want to generate.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {dashboards.map((dashboard) => (
                <button
                  key={dashboard.id}
                  onClick={() => setSelectedDashboard(dashboard.id)}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    selectedDashboard === dashboard.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      selectedDashboard === dashboard.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {dashboard.icon}
                    </div>
                    <h3 className="font-semibold text-white">{dashboard.name}</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{dashboard.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {dashboard.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded"
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
            <h1 className="text-2xl font-bold text-white mb-2">Configure Your Dashboard</h1>
            <p className="text-gray-400 mb-6">
              Customize your {dashboards.find(d => d.id === selectedDashboard)?.name} dashboard.
            </p>

            {/* Coin Selection for relevant dashboards */}
            {(selectedDashboard === 'portfolio-tracker' ||
              selectedDashboard === 'technical-analysis' ||
              selectedDashboard === 'custom') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Coins ({selectedCoins.length} selected)
                </label>
                <div className="flex flex-wrap gap-2 p-4 bg-gray-700/50 rounded-lg max-h-48 overflow-y-auto">
                  {popularCoins.map((coin) => (
                    <button
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

            {/* Limit selection for market overview */}
            {selectedDashboard === 'market-overview' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Coins
                </label>
                <select
                  value={coinLimit}
                  onChange={(e) => setCoinLimit(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={25}>Top 25</option>
                  <option value={50}>Top 50</option>
                  <option value={100}>Top 100</option>
                  <option value={250}>Top 250</option>
                </select>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-white mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Dashboard:</span>
                  <span className="text-white">{dashboards.find(d => d.id === selectedDashboard)?.name}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>API Key:</span>
                  <span className="text-white">{apiKey ? `${keyType} key configured` : 'Free tier'}</span>
                </div>
                {selectedCoins.length > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Coins:</span>
                    <span className="text-white">{selectedCoins.length} selected</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
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
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition"
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
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Dashboard Generated!</h1>
            <p className="text-gray-400 mb-8">
              Your Excel dashboard has been downloaded. Open it in Excel to see your live data.
            </p>

            <div className="bg-gray-700/50 rounded-lg p-6 text-left mb-8">
              <h3 className="font-medium text-white mb-4">Next Steps:</h3>
              <ol className="space-y-3 text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">1</span>
                  <span>Open the downloaded Excel file</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">2</span>
                  <span>Go to <strong className="text-white">Data</strong> tab → <strong className="text-white">Get Data</strong> → <strong className="text-white">From Web</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">3</span>
                  <span>Enter the Power Query URL from the _PowerQuery_Config sheet</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">4</span>
                  <span>Click <strong className="text-white">Refresh All</strong> to load live data</span>
                </li>
              </ol>
            </div>

            <div className="flex justify-center gap-4">
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
                onClick={() => {
                  setStep(1);
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
                View All Templates
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
