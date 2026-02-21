'use client';

import { useState } from 'react';
import { Download, ExternalLink, Sparkles, BarChart3, FileText } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { REPORT_PACK_DEFINITIONS } from '@/lib/report-packs/packDefinitions';

type FilterType = 'all' | 'report_packs' | 'dashboards';

const CURATED_DASHBOARDS = [
  {
    id: 'market-overview',
    name: 'Market Overview',
    description: 'Top cryptocurrencies by market cap with live price tracking',
    icon: '📊',
    slug: 'market-overview',
    type: 'dashboard' as const,
  },
  {
    id: 'bitcoin-dashboard',
    name: 'Bitcoin Dashboard',
    description: 'Deep-dive into BTC with technicals, OHLCV, and on-chain metrics',
    icon: '₿',
    slug: 'bitcoin-dashboard',
    type: 'dashboard' as const,
  },
  {
    id: 'ethereum-dashboard',
    name: 'Ethereum Dashboard',
    description: 'ETH analytics with gas tracker, DeFi TVL, and staking data',
    icon: '⟠',
    slug: 'ethereum-dashboard',
    type: 'dashboard' as const,
  },
  {
    id: 'defi-dashboard',
    name: 'DeFi Dashboard',
    description: 'Top DeFi protocols, yields, and TVL tracking',
    icon: '🏦',
    slug: 'defi-dashboard',
    type: 'dashboard' as const,
  },
  {
    id: 'portfolio-tracker',
    name: 'Portfolio Tracker',
    description: 'Track your crypto portfolio performance and allocation',
    icon: '💼',
    slug: 'portfolio-tracker',
    type: 'dashboard' as const,
  },
  {
    id: 'fear-greed',
    name: 'Fear & Greed Index',
    description: 'Market sentiment tracking with historical analysis',
    icon: '😱',
    slug: 'fear-greed',
    type: 'dashboard' as const,
  },
];

interface TemplateGalleryProps {
  onSelectPack?: (packId: string) => void;
  onSelectDashboard?: (slug: string) => void;
}

export function TemplateGallery({ onSelectPack, onSelectDashboard }: TemplateGalleryProps) {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];
  const [filter, setFilter] = useState<FilterType>('all');

  const packItems = REPORT_PACK_DEFINITIONS.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    icon: p.icon,
    tier: p.tier,
    type: 'report_pack' as const,
  }));

  const dashboardItems = CURATED_DASHBOARDS;

  const items =
    filter === 'report_packs'
      ? packItems
      : filter === 'dashboards'
        ? dashboardItems
        : [...packItems, ...dashboardItems];

  return (
    <div>
      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        {(['all', 'report_packs', 'dashboards'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? st.chipActive : st.chipInactive
            }`}
          >
            {f === 'all' ? 'All' : f === 'report_packs' ? 'Report Packs' : 'Dashboards'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`${st.cardClasses} ${st.cardGlow} p-5 flex flex-col`}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-sm ${st.textPrimary}`}>
                    {item.name}
                  </h3>
                  {'tier' in item && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase ${
                        item.tier === 'free'
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : 'bg-amber-400/10 text-amber-400'
                      }`}
                    >
                      {item.tier}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 ${st.textMuted} line-clamp-2`}>
                  {item.description}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-3">
              {item.type === 'report_pack' ? (
                <button
                  onClick={() => onSelectPack?.(item.id)}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${st.buttonPrimary}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Use This Pack
                </button>
              ) : (
                <button
                  onClick={() => onSelectDashboard?.((item as any).slug)}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${st.buttonSecondary}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Dashboard
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
