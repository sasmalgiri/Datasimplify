'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { UniversalExport } from '@/components/UniversalExport';
import type { ExperimentLayoutType } from '@/lib/templates/experimentLayouts';
import { LAYOUT_ENDPOINTS, LAYOUT_META } from '@/lib/templates/experimentLayouts';
import { MarketTableLayout } from './layouts/MarketTableLayout';
import { TechnicalChartLayout } from './layouts/TechnicalChartLayout';
import { DefiProtocolLayout } from './layouts/DefiProtocolLayout';
import { SentimentGaugeLayout } from './layouts/SentimentGaugeLayout';
import { DerivativesLayout } from './layouts/DerivativesLayout';

const TIME_RANGES = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1y', value: 365 },
  { label: '2y', value: 730 },
];

interface ExperimentShellProps {
  templateId: string;
  templateName: string;
  templateIcon: string;
  layoutType: ExperimentLayoutType;
}

export function ExperimentShell({ templateId, templateName, templateIcon, layoutType }: ExperimentShellProps) {
  const [coin, setCoin] = useState('bitcoin');
  const [coinInput, setCoinInput] = useState('bitcoin');
  const [days, setDays] = useState(90);
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const data = useLiveDashboardStore((s) => s.data);
  const fetchData = useLiveDashboardStore((s) => s.fetchData);
  const error = useLiveDashboardStore((s) => s.error);

  const endpoints = LAYOUT_ENDPOINTS[layoutType];
  const meta = LAYOUT_META[layoutType];

  // Fetch data on mount and when coin/days changes
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchData(endpoints, {
          coinId: coin,
          coinIds: [coin],
          days,
          vsCurrency: 'usd',
          historyCoinId: coin,
          historyDays: days,
          fgLimit: Math.min(days + 10, 365),
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [coin, days, fetchData, endpoints]);

  const handleCoinSubmit = () => {
    const trimmed = coinInput.trim().toLowerCase();
    if (trimmed && trimmed !== coin) {
      setCoin(trimmed);
    }
  };

  const chipActive = 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30';
  const chipInactive = 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white';

  const LayoutComponent = {
    'market-table': MarketTableLayout,
    'technical-chart': TechnicalChartLayout,
    'defi-protocol': DefiProtocolLayout,
    'sentiment-gauge': SentimentGaugeLayout,
    'derivatives-data': DerivativesLayout,
  }[layoutType];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Toolbar */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
          {/* Back */}
          <Link
            href="/templates"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>

          <div className="w-px h-5 bg-white/[0.08]" />

          {/* Template name */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{templateIcon}</span>
            <span className="text-sm font-bold text-white">{templateName}</span>
            <span className="text-[10px] text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded">{meta.title}</span>
          </div>

          <div className="w-px h-5 bg-white/[0.08]" />

          {/* Coin input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={coinInput}
              onChange={(e) => setCoinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCoinSubmit()}
              onBlur={handleCoinSubmit}
              className="w-32 bg-white/[0.04] border border-white/[0.1] text-white text-xs pl-6 pr-2.5 py-1.5 rounded-lg focus:outline-none focus:border-emerald-400/40"
              placeholder="Coin ID..."
            />
          </div>

          {/* Time range */}
          <div className="flex gap-0.5">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.value}
                type="button"
                onClick={() => setDays(tr.value)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition ${
                  days === tr.value ? chipActive : chipInactive
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Export */}
          <UniversalExport
            name={`${templateName}-${coin}`}
            captureRef={contentRef}
            getData={() => data}
            compact
          />
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} id="dashboard-content" className="max-w-[1800px] mx-auto px-4 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="ml-3 text-sm text-gray-400">Loading data...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <LayoutComponent coin={coin} days={days} />
        )}
      </div>
    </div>
  );
}
