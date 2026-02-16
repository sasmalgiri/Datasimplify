'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import StickySignupButton from '@/components/StickySignupButton';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  Download, ArrowRight, BarChart3, Brain,
  Shield, Zap, Layout, TrendingUp, Wallet, FileSpreadsheet,
  Eye, Lock, ChevronRight, Check, Sparkles, Globe, Sun, Moon,
  PieChart, Activity, Target, LineChart, Layers, Cpu,
} from 'lucide-react';

/* ─── Dashboard Preview Tiles ─── */
const DASHBOARD_PREVIEWS = [
  { icon: '📊', name: 'Market Overview', widgets: 14, tier: 'free' },
  { icon: '₿', name: 'Bitcoin Dashboard', widgets: 10, tier: 'free' },
  { icon: '💼', name: 'Portfolio Overview', widgets: 12, tier: 'free' },
  { icon: 'Ξ', name: 'Ethereum Dashboard', widgets: 10, tier: 'free' },
  { icon: '🔥', name: 'Altcoin Radar', widgets: 11, tier: 'free' },
  { icon: '🏗️', name: 'Sector Analysis', widgets: 10, tier: 'free' },
  { icon: '📋', name: 'Executive Summary', widgets: 12, tier: 'free' },
  { icon: '🏛️', name: 'Layer 1 Comparison', widgets: 12, tier: 'free' },
  { icon: '📈', name: 'DeFi Tracker', widgets: 10, tier: 'pro' },
  { icon: '⚡', name: 'Trader Dashboard', widgets: 12, tier: 'pro' },
  { icon: '⚠️', name: 'Risk & Volatility', widgets: 10, tier: 'pro' },
  { icon: '🐋', name: 'Whale Watch', widgets: 8, tier: 'pro' },
  { icon: '🔬', name: 'Technical Analysis', widgets: 10, tier: 'pro' },
  { icon: '🎯', name: 'Technical Screener', widgets: 8, tier: 'pro' },
  { icon: '📊', name: 'Correlation Matrix', widgets: 8, tier: 'pro' },
  { icon: '🎮', name: 'NFT & Gaming', widgets: 8, tier: 'pro' },
];

/* ─── Intelligence Features ─── */
const INTELLIGENCE_FEATURES = [
  {
    icon: Activity,
    name: 'CryptoHealthScore',
    description: 'Composite health rating combining market cap, volume, volatility, and momentum into a single 0-100 score',
    color: 'text-emerald-400',
    bg: 'from-emerald-500/20 to-emerald-600/5',
  },
  {
    icon: Target,
    name: 'SmartSignal',
    description: 'Algorithmic buy/sell/hold signals based on RSI, moving averages, volume trends, and momentum indicators',
    color: 'text-blue-400',
    bg: 'from-blue-500/20 to-blue-600/5',
  },
  {
    icon: Shield,
    name: 'RiskRadar',
    description: 'Real-time risk assessment using volatility, drawdown, and Sharpe ratio to gauge portfolio danger levels',
    color: 'text-amber-400',
    bg: 'from-amber-500/20 to-amber-600/5',
  },
  {
    icon: Sparkles,
    name: 'AlphaFinder',
    description: 'Surfaces hidden opportunities — coins with unusual volume spikes, breakout patterns, or undervalued metrics',
    color: 'text-purple-400',
    bg: 'from-purple-500/20 to-purple-600/5',
  },
  {
    icon: LineChart,
    name: 'VolatilityForecast',
    description: 'Predicts short-term volatility ranges using historical patterns and current market conditions',
    color: 'text-rose-400',
    bg: 'from-rose-500/20 to-rose-600/5',
  },
  {
    icon: Brain,
    name: 'MarketBrief',
    description: 'AI-generated market summary covering key movements, sector rotations, and notable events',
    color: 'text-cyan-400',
    bg: 'from-cyan-500/20 to-cyan-600/5',
  },
  {
    icon: PieChart,
    name: 'SectorRotation',
    description: 'Tracks money flow between crypto sectors — DeFi, L1s, meme coins, AI tokens — to spot emerging trends',
    color: 'text-orange-400',
    bg: 'from-orange-500/20 to-orange-600/5',
  },
  {
    icon: Layers,
    name: 'MoneyFlowIndex',
    description: 'Volume-weighted momentum indicator showing buying vs selling pressure across top assets',
    color: 'text-indigo-400',
    bg: 'from-indigo-500/20 to-indigo-600/5',
  },
];

