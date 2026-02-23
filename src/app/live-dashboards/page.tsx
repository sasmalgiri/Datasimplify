'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { LIVE_DASHBOARDS, type LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { BarChart3, ArrowRight, Key, FileSpreadsheet, Sparkles, Download, Share2, Shield, Users, Wrench, Search, Brain, Globe, Coins, TrendingUp, Zap, GitBranch, Star } from 'lucide-react';
import { GLOW_CARD_CLASSES } from '@/lib/live-dashboard/theme';
import { usePersonaStore } from '@/lib/persona/personaStore';
import { sortDashboardsByPersona, isDashboardRecommended } from '@/lib/persona/helpers';

function DashboardCard({ dashboard, recommended }: { dashboard: LiveDashboardDefinition; recommended?: boolean }) {
  return (
    <div className={`group relative ${GLOW_CARD_CLASSES} p-6 flex flex-col`}>
      {/* Recommended badge */}
      {recommended && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
          <Star className="w-3 h-3 text-amber-400" />
          <span className="text-[9px] text-amber-400 font-medium">Recommended</span>
        </div>
      )}

      {/* Icon */}
      <div className="text-4xl mb-4">{dashboard.icon}</div>

      {/* Title & description */}
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition">
        {dashboard.name}
      </h3>
      <p className="text-gray-500 text-sm flex-1 mb-4 leading-relaxed">{dashboard.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[10px] text-gray-600 mb-4">
        <span>{dashboard.widgets.length} widgets</span>
        <span className="w-1 h-1 rounded-full bg-gray-700" />
        <span>{dashboard.requiredEndpoints.length} data sources</span>
      </div>

      {/* Action button */}
      <Link
        href={`/live-dashboards/${dashboard.slug}`}
        className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/20 text-emerald-400 font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
      >
        Launch Dashboard
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function LiveDashboardsPage() {
  const persona = usePersonaStore((s) => s.persona);
  const sortedDashboards = sortDashboardsByPersona(LIVE_DASHBOARDS, persona);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <FreeNavbar />
      <Breadcrumb />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/5 border border-emerald-400/10 text-emerald-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            5,000+ Dashboards — No SQL Required
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 tracking-tight">
            Interactive Live{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Dashboards
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            {LIVE_DASHBOARDS.length} curated dashboards + auto-generated analytics for every DeFi protocol and cryptocurrency.
            No SQL. No code. Just data.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {[
            { value: `${LIVE_DASHBOARDS.length}+`, label: 'Curated Dashboards', icon: <BarChart3 className="w-4 h-4" /> },
            { value: '4,000+', label: 'Protocol Dashboards', icon: <Globe className="w-4 h-4" /> },
            { value: '500+', label: 'Coin Dashboards', icon: <Coins className="w-4 h-4" /> },
            { value: '90+', label: 'Widget Types', icon: <TrendingUp className="w-4 h-4" /> },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
                {s.icon}
                <span className="text-2xl font-bold">{s.value}</span>
              </div>
              <p className="text-gray-600 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Explore CTA — the big feature */}
        <section className="mb-16">
          <Link
            href="/live-dashboards/explore"
            className="block relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/5 via-transparent to-teal-400/5 p-8 group hover:border-emerald-400/40 transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-xs font-medium mb-4">
                  <Zap className="w-3 h-3" />
                  NEW — Auto-Generated Dashboards
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Explore 5,000+ Dashboards
                </h2>
                <p className="text-gray-400 max-w-lg leading-relaxed">
                  Auto-generated analytics for every DeFi protocol tracked by DeFi Llama and every major cryptocurrency on CoinGecko. Protocol dashboards are 100% free — no API key needed.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex -space-x-2">
                  {['🦄', '👻', '🌊', '🏛️', '🟢', '🔷'].map((emoji, i) => (
                    <span key={i} className="w-10 h-10 rounded-full bg-white/[0.05] border-2 border-[#0a0a0f] flex items-center justify-center text-lg">
                      {emoji}
                    </span>
                  ))}
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition">
                  <Search className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Features row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: <Key className="w-5 h-5" />, title: 'BYOK Model', desc: 'Your key stays in your browser' },
            { icon: <BarChart3 className="w-5 h-5" />, title: 'Live Charts', desc: 'Interactive real-time visualizations' },
            { icon: <Download className="w-5 h-5" />, title: 'PDF Export', desc: 'Download dashboards as PDF/PNG' },
            { icon: <Share2 className="w-5 h-5" />, title: 'Shareable', desc: 'Share links for personal use' },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="p-2 rounded-lg bg-emerald-400/5 text-emerald-400 shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{f.title}</h3>
                <p className="text-gray-600 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Curated dashboards */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-emerald-400 rounded-full" />
            <div>
              <h2 className="text-xl font-bold text-white">Curated Dashboards</h2>
              <p className="text-gray-600 text-sm">{LIVE_DASHBOARDS.length} hand-crafted dashboards with optimized layouts</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedDashboards.map((d) => (
              <DashboardCard
                key={d.slug}
                dashboard={d}
                recommended={isDashboardRecommended(d.slug, persona)}
              />
            ))}
          </div>
        </section>

        {/* Tools Section: Community, Builder, AI */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-purple-400 rounded-full" />
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard Tools</h2>
              <p className="text-gray-600 text-sm">Create, share, and explore</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href="/live-dashboards/explore"
              className={`${GLOW_CARD_CLASSES} p-6 flex items-center gap-4 group`}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Search className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold group-hover:text-emerald-400 transition">Explore All</h3>
                <p className="text-gray-500 text-sm">Browse 5,000+ auto-generated dashboards</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition shrink-0" />
            </Link>
            <Link
              href="/live-dashboards/ai-builder"
              className={`${GLOW_CARD_CLASSES} p-6 flex items-center gap-4 group`}
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold group-hover:text-purple-400 transition">AI Builder</h3>
                <p className="text-gray-500 text-sm">Describe what you want, AI builds it</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition shrink-0" />
            </Link>
            <Link
              href="/live-dashboards/community"
              className={`${GLOW_CARD_CLASSES} p-6 flex items-center gap-4 group`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold group-hover:text-amber-400 transition">Community</h3>
                <p className="text-gray-500 text-sm">Browse and fork shared dashboards</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-amber-400 transition shrink-0" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <Link
              href="/live-dashboards/custom/builder"
              className={`${GLOW_CARD_CLASSES} p-6 flex items-center gap-4 group`}
            >
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                <Wrench className="w-6 h-6 text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold group-hover:text-teal-400 transition">Custom Builder</h3>
                <p className="text-gray-500 text-sm">Pick widgets manually to create your own dashboard layout</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-teal-400 transition shrink-0" />
            </Link>
            <Link
              href="/live-dashboards/taxonomy"
              className={`${GLOW_CARD_CLASSES} p-6 flex items-center gap-4 group`}
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                <GitBranch className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold group-hover:text-cyan-400 transition">Crypto Taxonomy</h3>
                <p className="text-gray-500 text-sm">Interactive tree showing the full crypto ecosystem and every dashboard</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition shrink-0" />
            </Link>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center py-10 border-t border-white/[0.04]">
          <div className="flex items-center justify-center gap-1.5 text-gray-600 text-[10px] mb-4">
            <Shield className="w-3 h-3" />
            All data is for your personal, non-commercial use only
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Want raw data in Excel? Download our professionally styled data templates.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white text-sm font-medium transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Browse Excel Templates
          </Link>
        </div>
      </main>
    </div>
  );
}
