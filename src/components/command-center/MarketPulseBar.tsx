'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';

function fearGreedColor(value: number): string {
  if (value <= 25) return '#ef4444';
  if (value <= 50) return '#f97316';
  if (value <= 75) return '#eab308';
  return '#22c55e';
}

function fearGreedLabel(value: number): string {
  if (value <= 25) return 'Extreme Fear';
  if (value <= 50) return 'Fear';
  if (value <= 75) return 'Greed';
  return 'Extreme Greed';
}

function formatCompactNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

export function MarketPulseBar() {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const data = useLiveDashboardStore((s) => s.data);
  const st = SITE_THEMES[siteTheme];

  const global = data.global as Record<string, any> | undefined;
  const markets = data.markets as any[] | undefined;
  const fearGreed = data.fearGreed as { value: string; value_classification: string }[] | undefined;

  const btc = markets?.find((c: any) => c.id === 'bitcoin');
  const totalMcap = global?.total_market_cap?.usd ?? 0;
  const totalVol = global?.total_volume?.usd ?? 0;
  const btcDom = global?.market_cap_percentage?.btc ?? 0;
  const mcapChange = global?.market_cap_change_percentage_24h_usd ?? null;

  const fg = fearGreed?.[0];
  const fgValue = fg ? parseInt(fg.value, 10) : null;

  // Skeleton
  if (!global && !markets) {
    return (
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white/[0.03] rounded-xl px-3 py-2 animate-pulse min-w-[140px] flex-1">
            <div className="h-2 bg-white/[0.06] rounded w-12 mb-2" />
            <div className="h-4 bg-white/[0.06] rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'BTC',
      value: btc ? `$${btc.current_price.toLocaleString()}` : '--',
      change: btc?.price_change_percentage_24h ?? null,
    },
    {
      label: 'Market Cap',
      value: totalMcap ? formatCompactNum(totalMcap) : '--',
      change: mcapChange,
    },
    {
      label: 'BTC Dom.',
      value: btcDom ? `${btcDom.toFixed(1)}%` : '--',
      extra: btcDom > 0 ? (
        <div className="w-12 h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-1">
          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${btcDom}%` }} />
        </div>
      ) : null,
    },
    {
      label: 'Fear & Greed',
      value: fgValue != null ? `${fgValue}` : '--',
      extra: fgValue != null ? (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fearGreedColor(fgValue) }} />
          <span className="text-[9px] text-gray-400">{fearGreedLabel(fgValue)}</span>
        </div>
      ) : null,
    },
    {
      label: '24h Volume',
      value: totalVol ? formatCompactNum(totalVol) : '--',
    },
  ];

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
      {metrics.map((m) => {
        const changeColor = m.change == null ? '' : m.change >= 0 ? 'text-emerald-400' : 'text-red-400';
        return (
          <div
            key={m.label}
            className={`${st.cardClasses} px-3 py-2 min-w-[130px] flex-1 transition-colors duration-200`}
          >
            <p className="text-[9px] uppercase tracking-wider text-gray-500 font-medium mb-1">{m.label}</p>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${st.textPrimary}`}>{m.value}</span>
              {m.change != null && (
                <span className={`text-[10px] font-medium ${changeColor}`}>
                  {m.change >= 0 ? '+' : ''}{m.change.toFixed(1)}%
                </span>
              )}
            </div>
            {m.extra}
          </div>
        );
      })}
    </div>
  );
}
