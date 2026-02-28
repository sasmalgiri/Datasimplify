'use client';

import { useState, useMemo } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle, Zap, Shield } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';

interface InsightsPanelProps {
  filteredMarkets: any[];
  isHoldings: boolean;
  holdingsPnL: { totalPnL: number; totalPnLPct: number; rows: { symbol: string; pnl: number; pnlPct: number }[] } | null;
}

interface Insight {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  text: string;
  severity: 'info' | 'warning' | 'positive' | 'negative';
}

export function InsightsPanel({ filteredMarkets, isHoldings, holdingsPnL }: InsightsPanelProps) {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const data = useLiveDashboardStore((s) => s.data);
  const st = SITE_THEMES[siteTheme];

  const [collapsed, setCollapsed] = useState(false);

  const global = data.global as Record<string, any> | undefined;
  const btcDom = global?.market_cap_percentage?.btc ?? 0;

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];
    if (filteredMarkets.length === 0) return result;

    // 1. Portfolio performance
    const gaining = filteredMarkets.filter((m: any) => (m.price_change_percentage_24h ?? 0) > 0).length;
    const pctGaining = Math.round((gaining / filteredMarkets.length) * 100);
    if (pctGaining >= 70) {
      result.push({
        icon: TrendingUp,
        iconColor: 'text-emerald-400',
        text: `${pctGaining}% of your coins are green today — strong bullish momentum across your portfolio.`,
        severity: 'positive',
      });
    } else if (pctGaining <= 30) {
      result.push({
        icon: TrendingDown,
        iconColor: 'text-red-400',
        text: `Only ${pctGaining}% of your coins are green — broad-based selling pressure today.`,
        severity: 'negative',
      });
    }

    // 2. BTC Dominance trend
    if (btcDom > 0) {
      if (btcDom > 60) {
        result.push({
          icon: Shield,
          iconColor: 'text-amber-400',
          text: `BTC dominance at ${btcDom.toFixed(1)}% — capital is concentrating in Bitcoin. Altcoins may underperform.`,
          severity: 'warning',
        });
      } else if (btcDom < 45) {
        result.push({
          icon: Zap,
          iconColor: 'text-blue-400',
          text: `BTC dominance at ${btcDom.toFixed(1)}% — alt season conditions. Diversified portfolios may outperform.`,
          severity: 'info',
        });
      }
    }

    // 3. Coins with big drops
    const bigDroppers = filteredMarkets.filter((m: any) => (m.price_change_percentage_24h ?? 0) < -5);
    if (bigDroppers.length > 0) {
      const names = bigDroppers.slice(0, 3).map((m: any) => m.symbol.toUpperCase()).join(', ');
      result.push({
        icon: AlertTriangle,
        iconColor: 'text-red-400',
        text: `${bigDroppers.length} coin${bigDroppers.length > 1 ? 's' : ''} dropped >5% today: ${names}${bigDroppers.length > 3 ? ` +${bigDroppers.length - 3} more` : ''}.`,
        severity: 'negative',
      });
    }

    // 4. Coins with big gains
    const bigGainers = filteredMarkets.filter((m: any) => (m.price_change_percentage_24h ?? 0) > 10);
    if (bigGainers.length > 0) {
      const names = bigGainers.slice(0, 3).map((m: any) => m.symbol.toUpperCase()).join(', ');
      result.push({
        icon: Zap,
        iconColor: 'text-emerald-400',
        text: `${bigGainers.length} coin${bigGainers.length > 1 ? 's' : ''} surged >10% today: ${names}. Consider taking partial profits.`,
        severity: 'positive',
      });
    }

    // 5. Holdings-specific: biggest drag
    if (isHoldings && holdingsPnL && holdingsPnL.rows.length > 0) {
      const worstRow = [...holdingsPnL.rows].sort((a, b) => a.pnl - b.pnl)[0];
      if (worstRow && worstRow.pnl < 0) {
        result.push({
          icon: TrendingDown,
          iconColor: 'text-red-400',
          text: `${worstRow.symbol} is your biggest drag at ${worstRow.pnlPct.toFixed(1)}% unrealized loss. Review your position sizing.`,
          severity: 'negative',
        });
      }
    }

    // Fallback: always show at least one
    if (result.length === 0) {
      result.push({
        icon: Lightbulb,
        iconColor: 'text-blue-400',
        text: `Tracking ${filteredMarkets.length} coins. Market data is current — refresh to keep monitoring.`,
        severity: 'info',
      });
    }

    return result;
  }, [filteredMarkets, btcDom, isHoldings, holdingsPnL]);

  if (insights.length === 0) return null;

  const SEVERITY_BG = {
    info: 'border-l-blue-400/30',
    warning: 'border-l-amber-400/30',
    positive: 'border-l-emerald-400/30',
    negative: 'border-l-red-400/30',
  };

  return (
    <div className={`${st.cardClasses} mb-6 overflow-hidden`}>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-4 py-3 ${st.textSecondary} hover:bg-white/[0.02] transition`}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">Insights</span>
          <span className="text-[10px] text-gray-500 font-normal">({insights.length})</span>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 space-y-2">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 pl-3 pr-2 py-2 border-l-2 ${SEVERITY_BG[insight.severity]} bg-white/[0.01] rounded-r-lg`}
              >
                <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${insight.iconColor}`} />
                <p className={`text-[11px] leading-relaxed ${st.textSecondary}`}>{insight.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
