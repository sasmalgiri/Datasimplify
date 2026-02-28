'use client';

import { TrendingUp, TrendingDown, BarChart3, Wallet } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';

interface PortfolioOverviewProps {
  filteredMarkets: any[];
  isHoldings: boolean;
  holdingsPnL: {
    totalValue: number;
    totalCost: number;
    totalPnL: number;
    totalPnLPct: number;
  } | null;
  workspaceName: string;
}

export function PortfolioOverview({ filteredMarkets, isHoldings, holdingsPnL, workspaceName }: PortfolioOverviewProps) {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];

  if (filteredMarkets.length === 0) return null;

  // Total market cap of workspace coins
  const totalMcap = filteredMarkets.reduce((sum: number, m: any) => sum + (m.market_cap ?? 0), 0);

  // Weighted 24h change
  const weighted24h = totalMcap > 0
    ? filteredMarkets.reduce((sum: number, m: any) =>
      sum + ((m.price_change_percentage_24h ?? 0) * (m.market_cap ?? 0)), 0) / totalMcap
    : 0;

  // Best / worst movers
  const sorted = [...filteredMarkets].sort(
    (a: any, b: any) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // Primary value display
  const primaryValue = isHoldings && holdingsPnL
    ? `$${holdingsPnL.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : totalMcap >= 1e12
      ? `$${(totalMcap / 1e12).toFixed(2)}T`
      : `$${(totalMcap / 1e9).toFixed(1)}B`;

  const cards = [
    {
      label: isHoldings ? 'Portfolio Value' : 'Total Market Cap',
      value: primaryValue,
      icon: Wallet,
      iconColor: 'text-emerald-400',
      extra: isHoldings && holdingsPnL ? (
        <span className={`text-[10px] font-medium ${holdingsPnL.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          P&L: {holdingsPnL.totalPnL >= 0 ? '+' : ''}${holdingsPnL.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          ({holdingsPnL.totalPnLPct >= 0 ? '+' : ''}{holdingsPnL.totalPnLPct.toFixed(1)}%)
        </span>
      ) : null,
    },
    {
      label: '24h Performance',
      value: `${weighted24h >= 0 ? '+' : ''}${weighted24h.toFixed(2)}%`,
      valueColor: weighted24h >= 0 ? 'text-emerald-400' : 'text-red-400',
      icon: BarChart3,
      iconColor: weighted24h >= 0 ? 'text-emerald-400' : 'text-red-400',
      extra: (
        <span className="text-[10px] text-gray-500">
          Weighted avg across {filteredMarkets.length} coins
        </span>
      ),
    },
    {
      label: 'Top Mover',
      value: best ? `${best.symbol.toUpperCase()} ${(best.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}${(best.price_change_percentage_24h ?? 0).toFixed(1)}%` : '--',
      valueColor: 'text-emerald-400',
      icon: TrendingUp,
      iconColor: 'text-emerald-400',
      extra: best ? (
        <span className="text-[10px] text-gray-500">${best.current_price.toLocaleString()}</span>
      ) : null,
    },
    {
      label: 'Worst Mover',
      value: worst ? `${worst.symbol.toUpperCase()} ${(worst.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}${(worst.price_change_percentage_24h ?? 0).toFixed(1)}%` : '--',
      valueColor: 'text-red-400',
      icon: TrendingDown,
      iconColor: 'text-red-400',
      extra: worst ? (
        <span className="text-[10px] text-gray-500">${worst.current_price.toLocaleString()}</span>
      ) : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`${st.cardClasses} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${card.iconColor}`} />
              <p className={`text-[10px] uppercase tracking-wider font-medium ${st.textDim}`}>{card.label}</p>
            </div>
            <p className={`text-lg font-bold ${card.valueColor ?? st.textPrimary}`}>{card.value}</p>
            {card.extra && <div className="mt-1">{card.extra}</div>}
          </div>
        );
      })}
    </div>
  );
}
