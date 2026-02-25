'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DataLabCanvas } from '@/components/datalab/DataLabCanvas';
import { DataLabToolbar } from '@/components/datalab/DataLabToolbar';
import { DataLabTable } from '@/components/datalab/DataLabTable';
import { ApiKeyModal } from '@/components/live-dashboard/ApiKeyModal';
import { useDataLabStore } from '@/lib/datalab/store';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { FlaskConical, Lock, Key, ExternalLink, Shield } from 'lucide-react';
import { IS_BETA_MODE } from '@/lib/betaMode';

export default function DataLabPage() {
  const { user, profile, isLoading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const showTable = useDataLabStore((s) => s.showTable);
  const activePreset = useDataLabStore((s) => s.activePreset);
  const loadPreset = useDataLabStore((s) => s.loadPreset);
  const apiKey = useLiveDashboardStore((s) => s.apiKey);
  const chartRef = useRef<HTMLDivElement>(null);
  const hasInitRef = useRef(false);

  // Auth gate (skip in beta mode — everything is free)
  useEffect(() => {
    if (!IS_BETA_MODE && !authLoading && !user) {
      router.push('/login?redirect=/datalab');
    }
  }, [authLoading, user, router]);

  // Auto-load default preset on first visit
  useEffect(() => {
    if (!hasInitRef.current && apiKey && !activePreset) {
      hasInitRef.current = true;
      loadPreset('confluence-zones');
    }
  }, [apiKey, activePreset, loadPreset]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <FreeNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Pro tier gate — admin users bypass
  const isPro = IS_BETA_MODE || isAdmin || profile?.subscription_tier === 'pro';
  if (!isPro) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <FreeNavbar />
        <Breadcrumb />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-10">
            <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-3">DataLab is a Pro Feature</h1>
            <p className="text-gray-400 mb-6">
              Interactive chart overlays, data manipulation, and research experiments
              are available on the Pro plan.
            </p>
            <Link
              href="/pricing"
              className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition"
            >
              Upgrade to Pro
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // API key gate — inline onboarding with modal
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Auto-open modal after a brief delay when no key is set
  useEffect(() => {
    if (!apiKey && isPro) {
      const timer = setTimeout(() => setShowKeyModal(true), 600);
      return () => clearTimeout(timer);
    }
  }, [apiKey, isPro]);

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <FreeNavbar />
        <Breadcrumb />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-10">
            <FlaskConical className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-3">Connect Your CoinGecko API Key</h1>
            <p className="text-gray-400 mb-6">
              DataLab fetches live market data directly from CoinGecko.
              You need a free Demo API key to get started — no credit card required.
            </p>

            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition mb-6"
            >
              <Key className="w-4 h-4" />
              Connect API Key
            </button>

            {/* Quick info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mt-2">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                <p className="text-xs font-medium text-emerald-400 mb-1">Free Demo Plan</p>
                <p className="text-[11px] text-gray-500">30 calls/min &middot; 10K calls/month. More than enough for personal research.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                <p className="text-xs font-medium text-emerald-400 mb-1">Your Key, Your Control</p>
                <p className="text-[11px] text-gray-500">Key stays in your browser only. Never stored on our servers.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                <p className="text-xs font-medium text-emerald-400 mb-1">2-Minute Setup</p>
                <p className="text-[11px] text-gray-500">
                  Sign up at{' '}
                  <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                    coingecko.com
                  </a>{' '}
                  and copy your key.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-600">
              <Shield className="w-3 h-3" />
              <span>BYOK (Bring Your Own Key) — calls go direct to CoinGecko from your browser</span>
            </div>
          </div>
        </main>

        <ApiKeyModal
          isOpen={showKeyModal}
          onClose={() => setShowKeyModal(false)}
          onSuccess={() => {
            setShowKeyModal(false);
            // Auto-load default preset after key is connected
            if (!activePreset) loadPreset('confluence-zones');
          }}
        />
      </div>
    );
  }

  const handleScreenshot = async () => {
    if (!chartRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#0a0a0f',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `datalab-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // Screenshot failed silently
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <FreeNavbar />
      <Breadcrumb />

      {/* Compact horizontal toolbar (replaces sidebar + header) */}
      <DataLabToolbar onScreenshot={handleScreenshot} />

      {/* Chart + optional Table (full width) */}
      <div className="flex-1 flex min-h-0 max-w-[1800px] mx-auto w-full" ref={chartRef}>
        <DataLabCanvas />
        {showTable && <DataLabTable />}
      </div>
    </div>
  );
}
