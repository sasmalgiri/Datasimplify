'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { getDashboardBySlug } from '@/lib/live-dashboard/definitions';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { DashboardShell } from '@/components/live-dashboard/DashboardShell';
import { ApiKeyModal } from '@/components/live-dashboard/ApiKeyModal';
import { ArrowLeft, Key, Lock, Shield } from 'lucide-react';
import { GLOW_CARD_CLASSES } from '@/lib/live-dashboard/theme';

export default function LiveDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const definition = getDashboardBySlug(slug);

  const { apiKey, fetchData, customization } = useLiveDashboardStore();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadData = useCallback(() => {
    if (!definition || !apiKey) return;
    const params: Record<string, any> = {};
    const c = customization;

    // OHLC
    const needsOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc'));
    if (needsOhlc) {
      const ohlcWidget = definition.widgets.find((w) => w.props?.coinId);
      params.coinId = c.coinId || ohlcWidget?.props?.coinId || 'bitcoin';
      params.days = c.days || ohlcWidget?.props?.days || 30;
    }
    // Multi OHLC
    const needsMultiOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc_multi'));
    if (needsMultiOhlc) {
      const multiWidget = definition.widgets.find((w) => w.props?.coinIds);
      params.coinIds = c.coinIds.length > 0 ? c.coinIds : multiWidget?.props?.coinIds;
      params.days = c.days || multiWidget?.props?.days || 30;
    }
    // Coin history
    const needsHistory = definition.widgets.some((w) => w.dataEndpoints.includes('coin_history'));
    if (needsHistory) {
      const histWidget = definition.widgets.find((w) => w.props?.coinId && w.dataEndpoints.includes('coin_history'));
      params.historyCoinId = c.coinId || histWidget?.props?.coinId || 'bitcoin';
      params.historyDays = c.days || histWidget?.props?.days || 90;
    }
    fetchData(definition.requiredEndpoints, params);
    setInitialLoaded(true);
  }, [definition, apiKey, fetchData, customization]);

  // Auto-fetch on mount if key exists
  useEffect(() => {
    if (apiKey && !initialLoaded) {
      loadData();
    }
  }, [apiKey, initialLoaded, loadData]);

  // Show key modal if no key
  useEffect(() => {
    if (!apiKey && !showKeyModal) {
      const timer = setTimeout(() => setShowKeyModal(true), 500);
      return () => clearTimeout(timer);
    }
  }, [apiKey, showKeyModal]);

  if (!definition) {
    notFound();
  }

  const isPro = definition.tier === 'pro';

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <FreeNavbar />
      <Breadcrumb customTitle={definition.name} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          href="/live-dashboards"
          className="inline-flex items-center gap-1.5 text-gray-600 hover:text-white text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          All Dashboards
        </Link>

        {/* No API key state */}
        {!apiKey && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6">{definition.icon}</div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">{definition.name}</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">{definition.description}</p>

            {isPro && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-400/5 border border-purple-400/10 text-purple-400 text-sm mb-8">
                <Lock className="w-4 h-4" />
                Pro Dashboard — Requires subscription
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className={`${GLOW_CARD_CLASSES} bg-emerald-500/10 border-emerald-400/20 hover:border-emerald-400/40 text-emerald-400 font-medium px-8 py-4 transition flex items-center gap-2 mx-auto text-lg`}
              >
                <Key className="w-5 h-5" />
                Connect API Key to Start
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-gray-700">
              <Shield className="w-3 h-3" />
              Your key stays in your browser. Data is for personal use only.
            </div>
          </div>
        )}

        {/* Dashboard with data */}
        {apiKey && (
          <DashboardShell
            definition={definition}
            onOpenKeyModal={() => setShowKeyModal(true)}
          />
        )}
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
