'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { useWorkspaceStore, useActiveWorkspace, useLatestSnapshot, usePreviousSnapshot } from '@/lib/workspaces/workspaceStore';
import { computeDelta, formatCompactValue, formatPctChange, type DeltaSummary } from '@/lib/workspaces/deltaEngine';

export function DeltaView() {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];
  const markets = useLiveDashboardStore((s) => s.data.markets);

  const activeWorkspace = useActiveWorkspace();
  const latest = useLatestSnapshot();
  const previous = usePreviousSnapshot();
  const [expanded, setExpanded] = useState(false);

  const delta = useMemo<DeltaSummary | null>(() => {
    if (!latest || !previous) return null;
    return computeDelta(latest, previous, markets);
  }, [latest, previous, markets]);

  if (!activeWorkspace || !delta) return null;

  const isPositive = (delta.valuePctChange ?? 0) >= 0;

  return (
    <div className={`${st.cardClasses} overflow-hidden transition-all duration-300`}>
      {/* Summary Pill (always visible) */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full px-4 py-3 flex items-center justify-between ${st.cardHover}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isPositive ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
          <div className="text-left">
            <span className={`text-sm font-medium ${st.textPrimary}`}>
              {delta.valuePctChange != null
                ? `${isPositive ? '+' : ''}${delta.valuePctChange}%`
                : 'No change data'}
            </span>
            {delta.valueChange != null && (
              <span className={`text-xs ml-2 ${st.textDim}`}>
                ({isPositive ? '+' : ''}{formatCompactValue(delta.valueChange)})
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${st.textFaint} flex items-center gap-1`}>
            <Clock className="w-3 h-3" />
            {delta.timeElapsed}
          </span>
          {expanded ? (
            <ChevronUp className={`w-4 h-4 ${st.textDim}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${st.textDim}`} />
          )}
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className={`px-4 pb-4 border-t ${st.divider}`}>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <KPICard
              label="Total Value"
              current={formatCompactValue(latest?.kpi_value ?? null)}
              change={
                delta.valueChange != null
                  ? `${delta.valueChange >= 0 ? '+' : ''}${formatCompactValue(delta.valueChange)}`
                  : null
              }
              isPositive={delta.valueChange != null ? delta.valueChange >= 0 : null}
              st={st}
            />
            <KPICard
              label="7d Return"
              current={formatPctChange(latest?.kpi_return_7d ?? null)}
              change={
                delta.return7dChange != null
                  ? `${delta.return7dChange >= 0 ? '+' : ''}${delta.return7dChange.toFixed(2)}pp`
                  : null
              }
              isPositive={delta.return7dChange != null ? delta.return7dChange >= 0 : null}
              st={st}
            />
            <KPICard
              label="30d Return"
              current={formatPctChange(latest?.kpi_return_30d ?? null)}
              change={
                delta.return30dChange != null
                  ? `${delta.return30dChange >= 0 ? '+' : ''}${delta.return30dChange.toFixed(2)}pp`
                  : null
              }
              isPositive={delta.return30dChange != null ? delta.return30dChange >= 0 : null}
              st={st}
            />
            <KPICard
              label="Assets"
              current={String(latest?.asset_count ?? 0)}
              change={
                delta.assetCountChange !== 0
                  ? `${delta.assetCountChange > 0 ? '+' : ''}${delta.assetCountChange}`
                  : null
              }
              isPositive={delta.assetCountChange > 0 ? true : delta.assetCountChange < 0 ? false : null}
              st={st}
            />
          </div>

          {/* Biggest Drivers */}
          {delta.drivers.length > 0 && (
            <div className="mt-4">
              <h4 className={`text-xs font-medium uppercase mb-2 ${st.textDim}`}>
                Biggest Drivers
              </h4>
              <div className="flex flex-wrap gap-2">
                {delta.drivers.slice(0, 8).map((d) => (
                  <span
                    key={d.coinId}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      d.direction === 'up'
                        ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                        : d.direction === 'down'
                          ? 'bg-red-400/10 text-red-400 border border-red-400/20'
                          : `${st.subtleBg} ${st.textDim} border ${st.subtleBorder}`
                    }`}
                  >
                    {d.direction === 'up' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : d.direction === 'down' ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                    {d.symbol} {d.pricePctChange >= 0 ? '+' : ''}{d.pricePctChange}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Added/Removed coins */}
          {(delta.addedCoins.length > 0 || delta.removedCoins.length > 0) && (
            <div className={`mt-3 text-xs ${st.textDim}`}>
              {delta.addedCoins.length > 0 && (
                <span className="text-emerald-400">
                  +{delta.addedCoins.join(', ')}
                </span>
              )}
              {delta.addedCoins.length > 0 && delta.removedCoins.length > 0 && ' · '}
              {delta.removedCoins.length > 0 && (
                <span className="text-red-400">
                  -{delta.removedCoins.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KPICard({
  label,
  current,
  change,
  isPositive,
  st,
}: {
  label: string;
  current: string;
  change: string | null;
  isPositive: boolean | null;
  st: any;
}) {
  return (
    <div className={`${st.subtleBg} rounded-xl p-3 border ${st.subtleBorder}`}>
      <p className={`text-[10px] uppercase font-medium mb-1 ${st.textDim}`}>{label}</p>
      <p className={`text-sm font-semibold ${st.textPrimary}`}>{current}</p>
      {change && (
        <p
          className={`text-xs mt-0.5 ${
            isPositive === true
              ? 'text-emerald-400'
              : isPositive === false
                ? 'text-red-400'
                : st.textDim
          }`}
        >
          {change}
        </p>
      )}
    </div>
  );
}
