'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { LIVE_DASHBOARDS, type LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { BarChart3, ArrowRight, Key, FileSpreadsheet, Sparkles, Download, Share2, Shield } from 'lucide-react';
import { GLOW_CARD_CLASSES } from '@/lib/live-dashboard/theme';

function DashboardCard({ dashboard }: { dashboard: LiveDashboardDefinition }) {
  return (
    <div className={`group relative ${GLOW_CARD_CLASSES} p-6 flex flex-col`}>
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

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <FreeNavbar />
      <Breadcrumb />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/5 border border-emerald-400/10 text-emerald-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            BYOK — Your Key, Your Data
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 tracking-tight">
            Interactive Live{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Dashboards
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Beautiful crypto dashboards powered by your CoinGecko API key.
            Real-time data, stunning charts, and instant insights — all in your browser.
          </p>
        </div>

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

        {/* All dashboards */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-emerald-400 rounded-full" />
            <div>
              <h2 className="text-xl font-bold text-white">All Dashboards</h2>
              <p className="text-gray-600 text-sm">{LIVE_DASHBOARDS.length} dashboards available with any CoinGecko API key</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {LIVE_DASHBOARDS.map((d) => (
              <DashboardCard key={d.slug} dashboard={d} />
            ))}
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
