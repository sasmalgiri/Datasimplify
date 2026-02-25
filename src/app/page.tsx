'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import StickySignupButton from '@/components/StickySignupButton';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { IS_BETA_MODE } from '@/lib/betaMode';
import {
  ArrowRight, Brain,
  Shield, Zap, Layout, TrendingUp,
  Eye, Lock, ChevronRight, Check, Sparkles, Globe, Sun, Moon,
  PieChart, Activity, Target, LineChart, Layers, Cpu,
  Calculator, Repeat, Search, BarChart2, ArrowLeftRight, Hammer,
  Key, MessageSquare, ChevronDown,
} from 'lucide-react';

/* ─── Dashboard Preview Tiles (24 showcased out of 83+) ─── */
const DASHBOARD_PREVIEWS = [
  // Free dashboards — show the best first
  { icon: '📊', name: 'Market Overview', widgets: 14, tier: 'free' },
  { icon: '₿', name: 'Bitcoin Dashboard', widgets: 10, tier: 'free' },
  { icon: '👑', name: 'BTC Dominance & Altseason Timer', widgets: 10, tier: 'free' },
  { icon: '📊', name: 'Market Breadth', widgets: 10, tier: 'free' },
  { icon: '⚖️', name: 'ETH/BTC Ratio Tracker', widgets: 10, tier: 'free' },
  { icon: '🛡️', name: 'Bear Market Survival Kit', widgets: 10, tier: 'free' },
  { icon: '📈', name: 'Crypto Indices', widgets: 9, tier: 'free' },
  { icon: '🔄', name: 'BTC Cycle Comparison', widgets: 7, tier: 'free' },
  { icon: '💵', name: 'Stablecoin Capital Monitor', widgets: 8, tier: 'free' },
  { icon: '🌉', name: 'Multi-Chain Bridge Monitor', widgets: 7, tier: 'free' },
  // Pro dashboards — highlight the most exciting
  { icon: '🚦', name: 'Risk-On / Risk-Off Regime', widgets: 9, tier: 'pro' },
  { icon: '🎯', name: 'Accumulation Zone Finder', widgets: 9, tier: 'pro' },
  { icon: '💎', name: 'Micro-Cap Gems Scanner', widgets: 9, tier: 'pro' },
  { icon: '🐋', name: 'Whale Accumulation Radar', widgets: 10, tier: 'pro' },
  { icon: '🔍', name: 'Divergence Spotter', widgets: 10, tier: 'pro' },
  { icon: '🧬', name: 'Sector Alpha Generator', widgets: 9, tier: 'pro' },
  { icon: '💹', name: 'P&L Tracker', widgets: 6, tier: 'pro' },
  { icon: '💰', name: 'Funding Rate Arbitrage', widgets: 8, tier: 'pro' },
  { icon: '🐸', name: 'Meme Coin Momentum', widgets: 8, tier: 'pro' },
  { icon: '🤖', name: 'AI Token Intelligence', widgets: 7, tier: 'pro' },
  { icon: '📐', name: 'Volatility Regime & Sizing', widgets: 10, tier: 'pro' },
  { icon: '🏛️', name: 'Exchange Portfolio', widgets: 5, tier: 'pro' },
  { icon: '🏆', name: 'Copy Trading Leaderboard', widgets: 9, tier: 'pro' },
  { icon: '🌾', name: 'DeFi Yield Explorer', widgets: 8, tier: 'pro' },
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

/* ─── Pro Tools (new features) ─── */
const PRO_TOOLS = [
  {
    icon: Hammer,
    name: 'Custom Dashboard Builder',
    description: 'Build your own dashboards from 90+ widgets — pick, arrange, save, and share. Your data layout, your way.',
    color: 'text-emerald-400',
    bg: 'from-emerald-500/20 to-emerald-600/5',
    tier: 'pro',
  },
  {
    icon: Calculator,
    name: 'Tax Report Export',
    description: 'Input trades, calculate FIFO/LIFO/AVG cost basis, view realized gains by short/long-term, and export Form 8949 CSV.',
    color: 'text-blue-400',
    bg: 'from-blue-500/20 to-blue-600/5',
    tier: 'pro',
  },
  {
    icon: Repeat,
    name: 'DCA Tracker & Simulator',
    description: 'Simulate "what if you DCA\'d $X/week since DATE" with charts — plus a real purchase log to track actual DCA performance.',
    color: 'text-purple-400',
    bg: 'from-purple-500/20 to-purple-600/5',
    tier: 'free',
  },
  {
    icon: BarChart2,
    name: 'P&L Dashboard',
    description: 'Input holdings, see unrealized P&L in real-time. Bar charts for gains/losses, pie chart for allocation, detailed summary table.',
    color: 'text-rose-400',
    bg: 'from-rose-500/20 to-rose-600/5',
    tier: 'pro',
  },
  {
    icon: Search,
    name: 'Smart Screener',
    description: 'Filter coins by multiple AND conditions — 24h%, 7d%, market cap, volume, rank. Save presets for one-click filtering.',
    color: 'text-amber-400',
    bg: 'from-amber-500/20 to-amber-600/5',
    tier: 'pro',
  },
  {
    icon: ArrowLeftRight,
    name: 'Multi-Exchange Portfolio',
    description: 'Connect Binance, Coinbase, Kraken, KuCoin, Bybit, OKX with read-only keys. Unified balance view across all exchanges.',
    color: 'text-cyan-400',
    bg: 'from-cyan-500/20 to-cyan-600/5',
    tier: 'pro',
  },
  {
    icon: TrendingUp,
    name: 'BTC Cycle Comparison',
    description: 'Overlay 2012, 2016, 2020, and current 2024 BTC halving cycles on a normalized chart. See where we are in the cycle.',
    color: 'text-orange-400',
    bg: 'from-orange-500/20 to-orange-600/5',
    tier: 'free',
  },
  {
    icon: Globe,
    name: '60+ Currency Support',
    description: 'View prices in USD, EUR, GBP, JPY, INR, BRL, KRW, and 55+ more currencies. Proper symbols and locale formatting.',
    color: 'text-indigo-400',
    bg: 'from-indigo-500/20 to-indigo-600/5',
    tier: 'free',
  },
];

/* ─── Competitor Comparison ─── */
const COMPARISON_ROWS = [
  { feature: 'Live interactive dashboards', crk: '83+', others: 'Limited or none' },
  { feature: 'Dashboard widgets', crk: '90+', others: '5-15' },
  { feature: 'Smart intelligence widgets', crk: '8 built-in', others: 'Basic alerts only' },
  { feature: 'Custom dashboard builder', crk: true, others: 'Not available' },
  { feature: 'BYOK — your keys stay local', crk: true, others: 'Keys stored on their servers' },
  { feature: 'Tax report with CSV export', crk: true, others: 'Separate paid tool ($49+)' },
  { feature: 'Multi-exchange portfolio', crk: '6 exchanges', others: 'Manual tracking' },
  { feature: 'DCA simulator + tracker', crk: true, others: 'Basic or none' },
  { feature: 'Currency support', crk: '60+', others: 'USD only or 5-7' },
  { feature: 'Price alerts with email', crk: true, others: 'Pro only ($29+/mo)' },
  { feature: 'Starting price', crk: IS_BETA_MODE ? 'Free beta' : '$0 free / $9 pro', others: '$19-49/mo' },
];

/* ─── FAQ Items ─── */
const FAQ_ITEMS = [
  {
    q: 'Is CryptoReportKit really free?',
    a: IS_BETA_MODE
      ? 'Yes — this is a free beta. No credit card required, and you can access all dashboards and tools while the beta is running.'
      : 'Yes — 32+ dashboards, DCA simulator, BTC cycle comparison, 60+ currencies, and Learn content are all free forever. No credit card required. Pro unlocks all 83+ dashboards, custom builder, tax tools, and advanced features for $9/mo.',
  },
  {
    q: 'What is BYOK and do I need a CoinGecko key?',
    a: 'BYOK means "Bring Your Own Key." You get a free API key from CoinGecko (takes 30 seconds) and paste it into the dashboard. Your key stays in your browser — we never see, store, or transmit it. This means zero data middlemen and no vendor lock-in.',
  },
  {
    q: 'How is this different from CoinGecko or CoinMarketCap?',
    a: 'CoinGecko and CoinMarketCap show you data. CryptoReportKit lets you analyze it — with 83+ purpose-built dashboards, 8 intelligence widgets (health scores, smart signals, risk radar), a custom dashboard builder, tax exports, and DCA tracking. Think of it as an analytics layer on top of CoinGecko data.',
  },
  {
    q: 'Do I need to know Excel or coding?',
    a: 'No coding required. The web dashboards work entirely in your browser — just pick a dashboard, enter your API key, and start analyzing. We also offer downloadable Excel templates for offline analysis, but the web dashboards are the primary product.',
  },
  {
    q: 'Can I cancel or get a refund?',
    a: IS_BETA_MODE
      ? 'There are no payments during the free beta, so there’s nothing to cancel or refund. If we introduce paid plans later, we’ll publish clear billing and refund terms before launch.'
      : 'Cancel anytime from your account — no questions asked. Pro comes with a 30-day money-back guarantee. Your data and dashboards stay available on the free tier even after canceling.',
  },
];

export default function LandingPage() {
  const [showAllDashboards, setShowAllDashboards] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const visibleDashboards = showAllDashboards ? DASHBOARD_PREVIEWS : DASHBOARD_PREVIEWS.slice(0, 12);

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
            83+ Live Dashboards &middot; 90+ Widgets &middot; 8 Pro Tools
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
            Track markets, spot opportunities, compare coins, and build custom reports — all in real-time.{' '}
            <span className="text-white font-medium">Free to start, no credit card needed.</span>{' '}
            Your data stays in your browser.
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
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] rounded-xl font-semibold text-base transition-all hover:border-white/[0.2]"
            >
              View Pricing
              <ArrowRight className="w-5 h-5" />
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
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">83+</div>
              <div className="text-gray-400 text-sm mt-1">Live Dashboards</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400">90+</div>
              <div className="text-gray-400 text-sm mt-1">Dashboard Widgets</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-400">8</div>
              <div className="text-gray-400 text-sm mt-1">Pro Tools</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-amber-400">13</div>
              <div className="text-gray-400 text-sm mt-1">Widget Categories</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Up and Running in <span className="text-emerald-400">3 Minutes</span>
            </h2>
            <p className="text-gray-400 text-base max-w-xl mx-auto">
              No coding, no installation, no data vendor subscription.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Layout className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="text-emerald-400 text-xs font-bold mb-2">STEP 1</div>
              <h3 className="text-lg font-bold text-white mb-2">Pick a Dashboard</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Choose from 83+ purpose-built dashboards — Bitcoin analysis, DeFi yields, whale tracking, risk assessment, and more.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Key className="w-7 h-7 text-blue-400" />
              </div>
              <div className="text-blue-400 text-xs font-bold mb-2">STEP 2</div>
              <h3 className="text-lg font-bold text-white mb-2">Add Your Free API Key</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Get a free key from CoinGecko in 30 seconds. Paste it once — it stays in your browser, never on our servers.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-purple-400" />
              </div>
              <div className="text-purple-400 text-xs font-bold mb-2">STEP 3</div>
              <h3 className="text-lg font-bold text-white mb-2">Analyze & Export</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Real-time charts, smart signals, coin comparisons, and downloadable reports. Customize everything to fit your strategy.
              </p>
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
              83+ Live Dashboards, <span className="text-emerald-400">Real-Time Data</span>
            </h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto">
              From BTC dominance timing to whale accumulation radar — purpose-built dashboards for every crypto strategy.
              32+ dashboards free, no credit card needed.
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

          {!showAllDashboards && DASHBOARD_PREVIEWS.length > 12 && (
            <button
              type="button"
              onClick={() => setShowAllDashboards(true)}
              className="mt-4 mx-auto flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
            >
              +{DASHBOARD_PREVIEWS.length - 12} more dashboards shown here, 83+ total
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

      {/* ═══════ PRO TOOLS — NEW FEATURES ═══════ */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              NEW: PRO TOOLS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              8 Powerful Tools <span className="text-emerald-400">Built In</span>
            </h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto">
              Tax reports, DCA tracking, custom dashboards, multi-exchange portfolio, and more — features that competitors charge $30-50/month for,
              {IS_BETA_MODE ? ' included during the free beta.' : ' included in your $9 plan.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRO_TOOLS.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.name}
                  className={`bg-gradient-to-br ${f.bg} border border-gray-700/40 rounded-xl p-5 hover:border-gray-600/60 transition-all duration-200 relative`}
                >
                  {f.tier === 'free' && (
                    <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full font-medium">FREE</span>
                  )}
                  <Icon className={`w-6 h-6 ${f.color} mb-3`} />
                  <h3 className="text-sm font-bold text-white mb-1.5">{f.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
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
              Toggle any widget on or off, choose from 5 color themes, switch between Dark and Light Blue modes, and organize by 13 categories.
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
              <h3 className="text-sm font-bold text-white mb-1">13 Categories</h3>
              <p className="text-xs text-gray-500">Intelligence, Analytics, Portfolio & Tax, and more</p>
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
            <h3 className="text-xl font-bold text-white mb-2">Your Data, Your Control</h3>
            <p className="text-gray-400 text-sm max-w-lg mx-auto leading-relaxed mb-2">
              Use your own free CoinGecko API key — no data vendor subscription needed.
              Get a key in 30 seconds, paste it once, and unlock real-time data across all dashboards.
            </p>
            <p className="text-gray-500 text-xs max-w-lg mx-auto leading-relaxed mb-4">
              Your key stays in your browser. We never see, store, or transmit it. All requests go directly from your device to CoinGecko.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400">
                <Key className="w-3 h-3" /> Free API key
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400">
                <Lock className="w-3 h-3" /> Stays in your browser
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400">
                <Globe className="w-3 h-3" /> Direct to CoinGecko
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      {!IS_BETA_MODE && isFeatureEnabled('pricing') && (
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
                    '32+ live dashboards',
                    '5 widgets per dashboard',
                    'BTC dominance, market breadth, crypto indices',
                    'DCA simulator + BTC cycle comparison',
                    '60+ currency support',
                    '2-coin compare',
                    '5 downloads/month',
                    '30-day price history',
                    'Learn + Glossary',
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
                    'All 83+ dashboards unlocked',
                    'All 90+ widgets unlocked',
                    'Custom dashboard builder',
                    'Tax report with CSV export',
                    'P&L tracker + DCA tracker',
                    'Smart screener with presets',
                    'Multi-exchange portfolio (6 exchanges)',
                    '8 intelligence widgets',
                    '300 downloads/month',
                    '10-coin compare + head-to-head',
                    'Full price history (all timeframes)',
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

      {/* ═══════ FAQ ═══════ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Frequently Asked <span className="text-blue-400">Questions</span>
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/60 transition-colors"
                >
                  <span className="text-sm font-medium text-white pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-16 px-4 bg-gradient-to-r from-emerald-600/10 via-blue-600/10 to-purple-600/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Analyzing Crypto <span className="text-emerald-400">Today</span>
          </h2>
          <p className="text-gray-400 text-base mb-8 max-w-lg mx-auto">
            83+ dashboards, 90+ widgets, tax tools, DCA tracker, and custom builder. Free to start, powerful enough for professionals.
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

    </div>
  );
}
