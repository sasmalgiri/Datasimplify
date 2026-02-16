'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';
import { ArrowUp, ArrowDown } from 'lucide-react';

function getFlowZone(mfi: number): { label: string; color: string; description: string } {
  if (mfi <= 20) return { label: 'OVERSOLD', color: '#22c55e', description: 'Strong buying opportunity — extreme selling pressure exhausted' };
  if (mfi <= 40) return { label: 'ACCUMULATION', color: '#84cc16', description: 'Money flowing in — buyers accumulating positions' };
  if (mfi <= 60) return { label: 'NEUTRAL', color: '#eab308', description: 'Balanced flow — no clear directional pressure' };
  if (mfi <= 80) return { label: 'DISTRIBUTION', color: '#f97316', description: 'Money flowing out — sellers taking profits' };
  return { label: 'OVERBOUGHT', color: '#ef4444', description: 'Extreme buying pressure — potential reversal zone' };
}

export function MoneyFlowIndexWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { mfi, zone, coinFlows, divergence, insight } = useMemo(() => {
    const markets = data.markets;
    if (!markets || markets.length < 10) return { mfi: null, zone: null, coinFlows: null, divergence: null, insight: null };

    const top20 = markets.slice(0, 20);
    let totalPositiveFlow = 0;
    let totalNegativeFlow = 0;
    let positiveCount = 0;

    const flows: { name: string; symbol: string; direction: 'up' | 'down'; flowStrength: number }[] = [];

    for (const coin of top20) {
      if (!coin.sparkline_in_7d?.price || coin.sparkline_in_7d.price.length < 20) continue;

      const prices = coin.sparkline_in_7d.price;
      // Estimate volume per period (distribute total daily vol across sparkline periods)
      const periodsPerDay = prices.length / 7;
      const volPerPeriod = coin.total_volume / Math.max(1, periodsPerDay);

      let posFlow = 0;
      let negFlow = 0;
      for (let i = 1; i < prices.length; i++) {
        const typicalPrice = prices[i];
        const flow = typicalPrice * volPerPeriod;
        if (prices[i] > prices[i - 1]) {
          posFlow += flow;
        } else {
          negFlow += flow;
        }
      }

      // Weight by market cap rank (bigger coins matter more)
      const weight = coin.market_cap / top20.reduce((s, m) => s + m.market_cap, 0);
      totalPositiveFlow += posFlow * weight;
      totalNegativeFlow += negFlow * weight;

      const coinDirection = posFlow > negFlow ? 'up' : 'down';
      if (coinDirection === 'up') positiveCount++;
      const strength = negFlow > 0 ? posFlow / negFlow : 2;
      flows.push({
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        direction: coinDirection as 'up' | 'down',
        flowStrength: strength,
      });
    }

    // MFI calculation
    const moneyRatio = totalNegativeFlow > 0 ? totalPositiveFlow / totalNegativeFlow : 1;
    const mfiValue = Math.round(100 - (100 / (1 + moneyRatio)));
    const clampedMfi = Math.min(100, Math.max(0, mfiValue));
    const flowZone = getFlowZone(clampedMfi);

    // Sort by flow strength and pick top 5
    const topFlows = flows
      .sort((a, b) => Math.abs(b.flowStrength - 1) - Math.abs(a.flowStrength - 1))
      .slice(0, 5);

    // Divergence detection: MFI says one thing, price says another
    const marketAvgChange = top20.reduce((s, m) => s + (m.price_change_percentage_24h || 0), 0) / top20.length;
    const priceDirection = marketAvgChange > 1 ? 'up' : marketAvgChange < -1 ? 'down' : 'neutral';
    const mfiDirection = clampedMfi > 60 ? 'up' : clampedMfi < 40 ? 'down' : 'neutral';
    let divWarning: string | null = null;
    if (priceDirection === 'up' && mfiDirection === 'down') {
      divWarning = 'Bearish divergence — prices rising but money flow declining. Watch for reversal.';
    } else if (priceDirection === 'down' && mfiDirection === 'up') {
      divWarning = 'Bullish divergence — prices falling but money flow increasing. Accumulation detected.';
    }

    const insightText = `MFI at ${clampedMfi} — ${flowZone.label.toLowerCase()}. ${positiveCount}/${flows.length} coins showing positive money flow.${divWarning ? ` ${divWarning}` : ''}`;

    return { mfi: clampedMfi, zone: flowZone, coinFlows: topFlows, divergence: divWarning, insight: insightText };
  }, [data.markets]);

  if (!data.markets) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="h-32 w-32 rounded-full bg-gray-800/50" />
      </div>
    );
  }

  if (mfi === null || !zone) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Insufficient data</div>;
  }

  // SVG gauge
  const radius = 55;
  const circumference = Math.PI * radius;
  const offset = circumference - (mfi / 100) * circumference;

  return (
    <div>
      {/* Gauge */}
      <div className="flex flex-col items-center py-2">
        <svg width="150" height="90" viewBox="0 0 150 90">
          <defs>
            <linearGradient id="mfiGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="25%" stopColor="#84cc16" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <path
            d="M 10 85 A 55 55 0 0 1 140 85"
            fill="none"
            stroke="#374151"
            strokeWidth={10}
            strokeLinecap="round"
          />
          <path
            d="M 10 85 A 55 55 0 0 1 140 85"
            fill="none"
            stroke={zone.color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="text-2xl font-bold text-white -mt-3">{mfi}</div>
        <div className="text-sm font-bold mt-1" style={{ color: zone.color }}>{zone.label}</div>
        <div className="text-[10px] text-gray-500 mt-0.5 text-center max-w-[200px]">{zone.description}</div>
      </div>

      {/* Zone labels */}
      <div className="flex justify-between text-[8px] text-gray-600 px-2 mt-1">
        <span>Oversold</span>
        <span>Neutral</span>
        <span>Overbought</span>
      </div>

      {/* Divergence warning */}
      {divergence && (
        <div className="mt-2 mx-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-[10px] text-amber-400 font-medium">{divergence}</p>
        </div>
      )}

      {/* Top coin flows */}
      {coinFlows && coinFlows.length > 0 && (
        <div className="mt-3 space-y-1">
          {coinFlows.map((cf) => (
            <div key={cf.symbol} className="flex items-center gap-2 text-xs">
              {cf.direction === 'up' ? (
                <ArrowUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              ) : (
                <ArrowDown className="w-3 h-3 text-red-400 flex-shrink-0" />
              )}
              <span className="text-white font-medium w-12">{cf.symbol}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.abs(cf.flowStrength - 1) * 50 + 20)}%`,
                    backgroundColor: cf.direction === 'up' ? '#22c55e' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-gray-500 text-[10px]">
                {cf.direction === 'up' ? 'Inflow' : 'Outflow'}
              </span>
            </div>
          ))}
        </div>
      )}

      {insight && <p className="text-[10px] text-gray-400 mt-2 text-center italic">{insight}</p>}
    </div>
  );
}
