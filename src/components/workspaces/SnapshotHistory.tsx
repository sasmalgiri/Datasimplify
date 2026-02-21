'use client';

import { useEffect, useState } from 'react';
import { Clock, ChevronDown, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { useWorkspaceStore, useActiveWorkspace } from '@/lib/workspaces/workspaceStore';
import { formatCompactValue, formatPctChange, formatTimeElapsed } from '@/lib/workspaces/deltaEngine';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

interface SnapshotHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SnapshotHistory({ isOpen, onClose }: SnapshotHistoryProps) {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];

  const activeWorkspace = useActiveWorkspace();
  const { snapshots, isLoadingSnapshots, fetchSnapshots } = useWorkspaceStore();
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (isOpen && activeWorkspace) {
      fetchSnapshots(activeWorkspace.id, limit);
    }
  }, [isOpen, activeWorkspace, limit, fetchSnapshots]);

  if (!isOpen || !activeWorkspace) return null;

  // Sparkline data (reversed so oldest is first)
  const sparklineData = [...snapshots]
    .reverse()
    .filter((s) => s.kpi_value != null)
    .map((s) => ({
      date: new Date(s.created_at).toLocaleDateString(),
      value: s.kpi_value!,
    }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative w-full max-w-md ${st.pageBg} border-l ${st.subtleBorder} overflow-y-auto`}
      >
        {/* Header */}
        <div className={`sticky top-0 ${st.pageBg} border-b ${st.subtleBorder} p-4 z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <h2 className={`text-lg font-semibold ${st.textPrimary}`}>Snapshot History</h2>
            </div>
            <button
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-xs ${st.buttonSecondary}`}
            >
              Close
            </button>
          </div>
          <p className={`text-sm mt-1 ${st.textMuted}`}>
            {activeWorkspace.name} &middot; {snapshots.length} snapshots
          </p>
        </div>

        {/* Portfolio Value Sparkline */}
        {sparklineData.length > 1 && (
          <div className={`mx-4 mt-4 ${st.cardClasses} p-4`}>
            <p className={`text-xs font-medium uppercase mb-2 ${st.textDim}`}>
              Portfolio Value Over Time
            </p>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <Tooltip
                  contentStyle={{
                    background: '#1f2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(value) => [formatCompactValue(value as number), 'Value']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#sparklineGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Loading */}
        {isLoadingSnapshots && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        )}

        {/* Timeline */}
        {!isLoadingSnapshots && (
          <div className="p-4 space-y-1">
            {snapshots.length === 0 && (
              <p className={`text-center py-8 text-sm ${st.textMuted}`}>
                No snapshots yet. Refresh data to create the first snapshot.
              </p>
            )}

            {snapshots.map((snap, i) => {
              const isFirst = i === 0;
              const valueChange = snap.diff?.value_pct_change;
              const isPositive = valueChange != null ? valueChange >= 0 : null;

              return (
                <div
                  key={snap.id}
                  className={`flex gap-3 py-3 ${
                    i < snapshots.length - 1 ? `border-b ${st.divider}` : ''
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isFirst ? 'bg-emerald-400' : `bg-white/20`
                      }`}
                    />
                    {i < snapshots.length - 1 && (
                      <div className={`w-px flex-1 mt-1 bg-white/[0.06]`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${isFirst ? 'text-emerald-400' : st.textSecondary}`}>
                        {isFirst ? 'Latest' : formatTimeElapsed(snap.created_at)}
                      </span>
                      <span className={`text-[10px] ${st.textFaint}`}>
                        {new Date(snap.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      {/* Value */}
                      <span className={`text-sm font-medium ${st.textPrimary}`}>
                        {formatCompactValue(snap.kpi_value)}
                      </span>

                      {/* Delta badge */}
                      {valueChange != null && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${
                            isPositive
                              ? 'bg-emerald-400/10 text-emerald-400'
                              : 'bg-red-400/10 text-red-400'
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {formatPctChange(valueChange)}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className={`flex items-center gap-3 mt-1 text-[10px] ${st.textDim}`}>
                      <span>{snap.asset_count} assets</span>
                      {snap.kpi_return_7d != null && (
                        <span>7d: {formatPctChange(snap.kpi_return_7d)}</span>
                      )}
                      {snap.top_mover_symbol && (
                        <span>
                          Top: {snap.top_mover_symbol}{' '}
                          {snap.top_mover_change != null
                            ? formatPctChange(snap.top_mover_change)
                            : ''}
                        </span>
                      )}
                      {snap.used_cache && (
                        <span className="text-amber-400/60">cached</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More */}
            {snapshots.length >= limit && (
              <button
                onClick={() => setLimit((l) => l + 20)}
                className={`w-full py-2 text-center text-xs ${st.textMuted} hover:text-emerald-400 flex items-center justify-center gap-1`}
              >
                <ChevronDown className="w-3 h-3" />
                Load more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
