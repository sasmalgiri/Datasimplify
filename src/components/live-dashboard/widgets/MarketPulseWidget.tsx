'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatPercent(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

/** Fear & Greed dot color based on 0-100 value */
function fearGreedDotColor(value: number): string {
  if (value <= 25) return '#ef4444';   // Extreme Fear - red
  if (value <= 50) return '#f97316';   // Fear - orange
  if (value <= 75) return '#eab308';   // Neutral/Greed - yellow
  return '#22c55e';                    // Extreme Greed - green
}

/* ------------------------------------------------------------------ */
/*  Skeleton placeholder for a single metric card                      */
/* ------------------------------------------------------------------ */

function MetricSkeleton() {
  return (
    <div className="bg-white/[0.04] rounded-xl px-3 py-2 animate-pulse min-w-[130px] flex-1">
      <div className="h-2.5 bg-white/[0.06] rounded w-14 mb-2" />
      <div className="h-5 bg-white/[0.06] rounded w-20 mb-1.5" />
      <div className="h-3 bg-white/[0.06] rounded w-12" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Individual metric card                                             */
/* ------------------------------------------------------------------ */

interface MetricCardProps {
  label: string;
  value: string;
  change?: number | null;
  accentColor: string;
  /** Render slot for extra content (dominance bar, F&G dot, etc.) */
  extra?: React.ReactNode;
}

function MetricCard({ label, value, change, accentColor, extra }: MetricCardProps) {
  const changeColor =
    change == null
      ? 'text-gray-500'
      : change >= 0
        ? 'text-emerald-400'
        : 'text-red-400';

  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 min-w-[130px] flex-1 transition-colors duration-200 hover:border-white/[0.12]">
      {/* Label */}
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium leading-none mb-1.5">
        {label}
      </p>

      {/* Value row */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold text-white leading-tight">{value}</span>
        {extra}
      </div>

      {/* Change indicator */}
      {change != null && (
        <p className={`text-[11px] font-medium mt-1 leading-none ${changeColor}`}>
          {change >= 0 ? '\u25B2' : '\u25BC'} {formatPercent(change)}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main widget                                                        */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface MarketPulseWidgetProps {}

export function MarketPulseWidget(_props: MarketPulseWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const global = data.global;
  const markets = data.markets;
  const fearGreed = data.fearGreed;

  /* ----- Still loading: show skeletons ----- */
  if (!global && !markets) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricSkeleton key={i} />
        ))}
      </div>
    );
  }

  /* ----- Derive values ----- */
  const btc = markets?.find((c) => c.id === 'bitcoin');
  const eth = markets?.find((c) => c.id === 'ethereum');

  const totalMcap = global?.total_market_cap?.usd ?? 0;
  const totalVol = global?.total_volume?.usd ?? 0;
  const btcDom = global?.market_cap_percentage?.btc ?? 0;
  const mcapChange = global?.market_cap_change_percentage_24h_usd ?? null;

  const fg = fearGreed?.[0];
  const fgValue = fg ? parseInt(fg.value, 10) : null;
  const fgLabel = fg?.value_classification ?? null;

  /* ----- Market Brief ----- */
  const marketBrief = useMemo(() => {
    if (!markets?.length) return null;
    const gaining = markets.filter((c) => (c.price_change_percentage_24h || 0) > 0).length;
    const pctGaining = ((gaining / markets.length) * 100).toFixed(0);
    const direction = gaining > markets.length * 0.6 ? 'bullish' : gaining < markets.length * 0.4 ? 'bearish' : 'mixed';

    let fgContext = '';
    if (fgValue != null) {
      if (fgValue <= 25) fgContext = `Fear & Greed at ${fgValue} (Extreme Fear — historically a buying zone)`;
      else if (fgValue <= 50) fgContext = `Fear & Greed at ${fgValue} (Fear)`;
      else if (fgValue <= 75) fgContext = `Fear & Greed at ${fgValue} (Greed)`;
      else fgContext = `Fear & Greed at ${fgValue} (Extreme Greed — historically a sell zone)`;
    }

    const domText = btcDom > 0 ? `BTC dominance at ${btcDom.toFixed(1)}%` : '';
    const mcapText = mcapChange != null ? `Total market cap ${mcapChange >= 0 ? 'up' : 'down'} ${Math.abs(mcapChange).toFixed(2)}% in 24h` : '';

    const parts = [`Market is ${direction} — ${pctGaining}% of top coins gaining`, domText, fgContext, mcapText].filter(Boolean);
    return parts.join('. ') + '.';
  }, [markets, fgValue, btcDom, mcapChange]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
      {/* BTC Price */}
      <MetricCard
        label="BTC"
        value={btc ? `$${btc.current_price.toLocaleString()}` : '--'}
        change={btc?.price_change_percentage_24h ?? null}
        accentColor={themeColors.primary}
      />

      {/* ETH Price */}
      <MetricCard
        label="ETH"
        value={eth ? `$${eth.current_price.toLocaleString()}` : '--'}
        change={eth?.price_change_percentage_24h ?? null}
        accentColor={themeColors.primary}
      />

      {/* BTC Dominance */}
      <MetricCard
        label="BTC Dominance"
        value={btcDom ? `${btcDom.toFixed(1)}%` : '--'}
        accentColor={themeColors.primary}
        extra={
          btcDom > 0 ? (
            <div className="flex-1 max-w-[48px] h-1.5 rounded-full bg-white/[0.06] overflow-hidden ml-1">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(btcDom, 100)}%`,
                  backgroundColor: themeColors.primary,
                }}
              />
            </div>
          ) : null
        }
      />

      {/* Total Market Cap */}
      <MetricCard
        label="Market Cap"
        value={totalMcap ? formatCompact(totalMcap) : '--'}
        change={mcapChange}
        accentColor={themeColors.primary}
      />

      {/* Fear & Greed Index */}
      <MetricCard
        label="Fear & Greed"
        value={fgValue != null ? String(fgValue) : '--'}
        accentColor={themeColors.primary}
        extra={
          fgValue != null ? (
            <div className="flex items-center gap-1.5 ml-1">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: fearGreedDotColor(fgValue) }}
              />
              <span className="text-[10px] text-gray-400 leading-none whitespace-nowrap">
                {fgLabel}
              </span>
            </div>
          ) : null
        }
      />

      {/* 24h Total Volume */}
      <MetricCard
        label="24h Volume"
        value={totalVol ? formatCompact(totalVol) : '--'}
        accentColor={themeColors.primary}
      />
      </div>
      {marketBrief && (
        <p className="text-[10px] text-gray-400 mt-2 text-center italic">{marketBrief}</p>
      )}
    </div>
  );
}
