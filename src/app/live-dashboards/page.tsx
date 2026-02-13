'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { LIVE_DASHBOARDS, type LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { BarChart3, Lock, ArrowRight, Key, FileSpreadsheet, Sparkles } from 'lucide-react';

function DashboardCard({ dashboard }: { dashboard: LiveDashboardDefinition }) {
  const isFree = dashboard.tier === 'free';

  return (
    <div className="group relative bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-emerald-500/50 hover:bg-gray-800/80 transition-all duration-300 flex flex-col">
      {/* Tier badge */}
      <div className="absolute top-4 right-4">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isFree ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
        }`}>
          {dashboard.tier}
        </span>
      </div>

      {/* Icon */}
      <div className="text-4xl mb-4">{dashboard.icon}</div>

      {/* Title & description */}
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition">
        {dashboard.name}
      </h3>
      <p className="text-gray-400 text-sm flex-1 mb-4">{dashboard.description}</p>

      {/* Widgets count */}
      <div className="text-xs text-gray-500 mb-4">
        {dashboard.widgets.length} widgets &bull; {dashboard.requiredEndpoints.length} data sources
      </div>

      {/* Action button */}
      {isFree ? (
        <Link
          href={`/live-dashboards/${dashboard.slug}`}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm"
        >
          Launch Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      ) : (
        <Link
          href={`/live-dashboards/${dashboard.slug}`}
          className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm"
        >
          <Lock className="w-3 h-3" />
          Preview (Pro)
        </Link>
      )}
    </div>
  );
}

export default function LiveDashboardsPage() {
  const freeDashboards = LIVE_DASHBOARDS.filter((d) => d.tier === 'free');
  const proDashboards = LIVE_DASHBOARDS.filter((d) => d.tier === 'pro');

  return (
    <div className="min-h-screen bg-gray-900">
      <FreeNavbar />
      <Breadcrumb />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            BYOK — Your Key, Your Data
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Interactive Live Dashboards
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Beautiful crypto dashboards powered by your CoinGecko API key.
            Real-time data, stunning charts, and instant insights — all in your browser.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: <Key className="w-6 h-6" />, title: '1. Connect Your Key', desc: 'Enter your free CoinGecko API key. It stays in your browser only.' },
            { icon: <BarChart3 className="w-6 h-6" />, title: '2. View Live Data', desc: 'Interactive charts, tables, and KPIs update with real-time market data.' },
            { icon: <FileSpreadsheet className="w-6 h-6" />, title: '3. Download Excel', desc: 'Export any dashboard as a professionally styled Excel template.' },
          ].map((step) => (
            <div key={step.title} className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 border border-gray-800">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{step.title}</h3>
                <p className="text-gray-500 text-xs mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Free dashboards */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-emerald-500 rounded-full" />
            Free Dashboards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeDashboards.map((d) => (
              <DashboardCard key={d.slug} dashboard={d} />
            ))}
          </div>
        </section>

        {/* Pro dashboards */}
        {proDashboards.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-purple-500 rounded-full" />
              Pro Dashboards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proDashboards.map((d) => (
                <DashboardCard key={d.slug} dashboard={d} />
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="text-center py-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm mb-3">
            Want these dashboards in Excel? Download our professionally styled templates.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Browse Excel Templates
          </Link>
        </div>
      </main>
    </div>
  );
}
