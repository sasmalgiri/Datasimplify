'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Activity, X } from 'lucide-react';
import { useLiveDashboardStore, calculateApiCallsForDefinition } from '@/lib/live-dashboard/store';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';

interface ApiUsagePillProps {
  definition: LiveDashboardDefinition;
}

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

  // Monthly estimate based on current usage pattern
  const sessionMinutes = Math.max(1, (Date.now() - apiUsage.sessionStartTime) / 60000);
  const callsPerMinute = apiUsage.totalApiCalls / sessionMinutes;
  const estMonthly = Math.round(callsPerMinute * 60 * 24 * 30);

  // CoinGecko plan limits (monthly)
  const monthlyLimit = keyType === 'pro' ? 500000 : 10000;
  const usagePercent = monthlyLimit > 0 ? Math.min(100, (estMonthly / monthlyLimit) * 100) : 0;

  const statusColor = usagePercent > 80 ? 'text-red-400' : usagePercent > 50 ? 'text-yellow-400' : 'text-emerald-400';
  const barColor = usagePercent > 80 ? 'bg-red-400' : usagePercent > 50 ? 'bg-yellow-400' : 'bg-emerald-400';

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
        ~{callsPerRefresh} calls
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            style={{ zIndex: 99998 }}
            onClick={() => setOpen(false)}
          />

          {/* Centered modal */}
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] max-w-[90vw] bg-[#0c0c14] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
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
              {/* Per-refresh */}
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Calls per refresh</span>
                <span className="text-white font-medium">{callsPerRefresh}</span>
              </div>

              {/* Per hour */}
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Est. calls/hour</span>
                <span className={`font-medium ${autoRefreshInterval > 0 ? statusColor : 'text-gray-600'}`}>
                  {autoRefreshInterval > 0 ? callsPerHour : 'Auto-refresh off'}
                </span>
              </div>

              {/* Separator */}
              <div className="border-t border-white/[0.06]" />

              {/* Session stats */}
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Session Stats</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xl font-bold text-white">{apiUsage.totalApiCalls}</div>
                  <div className="text-[10px] text-gray-600">Total Calls</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{apiUsage.refreshCount}</div>
                  <div className="text-[10px] text-gray-600">Refreshes</div>
                </div>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Session time</span>
                <span className="text-gray-400">{formatDuration(Date.now() - apiUsage.sessionStartTime)}</span>
              </div>

              {/* Plan usage bar */}
              <div className="border-t border-white/[0.06] pt-3">
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-gray-500">
                    {keyType === 'pro' ? 'Pro Plan' : 'Demo Plan'} (est. monthly)
                  </span>
                  <span className={statusColor}>{usagePercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(100, usagePercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                  <span>~{estMonthly.toLocaleString()} est.</span>
                  <span>{monthlyLimit.toLocaleString()}/mo</span>
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
