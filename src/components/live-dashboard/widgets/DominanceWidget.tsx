'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

const COLORS = ['#f7931a', '#627eea', '#26a17b', '#e84142', '#8247e5', '#00d395', '#64748b'];

export function DominanceWidget() {
  const { data } = useLiveDashboardStore();
  const global = data.global;

  if (!global?.market_cap_percentage) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-6 bg-gray-700 rounded w-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const entries = Object.entries(global.market_cap_percentage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div>
      {/* Horizontal stacked bar */}
      <div className="flex rounded-full overflow-hidden h-5 mb-4">
        {entries.map(([symbol, pct], i) => (
          <div
            key={symbol}
            style={{ width: `${(pct / total) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
            className="transition-all duration-500"
            title={`${symbol.toUpperCase()}: ${pct.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {entries.map(([symbol, pct], i) => (
          <div key={symbol} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-gray-300 uppercase font-medium">{symbol}</span>
            </div>
            <span className="text-white font-semibold">{pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