/* ─── Competitor Comparison ─── */
const COMPARISON_ROWS = [
  { feature: 'Live interactive dashboards', crk: true, others: 'Limited or none' },
  { feature: 'Dashboard widgets', crk: '63+', others: '5-15' },
  { feature: 'Smart intelligence widgets', crk: '8 built-in', others: 'Basic alerts only' },
  { feature: 'Excel add-in with custom functions', crk: '85+ functions', others: 'CSV export only' },
  { feature: 'BYOK — your keys stay local', crk: true, others: 'Keys stored on their servers' },
  { feature: 'Dark + Light Blue themes', crk: true, others: 'Single theme' },
  { feature: 'Price alerts with email', crk: true, others: 'Pro only ($29+/mo)' },
  { feature: 'Portfolio & tax tracking', crk: true, others: 'Separate paid tool' },
  { feature: 'Starting price', crk: '$0 free / $9 pro', others: '$19-49/mo' },
];

export default function LandingPage() {
  const [showAllDashboards, setShowAllDashboards] = useState(false);
  const visibleDashboards = showAllDashboards ? DASHBOARD_PREVIEWS : DASHBOARD_PREVIEWS.slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />
      <StickySignupButton />

      {/* ═══════ HERO ═══════ */}
      <section className="pt-16 pb-12 px-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/[0.07] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            32+ Live Dashboards &middot; 63+ Widgets &middot; 85+ Excel Functions
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              The Complete Crypto
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Analytics Toolkit
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Live dashboards, smart intelligence widgets, Excel add-in with 85+ functions — all powered by{' '}
            <span className="text-white font-medium">your own API key</span>. Privacy-first. No data leaves your browser.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link
              href="/live-dashboards"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl font-semibold text-base shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02]"
            >
              <Layout className="w-5 h-5" />
              Explore Live Dashboards
            </Link>
            <Link
              href="/downloads"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] rounded-xl font-semibold text-base transition-all hover:border-white/[0.2]"
            >
              <Download className="w-5 h-5" />
              Excel Templates
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-gray-500 text-xs">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> BYOK — Keys never leave your device</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-blue-400" /> Powered by CoinGecko API</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Free tier available</span>
          </div>
        </div>
      </section>

      {/* ═══════ STATS STRIP ═══════ */}
      <section className="py-8 border-y border-gray-800/80 bg-gray-800/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">32+</div>
              <div className="text-gray-400 text-sm mt-1">Live Dashboards</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400">63+</div>
              <div className="text-gray-400 text-sm mt-1">Dashboard Widgets</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-400">85+</div>
              <div className="text-gray-400 text-sm mt-1">Excel Functions</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-amber-400">12</div>
              <div className="text-gray-400 text-sm mt-1">Widget Categories</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ LIVE DASHBOARDS SHOWCASE ═══════ */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
              <Layout className="w-3.5 h-3.5" />
              INTERACTIVE DASHBOARDS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              32+ Live Dashboards, <span className="text-emerald-400">Real-Time Data</span>
            </h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto">
              Beautiful interactive dashboards with candlestick charts, treemaps, heatmaps, radar plots, and more.
              13 dashboards free — no credit card needed.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {visibleDashboards.map((d) => (
              <Link
                key={d.name}
                href="/live-dashboards"
                className="group bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700/50 hover:border-emerald-500/30 rounded-xl p-4 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{d.icon}</span>
                  {d.tier === 'pro' && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full font-medium">PRO</span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{d.name}</h3>
                <p className="text-[11px] text-gray-500 mt-1">{d.widgets} widgets</p>
              </Link>
            ))}
          </div>

          {!showAllDashboards && DASHBOARD_PREVIEWS.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllDashboards(true)}
              className="mt-4 mx-auto flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
            >
              +{DASHBOARD_PREVIEWS.length - 8} more dashboards
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <div className="text-center mt-8">
            <Link
              href="/live-dashboards"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] hover:border-emerald-500/30 rounded-xl text-sm font-medium transition-all"
            >
              View All Dashboards <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ INTELLIGENCE FEATURES ═══════ */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-800/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
              <Brain className="w-3.5 h-3.5" />
              SMART ANALYTICS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              8 Intelligence Widgets <span className="text-purple-400">Built In</span>
            </h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto">
              From health scores to alpha detection — advanced algorithmic analytics that work inside every dashboard, powered by your data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INTELLIGENCE_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.name}
                  className={`bg-gradient-to-br ${f.bg} border border-gray-700/40 rounded-xl p-5 hover:border-gray-600/60 transition-all duration-200`}
                >
                  <Icon className={`w-6 h-6 ${f.color} mb-3`} />
                  <h3 className="text-sm font-bold text-white mb-1.5">{f.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ EXCEL ADD-IN + FEATURES ═══════ */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              EXCEL ADD-IN
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              85+ Functions <span className="text-emerald-400">Right in Excel</span>
            </h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto">
              Professional-grade crypto analysis inside Excel. Portfolio tracking, tax calculations, price alerts, and live data — all from custom functions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: TrendingUp,
                title: 'Live Market Data',
                desc: 'CRK.PRICE, CRK.MARKETCAP, CRK.VOLUME, CRK.ATH, and 30+ more functions pulling real-time data from CoinGecko',
                color: 'text-emerald-400',
              },
              {
                icon: Wallet,
                title: 'Portfolio & Tax',
                desc: 'Track holdings, calculate FIFO/LIFO/AVG cost basis, realized gains, and generate tax summaries — all in spreadsheet formulas',
                color: 'text-blue-400',
              },
              {
                icon: Brain,
                title: 'Alerts & Notifications',
                desc: 'Set price alerts with email notifications for any coin. Get notified when prices cross your target levels',
                color: 'text-purple-400',
              },
              {
                icon: BarChart3,
                title: 'Technical Indicators',
                desc: 'RSI, moving averages, Sharpe ratio, volatility, momentum, max drawdown — built-in technical analysis functions',
                color: 'text-amber-400',
              },
              {
                icon: Wallet,
                title: 'Wallet & Exchange',
                desc: 'Check ETH/BSC/Polygon wallet balances and Binance/Coinbase exchange balances directly from Excel formulas',
                color: 'text-cyan-400',
              },
              {
                icon: FileSpreadsheet,
                title: '11 Ready Templates',
                desc: 'Market Overview, Watchlist, Screener, Portfolio, Correlation Matrix, Risk Dashboard — download and start analyzing',
                color: 'text-rose-400',
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/60 transition-all"
                >
                  <Icon className={`w-5 h-5 ${f.color} mb-3`} />
                  <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/downloads"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] hover:border-emerald-500/30 rounded-xl text-sm font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              Download Excel Templates <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ CUSTOMIZATION & THEMES ═══════ */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-800/30 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Fully <span className="text-blue-400">Customizable</span>
            </h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto">
              Toggle any widget on or off, choose from 5 color themes, switch between Dark and Light Blue modes, and organize by 12 categories.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mx-auto mb-3">
                <Moon className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Dark Mode</h3>
              <p className="text-xs text-gray-500">Premium glassmorphism with neon accents</p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-3">
                <Sun className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Light Blue Mode</h3>
              <p className="text-xs text-gray-500">Clean, bright, blue-tinted interface</p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">5 Color Themes</h3>
              <p className="text-xs text-gray-500">Emerald, Blue, Purple, Amber, Rose</p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-3">
                <Cpu className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">12 Categories</h3>
              <p className="text-xs text-gray-500">Intelligence, Analytics, Sentiment, and more</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ WHY CRK — COMPARISON TABLE ═══════ */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Why <span className="text-emerald-400">CryptoReportKit</span>?
            </h2>
            <p className="text-gray-400 text-base max-w-xl mx-auto">
              More features, lower cost, and your API keys never leave your device.
            </p>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-3 bg-gray-800/60 border-b border-gray-700/50 px-5 py-3 text-sm font-semibold">
              <div className="text-gray-400">Feature</div>
              <div className="text-emerald-400 text-center">CryptoReportKit</div>
              <div className="text-gray-500 text-center">Others</div>
            </div>

            {/* Table rows */}
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 px-5 py-3 text-sm ${i < COMPARISON_ROWS.length - 1 ? 'border-b border-gray-700/30' : ''}`}
              >
                <div className="text-gray-300">{row.feature}</div>
                <div className="text-center">
                  {row.crk === true ? (
                    <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                  ) : (
                    <span className="text-emerald-400 font-medium">{row.crk}</span>
                  )}
                </div>
                <div className="text-center">
                  {row.others === 'Limited or none' || row.others === 'Single theme' || row.others === 'CSV export only' ? (
                    <span className="text-gray-500 text-xs">{row.others}</span>
                  ) : row.others.includes('stored on') || row.others.includes('Separate') ? (
                    <span className="text-red-400/70 text-xs">{row.others}</span>
                  ) : (
                    <span className="text-gray-500 text-xs">{row.others}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ BYOK TRUST SECTION ═══════ */}
      <section className="py-12 px-4 bg-gradient-to-b from-gray-800/30 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
            <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">BYOK — Bring Your Own Key</h3>
            <p className="text-gray-400 text-sm max-w-lg mx-auto leading-relaxed mb-4">
              Your CoinGecko API key stays in your browser and Excel file. We never see, store, or transmit it.
              All data requests go directly from your device to CoinGecko. Zero middlemen.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400">
                <Lock className="w-3 h-3" /> Key stored locally
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400">
                <Globe className="w-3 h-3" /> Direct API calls
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400">
                <Eye className="w-3 h-3" /> No data collection
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      {isFeatureEnabled('pricing') && (
        <section id="pricing" className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Simple, <span className="text-blue-400">Transparent</span> Pricing
              </h2>
              <p className="text-gray-400 text-base">Start free. Upgrade when you need more power.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
                <div className="text-sm text-gray-400 font-medium mb-1">Free</div>
                <div className="text-4xl font-bold mb-1">$0</div>
                <div className="text-xs text-gray-500 mb-5">Forever free, no credit card</div>

                <ul className="space-y-2.5 text-sm text-gray-300 mb-6">
                  {[
                    '13 live dashboards',
                    '5 widgets per dashboard',
                    '2-coin compare',
                    '3 downloads/month',
                    '30-day price history',
                    'Basic chart types',
                    'Learn + Glossary',
                    'Contract verification',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="block text-center py-2.5 border border-gray-600 hover:border-gray-500 rounded-xl text-sm font-medium transition-colors"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Pro */}
              <div className="bg-gradient-to-b from-emerald-500/10 to-blue-500/10 border-2 border-emerald-500/60 rounded-2xl p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-xs font-bold px-3 py-1 rounded-full text-black">
                  BEST VALUE
                </div>

                <div className="text-sm text-emerald-400 font-medium mb-1">Pro</div>
                <div className="text-4xl font-bold mb-1">$9<span className="text-base text-gray-400 font-normal">/mo</span></div>
                <div className="text-xs text-gray-500 mb-5">$90/year (save 17%)</div>

                <ul className="space-y-2.5 text-sm text-gray-300 mb-6">
                  {[
                    'All 32+ dashboards',
                    'All 63+ widgets unlocked',
                    '8 intelligence features',
                    '300 downloads/month',
                    '10-coin compare + head-to-head',
                    'Full price history (all timeframes)',
                    'Technical indicators & screeners',
                    'Smart intelligence widgets',
                    'Price alerts with email',
                    'Portfolio & tax tracking',
                    'Wallet & exchange balances',
                    'All template packs',
                    'Priority email support',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup?plan=pro"
                  className="block text-center py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-semibold transition-colors"
                >
                  Get Pro
                </Link>

                <p className="text-center text-[10px] text-gray-500 mt-3">30-day money-back guarantee</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ CTA ═══════ */}
      <section className="py-16 px-4 bg-gradient-to-r from-emerald-600/10 via-blue-600/10 to-purple-600/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Analyzing Crypto <span className="text-emerald-400">Today</span>
          </h2>
          <p className="text-gray-400 text-base mb-8 max-w-lg mx-auto">
            32+ dashboards, 63+ widgets, 85+ Excel functions. Free to start, powerful enough for professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/live-dashboards"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl font-semibold text-base shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02]"
            >
              <Layout className="w-5 h-5" />
              Explore Dashboards
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] rounded-xl font-semibold text-base transition-all"
            >
              View Pricing <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <span className="font-bold">CryptoReportKit</span>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-gray-400 text-sm">
              <Link href="/live-dashboards" className="hover:text-white transition">Dashboards</Link>
              <Link href="/downloads" className="hover:text-white transition">Templates</Link>
              <Link href="/compare" className="hover:text-white transition">Compare</Link>
              <Link href="/learn" className="hover:text-white transition">Learn</Link>
              <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-gray-500 text-xs">
              <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms</Link>
              <Link href="/refund" className="hover:text-white transition">Refund</Link>
              <Link href="/contact" className="hover:text-white transition">Contact</Link>
            </div>
          </div>

          <p className="text-gray-600 text-xs text-center">
            &copy; 2026 CryptoReportKit. Research and education tool. Not financial advice. DYOR.
          </p>
        </div>
      </footer>
    </div>
  );
}
