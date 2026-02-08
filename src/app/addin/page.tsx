'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  Download,
  CheckCircle,
  Zap,
  Shield,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Database,
  ArrowRight,
  FileSpreadsheet,
  Key,
  Globe,
} from 'lucide-react';

export default function AddinPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FreeNavbar />
      <Breadcrumb />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-900 via-gray-900 to-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-6">
                <FileSpreadsheet className="w-4 h-4" />
                CRK Excel Add-in
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Live Crypto Data in Excel
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                70+ custom functions for cryptocurrency data. Get real-time prices,
                historical OHLCV, market metrics, technical indicators, and more -
                directly in your Excel spreadsheets.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/addin/setup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Download className="w-5 h-5" />
                  Install Add-in
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-sm text-gray-400">Excel Formula Bar</span>
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 w-8">A1</span>
                    <span className="text-emerald-400">=CRK.PRICE("bitcoin")</span>
                    <span className="text-gray-400 ml-auto">$97,432.15</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 w-8">A2</span>
                    <span className="text-emerald-400">=CRK.CHANGE24H("ethereum")</span>
                    <span className="text-green-400 ml-auto">+4.52%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 w-8">A3</span>
                    <span className="text-emerald-400">=CRK.MARKETCAP("solana")</span>
                    <span className="text-gray-400 ml-auto">$89.2B</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 w-8">A4</span>
                    <span className="text-emerald-400">=CRK.RSI("bitcoin", 14)</span>
                    <span className="text-yellow-400 ml-auto">58.3</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 w-8">A5</span>
                    <span className="text-emerald-400">=CRK.FEARGREED()</span>
                    <span className="text-orange-400 ml-auto">72 (Greed)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need for Crypto Analysis
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The CRK Add-in brings professional cryptocurrency data directly into Excel
            with 70+ custom functions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Real-Time Prices
            </h3>
            <p className="text-gray-600 mb-4">
              Get live prices for 10,000+ cryptocurrencies. Supports multiple fiat currencies
              and automatic refresh.
            </p>
            <div className="text-sm font-mono text-emerald-600">
              =CRK.PRICE("bitcoin", "eur")
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Historical OHLCV
            </h3>
            <p className="text-gray-600 mb-4">
              Access historical Open, High, Low, Close, and Volume data. Perfect for
              charting and backtesting.
            </p>
            <div className="text-sm font-mono text-emerald-600">
              =CRK.OHLCV("ethereum", 90)
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Technical Indicators
            </h3>
            <p className="text-gray-600 mb-4">
              Built-in SMA, EMA, RSI, MACD, Bollinger Bands, and VWAP calculations
              for technical analysis.
            </p>
            <div className="text-sm font-mono text-emerald-600">
              =CRK.RSI("bitcoin", 14)
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Market Metrics
            </h3>
            <p className="text-gray-600 mb-4">
              Market cap, volume, supply, FDV, dominance, Fear & Greed Index,
              and global market data.
            </p>
            <div className="text-sm font-mono text-emerald-600">
              =CRK.GLOBAL("btc_dominance")
            </div>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Key className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              BYOK Architecture
            </h3>
            <p className="text-gray-600 mb-4">
              Bring Your Own Key - use your own CoinGecko API key for higher rate limits.
              Your key stays private.
            </p>
            <div className="text-sm text-gray-500">
              Works with CoinGecko Demo or Pro plans
            </div>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              DeFi & DEX Data
            </h3>
            <p className="text-gray-600 mb-4">
              Access DEX pools, DeFi TVL, Layer 1/2 metrics, and category-specific
              data like memecoins and AI tokens.
            </p>
            <div className="text-sm font-mono text-emerald-600">
              =CRK.TVL("uniswap")
            </div>
          </div>
        </div>
      </div>

      {/* Function Categories */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              70+ Custom Functions
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive cryptocurrency data at your fingertips
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Price Functions */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Price Data
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>CRK.PRICE</li>
                <li>CRK.CHANGE24H / 7D / 30D / 1Y</li>
                <li>CRK.HIGH24H / LOW24H</li>
                <li>CRK.ATH / ATL</li>
                <li>CRK.CONVERT</li>
              </ul>
            </div>

            {/* Market Functions */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Market Data
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>CRK.MARKETCAP / FDV</li>
                <li>CRK.VOLUME</li>
                <li>CRK.SUPPLY / RANK</li>
                <li>CRK.GLOBAL</li>
                <li>CRK.TRENDING</li>
              </ul>
            </div>

            {/* Historical Functions */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Historical & Charts
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>CRK.OHLCV</li>
                <li>CRK.HISTORY</li>
                <li>CRK.CHART</li>
                <li>CRK.SPARKLINE</li>
                <li>CRK.COMPARE</li>
              </ul>
            </div>

            {/* Technical Functions */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Technical Indicators
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>CRK.SMA / EMA</li>
                <li>CRK.RSI / MACD</li>
                <li>CRK.BB (Bollinger)</li>
                <li>CRK.VWAP</li>
                <li>CRK.VOLATILITY</li>
              </ul>
            </div>

            {/* DeFi Functions */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                DeFi & DEX
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>CRK.TVL</li>
                <li>CRK.POOLS</li>
                <li>CRK.POOL_INFO</li>
                <li>CRK.DEFI_GLOBAL</li>
                <li>CRK.TICKERS</li>
              </ul>
            </div>

            {/* Sentiment Functions */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Sentiment
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>CRK.FEARGREED</li>
                <li>CRK.FEARGREED_HISTORY</li>
                <li>CRK.COMPANIES</li>
                <li>CRK.TRENDING</li>
              </ul>
            </div>

            {/* Category Functions */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Categories
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>CRK.LAYER1 / LAYER2</li>
                <li>CRK.MEMECOINS</li>
                <li>CRK.AI_TOKENS</li>
                <li>CRK.GAMING</li>
                <li>CRK.RWA</li>
              </ul>
            </div>

            {/* Utility Functions */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                Utilities
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>CRK.INFO</li>
                <li>CRK.COINS_LIST</li>
                <li>CRK.CURRENCIES</li>
                <li>CRK.DCA</li>
                <li>CRK.ROI</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-8 md:p-12 border border-emerald-200">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                BYOK Privacy
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Your Keys, Your Data
              </h2>
              <p className="text-gray-600 mb-6">
                The CRK Add-in uses a true BYOK (Bring Your Own Key) architecture.
                Your CoinGecko API key is stored locally in your Excel file and
                never transmitted to our servers. All API calls go directly from
                Excel to CoinGecko.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">API key stored locally in Excel</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Direct API calls - no proxy server</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Works offline with cached data</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">No CryptoReportKit account required</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">How it works:</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-medium">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Get a CoinGecko API Key</p>
                    <p className="text-sm text-gray-600">Free Demo plan or paid Pro plan</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-medium">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Enter in CRK Taskpane</p>
                    <p className="text-sm text-gray-600">Stored securely in your workbook</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-medium">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Use CRK Functions</p>
                    <p className="text-sm text-gray-600">Data fetched directly from CoinGecko</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Install the CRK Add-in and start using live crypto data in Excel today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/addin/setup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-lg"
            >
              <Download className="w-5 h-5" />
              Install CRK Add-in
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-lg"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Browse Templates
            </Link>
          </div>
          <p className="mt-6 text-gray-400 text-sm">
            Works with Excel 2016+, Excel for Mac, and Excel Online
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 text-sm">
          © 2026 CryptoReportKit. All rights reserved.
        </p>
        <div className="flex justify-center gap-6 mt-4">
          <Link href="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-gray-500 hover:text-gray-700 text-sm">
            Terms of Service
          </Link>
          <Link href="/contact" className="text-gray-500 hover:text-gray-700 text-sm">
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
