'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DataLabCanvas } from '@/components/datalab/DataLabCanvas';
import { DataLabToolbar } from '@/components/datalab/DataLabToolbar';
import { DataLabTable } from '@/components/datalab/DataLabTable';
import { useDataLabStore } from '@/lib/datalab/store';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { FlaskConical, Lock, Camera } from 'lucide-react';

export default function DataLabPage() {
  const { user, profile, isLoading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const showTable = useDataLabStore((s) => s.showTable);
  const activePreset = useDataLabStore((s) => s.activePreset);
  const loadPreset = useDataLabStore((s) => s.loadPreset);
  const apiKey = useLiveDashboardStore((s) => s.apiKey);
  const chartRef = useRef<HTMLDivElement>(null);
  const hasInitRef = useRef(false);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
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
  const isPro = isAdmin || profile?.subscription_tier === 'pro';
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

  // API key gate
  if (!apiKey) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <FreeNavbar />
        <Breadcrumb />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-10">
            <FlaskConical className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-3">API Key Required</h1>
            <p className="text-gray-400 mb-6">
              DataLab needs your CoinGecko API key to fetch live data.
              Set it up in any live dashboard first.
            </p>
            <Link
              href="/live-dashboards/market-overview"
              className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition"
            >
              Go to Live Dashboards
            </Link>
          </div>
        </main>
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

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            <div>
              <h1 className="text-sm font-bold text-white">DataLab</h1>
              <p className="text-[10px] text-gray-500">
                Interactive chart overlays &middot; Edit data &middot; Tweak parameters &middot; Research experiments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleScreenshot}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <Camera className="w-3.5 h-3.5" />
            Screenshot
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex min-h-0 max-w-[1800px] mx-auto w-full" ref={chartRef}>
        {/* Left: Toolbar */}
        <DataLabToolbar />

        {/* Center: Chart Canvas */}
        <DataLabCanvas />

        {/* Right: Data Table (collapsible) */}
        {showTable && <DataLabTable />}
      </div>
    </div>
  );
}
