'use client';

import { useMemo } from 'react';
import {
  Folder,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  BarChart3,
  Zap,
  X,
} from 'lucide-react';
import { useLiveDashboardStore, type MarketCoin } from '@/lib/live-dashboard/store';
import { useActiveWorkspace } from '@/lib/workspaces/workspaceStore';
import { getSiteThemeClasses, formatCompact, formatPrice, formatPercent, percentColor } from '@/lib/live-dashboard/theme';

interface WorkspaceContextBarProps {
  onDismiss?: () => void;
  onSyncCoins?: () => void;
}

export function WorkspaceContextBar({ onDismiss, onSyncCoins }: WorkspaceContextBarProps) {
  const activeWorkspace = useActiveWorkspace();
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const markets = useLiveDashboardStore((s) => s.data.markets);
  const vsCurrency = useLiveDashboardStore((s) => s.customization.vsCurrency);
  const st = getSiteThemeClasses(siteTheme);

  // Filter market data to workspace coins
  const workspaceCoins = useMemo(() => {
    if (!activeWorkspace || !markets) return [];
    const configCoins = activeWorkspace.config?.coins ?? [];
    if (configCoins.length === 0) return [];

    const coinSet = new Set(configCoins.map((c) => c.toLowerCase()));
    return markets.filter(
      (m) => coinSet.has(m.id.toLowerCase()) || coinSet.has(m.symbol.toLowerCase()),
    );
  }, [activeWorkspace, markets]);

  // Compute aggregate metrics
  const metrics = useMemo(() => {
    if (workspaceCoins.length === 0) return null;

    const totalMcap = workspaceCoins.reduce((sum, c) => sum + (c.market_cap || 0), 0);
    const totalVolume = workspaceCoins.reduce((sum, c) => sum + (c.total_volume || 0), 0);

    // Weighted average 24h change (by market cap)
    const totalWeight = workspaceCoins.reduce((sum, c) => sum + (c.market_cap || 0), 0);
    const avg24h =
      totalWeight > 0
        ? workspaceCoins.reduce(
            (sum, c) => sum + (c.price_change_percentage_24h || 0) * (c.market_cap || 0),
            0,
          ) / totalWeight
        : 0;

    // Best & worst movers
    let best: MarketCoin | null = null;
    let worst: MarketCoin | null = null;
    for (const c of workspaceCoins) {
      const ch = c.price_change_percentage_24h ?? 0;
      if (!best || ch > (best.price_change_percentage_24h ?? 0)) best = c;
      if (!worst || ch < (worst.price_change_percentage_24h ?? 0)) worst = c;
    }

    return { totalMcap, totalVolume, avg24h, best, worst };
  }, [workspaceCoins]);

  if (!activeWorkspace || !markets || workspaceCoins.length === 0) return null;

  return (
    <div className={`${st.cardClasses} p-3 space-y-3`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
            <Folder className="w-3 h-3 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">
              {activeWorkspace.name}
            </span>
          </div>
          <span className={`text-[10px] ${st.textDim}`}>
            {workspaceCoins.length}/{activeWorkspace.config?.coins?.length ?? 0} coins matched
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onSyncCoins && (
            <button
              onClick={onSyncCoins}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${st.chipActive} hover:bg-emerald-400/30 transition`}
              title="Sync dashboard to workspace coins"
            >
              <Zap className="w-3 h-3" />
              Sync Charts
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`p-1 rounded-lg ${st.buttonSecondary}`}
              title="Hide workspace bar"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics row */}
      {metrics && (
        <div className="flex items-center gap-4 flex-wrap">
          {/* Total Market Cap */}
          <div className="flex items-center gap-1.5">
            <BarChart3 className={`w-3.5 h-3.5 ${st.textDim}`} />
            <div>
              <p className={`text-[9px] uppercase tracking-wider ${st.textDim}`}>Portfolio MCap</p>
              <p className={`text-sm font-bold ${st.textPrimary}`}>
                {formatCompact(metrics.totalMcap, vsCurrency)}
              </p>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <Coins className={`w-3.5 h-3.5 ${st.textDim}`} />
            <div>
              <p className={`text-[9px] uppercase tracking-wider ${st.textDim}`}>24h Volume</p>
              <p className={`text-sm font-bold ${st.textPrimary}`}>
                {formatCompact(metrics.totalVolume, vsCurrency)}
              </p>
            </div>
          </div>

          {/* Avg 24h */}
          <div className="flex items-center gap-1.5">
            {metrics.avg24h >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            )}
            <div>
              <p className={`text-[9px] uppercase tracking-wider ${st.textDim}`}>Avg 24h</p>
              <p className={`text-sm font-bold ${percentColor(metrics.avg24h)}`}>
                {formatPercent(metrics.avg24h)}
              </p>
            </div>
          </div>

          {/* Best mover */}
          {metrics.best && (
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <p className={`text-[9px] uppercase tracking-wider ${st.textDim}`}>Best</p>
                <p className="text-sm font-bold text-emerald-400">
                  {metrics.best.symbol.toUpperCase()}{' '}
                  <span className="text-xs font-medium">
                    {formatPercent(metrics.best.price_change_percentage_24h)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Worst mover */}
          {metrics.worst && metrics.worst.id !== metrics.best?.id && (
            <div className="flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
              <div>
                <p className={`text-[9px] uppercase tracking-wider ${st.textDim}`}>Worst</p>
                <p className="text-sm font-bold text-red-400">
                  {metrics.worst.symbol.toUpperCase()}{' '}
                  <span className="text-xs font-medium">
                    {formatPercent(metrics.worst.price_change_percentage_24h)}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coin chips row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {workspaceCoins.map((coin) => {
          const ch = coin.price_change_percentage_24h ?? 0;
          return (
            <div
              key={coin.id}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${st.subtleBg} border ${st.subtleBorder} hover:border-emerald-400/20 transition`}
            >
              {coin.image && (
                <img src={coin.image} alt={coin.symbol} className="w-4 h-4 rounded-full" />
              )}
              <span className={`font-medium ${st.textPrimary}`}>
                {coin.symbol.toUpperCase()}
              </span>
              <span className={`${st.textDim}`}>
                {formatPrice(coin.current_price, vsCurrency)}
              </span>
              <span className={`font-medium ${percentColor(ch)}`}>
                {ch >= 0 ? '+' : ''}{ch.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
