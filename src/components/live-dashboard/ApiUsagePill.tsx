'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Activity, X } from 'lucide-react';
import { useLiveDashboardStore, calculateApiCallsForDefinition } from '@/lib/live-dashboard/store';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';

interface ApiUsagePillProps {
  definition: LiveDashboardDefinition;
}

// CoinGecko monthly limits
const PLAN_LIMITS = { pro: 500000, demo: 10000 } as const;

export function ApiUsagePill({ definition }: ApiUsagePillProps) {
  const { apiUsage, autoRefreshInterval, keyType, customization } = useLiveDashboardStore();
  const [open, setOpen] = useState(false);

  const callsPerRefresh = calculateApiCallsForDefinition(
    definition.requiredEndpoints,
    { coinIds: customization.coinIds.length > 0 ? customization.coinIds : undefined },
  );

  const callsPerHour = autoRefreshInterval > 0
    ? Math.round((3600 / autoRefreshInterval) * callsPerRefresh)
    : 0;

  const monthlyLimit = PLAN_LIMITS[keyType === 'pro' ? 'pro' : 'demo'];
  const remaining = Math.max(0, monthlyLimit - apiUsage.totalApiCalls);
  const usagePercent = Math.min(100, (apiUsage.totalApiCalls / monthlyLimit) * 100);

  const statusColor = usagePercent > 80 ? 'text-red-400' : usagePercent > 50 ? 'text-yellow-400' : 'text-emerald-400';
  const barColor = usagePercent > 80 ? 'bg-red-400' : usagePercent > 50 ? 'bg-yellow-400' : 'bg-emerald-400';

  const sessionMinutes = Math.max(1, (Date.now() - apiUsage.sessionStartTime) / 60000);
  const callsPerMinute = apiUsage.totalApiCalls / sessionMinutes;
  const estMonthly = Math.round(callsPerMinute * 60 * 24 * 30);

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition border ${statusColor} ${
          open ? 'bg-white/[0.08] border-white/[0.15]' : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]'
        }`}
        title="API usage stats"
      >
        <Activity className="w-3 h-3" />
        {remaining.toLocaleString()} left
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/40"
            style={{ zIndex: 99998 }}
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] max-w-[90vw] bg-[#0c0c14] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
            style={{ zIndex: 99999 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                API Usage
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition" title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Remaining — big hero number */}
              <div className="text-center py-2">
                <div className={`text-3xl font-bold ${statusColor}`}>{remaining.toLocaleString()}</div>
                <div className="text-[11px] text-gray-500 mt-1">calls remaining this session</div>
              </div>

              {/* Usage bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-gray-500">{keyType === 'pro' ? 'Pro' : 'Demo'} Plan</span>
                  <span className={statusColor}>
                    {apiUsage.totalApiCalls.toLocaleString()} / {monthlyLimit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(100, usagePercent)}%` }}
                  />
                </div>
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-white">{callsPerRefresh}</div>
                  <div className="text-[9px] text-gray-600">Per Refresh</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{apiUsage.refreshCount}</div>
                  <div className="text-[9px] text-gray-600">Refreshes</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">
                    {autoRefreshInterval > 0 ? `${callsPerHour}/h` : 'Off'}
                  </div>
                  <div className="text-[9px] text-gray-600">Auto Rate</div>
                </div>
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Detail rows */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Session time</span>
                  <span className="text-gray-300">{formatDuration(Date.now() - apiUsage.sessionStartTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Est. monthly (at this rate)</span>
                  <span className="text-gray-300">~{estMonthly.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total calls this session</span>
                  <span className="text-white font-medium">{apiUsage.totalApiCalls}</span>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
