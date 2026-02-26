'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import StickySignupButton from '@/components/StickySignupButton';
import { IS_BETA_MODE } from '@/lib/betaMode';
import {
  ArrowRight, Shield, Zap, Layout, TrendingUp,
  Key, Globe, ChevronDown, Check, FlaskConical,
} from 'lucide-react';

/* ─── Dashboard Preview Tiles (8 showcased) ─── */
const DASHBOARD_PREVIEWS = [
  { icon: '📊', name: 'Market Overview', widgets: 14, tier: 'free' },
  { icon: '₿', name: 'Bitcoin Dashboard', widgets: 10, tier: 'free' },
  { icon: '👑', name: 'BTC Dominance & Altseason Timer', widgets: 10, tier: 'free' },
  { icon: '📈', name: 'Crypto Indices', widgets: 9, tier: 'free' },
  { icon: '🎯', name: 'Accumulation Zone Finder', widgets: 9, tier: 'pro' },
  { icon: '🐋', name: 'Whale Accumulation Radar', widgets: 10, tier: 'pro' },
  { icon: '💎', name: 'Micro-Cap Gems Scanner', widgets: 9, tier: 'pro' },
  { icon: '🔍', name: 'Divergence Spotter', widgets: 10, tier: 'pro' },
];

/* ─── FAQ Items (objection-blockers only) ─── */
const FAQ_ITEMS = [
  {
    q: 'Is CryptoReportKit really free?',
    a: IS_BETA_MODE
      ? 'Yes — this is a free beta. No credit card required, and you can access all dashboards and tools while the beta is running.'
      : 'Yes — you get 30 days free with full access. No credit card required. After that, it\'s $19/month to keep using all 83+ dashboards, or you can stay on the free tier with 32+ dashboards forever.',
  },
  {
    q: 'What is BYOK and do I need a CoinGecko key?',
    a: 'BYOK means "Bring Your Own Key." You get a free API key from CoinGecko (takes 30 seconds) and paste it into the dashboard. Your key stays in your browser — we never see, store, or transmit it.',
  },
  {
    q: 'Can I cancel or get a refund?',
    a: IS_BETA_MODE
      ? 'There are no payments during the free beta, so there\'s nothing to cancel or refund.'
      : 'Cancel anytime from your account — no questions asked. Pro comes with a 30-day money-back guarantee.',
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />
      <StickySignupButton />

      {/* ═══════ 1. HERO ═══════ */}
      <section className="pt-20 pb-14 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/[0.07] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Real-Time Crypto Analytics
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Your Keys, Your Data
            </span>
          </h1>

          <p className="text-lg text-gray-400 mb-3 max-w-xl mx-auto leading-relaxed">
            83+ live dashboards powered by your own CoinGecko API key. Nothing stored on our servers.
          </p>

          <p className="text-sm text-emerald-400 font-medium mb-8">
            {IS_BETA_MODE
              ? 'Free during beta — no credit card required.'
              : 'Free for 30 days — no credit card required.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/live-dashboards"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl font-semibold text-base shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02]"
            >
              <Layout className="w-5 h-5" />
              {IS_BETA_MODE ? 'Explore Dashboards' : 'Start Free Trial'}
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] rounded-xl font-semibold text-base transition-all hover:border-white/[0.2]"
            >
              See Pricing
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ 2. PROOF STRIP ═══════ */}
      <section className="py-6 border-y border-gray-800/80 bg-gray-800/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-emerald-400">83+</div>
              <div className="text-gray-500 text-xs mt-1">Live Dashboards</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-blue-400">90+</div>
              <div className="text-gray-500 text-xs mt-1">Widgets</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-purple-400">60+</div>
              <div className="text-gray-500 text-xs mt-1">Currencies</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400 mb-1" />
              <div className="text-gray-400 text-xs">BYOK — keys never leave your device</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 3. HOW IT WORKS ═══════ */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Up and Running in <span className="text-emerald-400">3 Minutes</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <Layout className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-emerald-400 text-[10px] font-bold mb-1">STEP 1</div>
              <h3 className="text-base font-bold text-white mb-1">Pick a Dashboard</h3>
              <p className="text-gray-500 text-sm">Choose from 83+ purpose-built crypto dashboards.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <Key className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-blue-400 text-[10px] font-bold mb-1">STEP 2</div>
              <h3 className="text-base font-bold text-white mb-1">Add Your Free API Key</h3>
              <p className="text-gray-500 text-sm">Get a free CoinGecko key in 30 seconds. Stays in your browser.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-purple-400 text-[10px] font-bold mb-1">STEP 3</div>
              <h3 className="text-base font-bold text-white mb-1">Analyze & Export</h3>
              <p className="text-gray-500 text-sm">Real-time charts, smart signals, and downloadable reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 4. USE-CASES ═══════ */}
      <section className="py-12 px-4 bg-gradient-to-b from-gray-800/30 to-transparent">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Built for <span className="text-blue-400">Every Strategy</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 text-center">
              <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white mb-1">Traders</h3>
              <p className="text-xs text-gray-500">Smart signals, divergence detection, and accumulation zones.</p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 text-center">
              <Globe className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white mb-1">Investors</h3>
              <p className="text-xs text-gray-500">Track portfolios, DCA performance, and BTC cycle positioning.</p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 text-center">
              <Zap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white mb-1">Analysts</h3>
              <p className="text-xs text-gray-500">Custom dashboards, tax reports, and head-to-head coin comparison.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 5. PRODUCT PREVIEW ═══════ */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            83+ Dashboards, <span className="text-emerald-400">Real-Time Data</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DASHBOARD_PREVIEWS.map((d) => (
              <Link
                key={d.name}
                href="/live-dashboards"
                className="group bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700/50 hover:border-emerald-500/30 rounded-xl p-4 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{d.icon}</span>
                  {d.tier === 'pro' && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full font-medium">PRO</span>
                  )}
                </div>
                <h3 className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors leading-tight">{d.name}</h3>
                <p className="text-[10px] text-gray-600 mt-1">{d.widgets} widgets</p>
              </Link>
            ))}
          </div>

          {/* Experiment Lab teaser */}
          <Link
            href="/templates"
            className="mt-4 flex items-center gap-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl p-4 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Experiment Lab</h3>
              <p className="text-xs text-gray-500">Try any dashboard template with live data before committing.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
          </Link>

          <div className="text-center mt-6">
            <Link
              href="/live-dashboards"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
            >
              View All 83+ Dashboards <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ 6. PRICING TEASER ═══════ */}
      <section className="py-14 px-4 bg-gradient-to-r from-emerald-600/10 via-blue-600/10 to-purple-600/10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-lg md:text-xl font-semibold text-white mb-2">
            {IS_BETA_MODE
              ? 'Free during beta — all features unlocked.'
              : 'Free for 30 days starting today 26.02.2026 to 25.03.2026'}
          </p>
          {!IS_BETA_MODE && (
            <p className="text-gray-400 text-base mb-6">
              Then $19/month. Cancel anytime.
            </p>
          )}
          <Link
            href={IS_BETA_MODE ? '/live-dashboards' : '/signup'}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl font-semibold text-base shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02]"
          >
            {IS_BETA_MODE ? 'Explore Dashboards' : 'Start Free Trial'}
          </Link>
        </div>
      </section>

      {/* ═══════ 7. FAQ ═══════ */}
      <section className="py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Common <span className="text-blue-400">Questions</span>
          </h2>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-800/60 transition-colors"
                >
                  <span className="text-sm font-medium text-white pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
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

    </div>
  );
}
