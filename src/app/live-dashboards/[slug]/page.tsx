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
import { ArrowLeft, Key, Lock } from 'lucide-react';

export default function LiveDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const definition = getDashboardBySlug(slug);

  const { apiKey, fetchData } = useLiveDashboardStore();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadData = useCallback(() => {
    if (!definition || !apiKey) return;
    const params: Record<string, any> = {};
    const needsOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc'));
    if (needsOhlc) {
      const ohlcWidget = definition.widgets.find((w) => w.props?.coinId);
      if (ohlcWidget) {
        params.coinId = ohlcWidget.props?.coinId || 'bitcoin';
        params.days = ohlcWidget.props?.days || 30;
      }
    }
    fetchData(definition.requiredEndpoints, params);
    setInitialLoaded(true);
  }, [definition, apiKey, fetchData]);

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
    <div className="min-h-screen bg-gray-900">
      <FreeNavbar />
      <Breadcrumb customTitle={definition.name} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          href="/live-dashboards"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          All Dashboards
        </Link>

        {/* No API key state */}
        {!apiKey && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">{definition.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-2">{definition.name}</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">{definition.description}</p>

            {isPro && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-6">
                <Lock className="w-4 h-4" />
                Pro Dashboard — Requires subscription
              </div>
            )}

            <div>
              <button
                onClick={() => setShowKeyModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-3 rounded-lg transition flex items-center gap-2 mx-auto"
              >
                <Key className="w-4 h-4" />
                Connect API Key to Start
              </button>
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
