'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FreeNavbar } from '@/components/FreeNavbar';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Plus,
  X,
  Eye,
  Settings,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';

/**
 * Report Builder Page
 *
 * Core UX for the "report-first" approach:
 * 1. User selects/customizes a report recipe
 * 2. Live preview shows what the data will look like
 * 3. Download Excel pack with embedded recipe
 * 4. Refresh in Excel via add-in
 */

// Popular coins for quick selection
const POPULAR_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'tron', symbol: 'TRX', name: 'Tron' },
];

// Predefined templates
const TEMPLATES = [
  {
    id: 'market_overview',
    name: 'Market Overview',
    description: 'Top 10 cryptocurrencies with prices, changes, and market caps',
    coins: ['bitcoin', 'ethereum', 'solana', 'ripple', 'cardano', 'avalanche-2', 'polkadot', 'dogecoin', 'chainlink', 'tron'],
    metrics: ['price', 'change_24h', 'market_cap', 'volume', 'movers'],
    movers_count: 5,
    ohlcv_days: 30,
  },
  {
    id: 'defi_dashboard',
    name: 'DeFi Dashboard',
    description: 'Leading DeFi tokens and protocol metrics',
    coins: ['uniswap', 'aave', 'chainlink', 'maker', 'compound-governance-token', 'curve-dao-token', 'lido-dao', 'pancakeswap-token'],
    metrics: ['price', 'change_24h', 'market_cap', 'movers'],
    movers_count: 5,
    ohlcv_days: 30,
  },
  {
    id: 'layer1_comparison',
    name: 'Layer 1 Comparison',
    description: 'Compare major Layer 1 blockchain tokens',
    coins: ['bitcoin', 'ethereum', 'solana', 'avalanche-2', 'cardano', 'polkadot', 'near', 'algorand'],
    metrics: ['price', 'change_24h', 'market_cap', 'ohlcv'],
    movers_count: 3,
    ohlcv_days: 90,
  },
  {
    id: 'custom',
    name: 'Custom Report',
    description: 'Build your own report from scratch',
    coins: [],
    metrics: ['price', 'change_24h', 'market_cap'],
    movers_count: 5,
    ohlcv_days: 30,
  },
];

interface PreviewData {
  prices?: Array<{
    coin: string;
    price: number;
    price_formatted: string;
    change_24h: number;
    change_24h_formatted: string;
    market_cap_formatted: string;
  }>;
  movers_up?: Array<{ coin: string; price: number; change_24h: number }>;
  movers_down?: Array<{ coin: string; price: number; change_24h: number }>;
}

export default function BuilderPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [selectedCoins, setSelectedCoins] = useState<string[]>(TEMPLATES[0].coins);
  const [coinSearch, setCoinSearch] = useState('');
  const [showCoinPicker, setShowCoinPicker] = useState(false);
  const [ohlcvDays, setOhlcvDays] = useState(30);
  const [moversCount, setMoversCount] = useState(5);
  const [includeOhlcv, setIncludeOhlcv] = useState(true);
  const [includeMovers, setIncludeMovers] = useState(true);

  // Preview state
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);

  // Load preview data
  const loadPreview = useCallback(async () => {
    if (selectedCoins.length === 0) {
      setPreviewData(null);
      return;
    }

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const recipe = {
        coins: selectedCoins.slice(0, 10), // Limit preview to 10 coins
        metrics: ['price', 'change_24h', 'market_cap', 'volume', ...(includeMovers ? ['movers'] : [])],
        currency: 'usd',
        movers_count: moversCount,
      };

      const response = await fetch('/api/v1/report/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe }),
        credentials: 'include',
      });

      if (response.status === 401) {
        setPreviewError('Sign in to see live preview');
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load preview');
      }

      const data = await response.json();
      setPreviewData(data.tables);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [selectedCoins, includeMovers, moversCount]);

  // Debounced preview loading
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPreview();
    }, 500);

    return () => clearTimeout(timer);
  }, [loadPreview]);

  // Handle template selection
  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    setSelectedTemplate(template);
    if (template.id !== 'custom') {
      setSelectedCoins(template.coins);
      setOhlcvDays(template.ohlcv_days);
      setMoversCount(template.movers_count);
      setIncludeOhlcv(template.metrics.includes('ohlcv'));
      setIncludeMovers(template.metrics.includes('movers'));
    }
  };

  // Handle coin toggle
  const toggleCoin = (coinId: string) => {
    setSelectedCoins((prev) =>
      prev.includes(coinId) ? prev.filter((c) => c !== coinId) : [...prev, coinId]
    );
    setSelectedTemplate(TEMPLATES.find((t) => t.id === 'custom')!);
  };

  // Handle download
  const handleDownload = async () => {
    if (selectedCoins.length === 0) return;

    setIsDownloading(true);

    try {
      // For now, use predefined packs or create custom
      // In production, this would generate a custom pack
      const packId = selectedTemplate.id === 'custom' ? 'market_overview' : selectedTemplate.id;

      const response = await fetch(`/api/v1/packs/${packId}`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/login?redirect=/builder');
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate.name.replace(/\s+/g, '-')}-CRK-Pack.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <FreeNavbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Report Builder</h1>
          <p className="text-gray-400">
            Build a custom crypto report, preview the data, and download as an Excel pack
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-500" />
                Choose Template
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedTemplate.id === template.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className="font-medium text-white mb-1">{template.name}</div>
                    <div className="text-xs text-gray-400">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Coin Selection */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Selected Coins ({selectedCoins.length})
                </h2>
                <button
                  onClick={() => setShowCoinPicker(!showCoinPicker)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Coins
                </button>
              </div>

              {/* Selected coins list */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCoins.map((coinId) => {
                  const coin = POPULAR_COINS.find((c) => c.id === coinId);
                  return (
                    <span
                      key={coinId}
                      className="px-3 py-1.5 bg-gray-700 rounded-full text-sm text-white flex items-center gap-2"
                    >
                      {coin?.symbol || coinId}
                      <button
                        onClick={() => toggleCoin(coinId)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {selectedCoins.length === 0 && (
                  <span className="text-gray-500 text-sm">No coins selected</span>
                )}
              </div>

              {/* Coin picker */}
              {showCoinPicker && (
                <div className="border-t border-gray-700 pt-4">
                  <input
                    type="text"
                    value={coinSearch}
                    onChange={(e) => setCoinSearch(e.target.value)}
                    placeholder="Search coins..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 mb-3"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {POPULAR_COINS.filter(
                      (coin) =>
                        coin.name.toLowerCase().includes(coinSearch.toLowerCase()) ||
                        coin.symbol.toLowerCase().includes(coinSearch.toLowerCase())
                    ).map((coin) => (
                      <button
                        key={coin.id}
                        onClick={() => toggleCoin(coin.id)}
                        className={`px-3 py-2 rounded-lg text-sm text-left transition-all ${
                          selectedCoins.includes(coin.id)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <span className="font-medium">{coin.symbol}</span>
                        <span className="text-xs opacity-70 ml-1">{coin.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Report Options */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Report Options</h2>

              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-gray-300">Include Price History (OHLCV)</span>
                  <input
                    type="checkbox"
                    checked={includeOhlcv}
                    onChange={(e) => setIncludeOhlcv(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>

                {includeOhlcv && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      History Days
                    </label>
                    <select
                      value={ohlcvDays}
                      onChange={(e) => setOhlcvDays(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value={7}>7 days</option>
                      <option value={30}>30 days</option>
                      <option value={90}>90 days</option>
                      <option value={365}>1 year</option>
                    </select>
                  </div>
                )}

                <label className="flex items-center justify-between">
                  <span className="text-gray-300">Include Top Movers</span>
                  <input
                    type="checkbox"
                    checked={includeMovers}
                    onChange={(e) => setIncludeMovers(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>

                {includeMovers && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Number of Movers
                    </label>
                    <select
                      value={moversCount}
                      onChange={(e) => setMoversCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value={3}>Top 3</option>
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading || selectedCoins.length === 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Pack...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Excel Pack
                </>
              )}
            </button>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-500" />
                  Live Preview
                </h2>
                <button
                  onClick={loadPreview}
                  disabled={isLoadingPreview}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="p-6">
                {previewError ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">{previewError}</p>
                    {previewError.includes('Sign in') && (
                      <Link
                        href="/login?redirect=/builder"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium"
                      >
                        Sign In
                      </Link>
                    )}
                  </div>
                ) : isLoadingPreview ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
                    <p className="text-gray-400">Loading preview...</p>
                  </div>
                ) : previewData?.prices ? (
                  <div className="space-y-6">
                    {/* Price Table */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-3">Market Data</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-2 text-gray-400 font-medium">Coin</th>
                              <th className="text-right py-2 text-gray-400 font-medium">Price</th>
                              <th className="text-right py-2 text-gray-400 font-medium">24h</th>
                              <th className="text-right py-2 text-gray-400 font-medium">MCap</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.prices.slice(0, 10).map((coin, i) => (
                              <tr key={i} className="border-b border-gray-700/50">
                                <td className="py-2 text-white font-medium uppercase">
                                  {coin.coin}
                                </td>
                                <td className="py-2 text-right text-white">
                                  {coin.price_formatted}
                                </td>
                                <td
                                  className={`py-2 text-right ${
                                    coin.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}
                                >
                                  {coin.change_24h_formatted}
                                </td>
                                <td className="py-2 text-right text-gray-400">
                                  {coin.market_cap_formatted}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Movers */}
                    {(previewData.movers_up || previewData.movers_down) && (
                      <div className="grid grid-cols-2 gap-4">
                        {previewData.movers_up && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              Top Gainers
                            </h3>
                            <div className="space-y-2">
                              {previewData.movers_up.slice(0, moversCount).map((mover, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-white uppercase">{mover.coin}</span>
                                  <span className="text-green-400">
                                    +{mover.change_24h.toFixed(2)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {previewData.movers_down && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-1">
                              <TrendingDown className="w-4 h-4 text-red-500" />
                              Top Losers
                            </h3>
                            <div className="space-y-2">
                              {previewData.movers_down.slice(0, moversCount).map((mover, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-white uppercase">{mover.coin}</span>
                                  <span className="text-red-400">
                                    {mover.change_24h.toFixed(2)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select coins to see preview
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-6">
              <h3 className="font-semibold text-emerald-400 mb-3">How to Use</h3>
              <ol className="space-y-2 text-sm text-emerald-300/80">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  Choose a template or build a custom report
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  Review the live preview to verify your selection
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  Download the Excel pack to your computer
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  Open in Excel, install the CRK Add-in, and click Refresh
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
