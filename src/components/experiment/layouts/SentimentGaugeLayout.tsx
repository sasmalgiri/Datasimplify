'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface LayoutProps {
  coin: string;
  days: number;
}

export function SentimentGaugeLayout({}: LayoutProps) {
  const fearGreed = useLiveDashboardStore((s) => s.data.fearGreed);
  const markets = useLiveDashboardStore((s) => s.data.markets);
  const categories = useLiveDashboardStore((s) => s.data.categories);

  const current = fearGreed?.[0];
  const fgRawValue = current?.value ?? null;
  const fgValue = fgRawValue != null ? Number(fgRawValue) : null;
  const fgLabel = current?.value_classification ?? '';

  // Gauge color based on value
  const gaugeColor =
    fgValue == null || Number.isNaN(fgValue) ? 'text-gray-500' :
    fgValue <= 25 ? 'text-red-500' :
    fgValue <= 45 ? 'text-orange-400' :
    fgValue <= 55 ? 'text-yellow-400' :
    fgValue <= 75 ? 'text-lime-400' :
    'text-emerald-400';

  const gaugeBg =
    fgValue == null || Number.isNaN(fgValue) ? 'bg-gray-500/10' :
    fgValue <= 25 ? 'bg-red-500/10' :
    fgValue <= 45 ? 'bg-orange-400/10' :
    fgValue <= 55 ? 'bg-yellow-400/10' :
    fgValue <= 75 ? 'bg-lime-400/10' :
    'bg-emerald-400/10';

  // Top movers from markets
  const topGainers = markets
    ?.filter((c) => c.price_change_percentage_24h != null)
    .sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0))
    .slice(0, 5) ?? [];

  const topLosers = markets
    ?.filter((c) => c.price_change_percentage_24h != null)
    .sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0))
    .slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      {/* Fear & Greed Gauge */}
      <div className={`${gaugeBg} border border-white/[0.06] rounded-xl p-8 text-center`}>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Fear & Greed Index</div>
        <div className={`text-6xl font-black ${gaugeColor}`}>{fgRawValue ?? '—'}</div>
        <div className={`text-lg font-semibold mt-1 ${gaugeColor}`}>{fgLabel || 'No Data'}</div>
        {current?.timestamp && (
          <div className="text-[10px] text-gray-600 mt-2">
            Updated: {new Date(Number(current.timestamp) * 1000).toLocaleDateString()}
          </div>
        )}
        {/* Scale bar */}
        <div className="mt-4 max-w-md mx-auto">
          <div className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400 relative">
            {fgValue != null && !Number.isNaN(fgValue) && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-900 shadow"
                style={{ left: `${fgValue}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-[9px] text-gray-600 mt-1">
            <span>Extreme Fear</span>
            <span>Neutral</span>
            <span>Extreme Greed</span>
          </div>
        </div>
      </div>

      {/* Historical Fear & Greed */}
      {fearGreed && fearGreed.length > 1 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Fear & Greed History</h3>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="border-b border-white/[0.06] text-gray-500">
                  <th className="text-left px-2 py-1.5 font-medium">Date</th>
                  <th className="text-right px-2 py-1.5 font-medium">Value</th>
                  <th className="text-left px-2 py-1.5 font-medium">Classification</th>
                  <th className="text-right px-2 py-1.5 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {fearGreed.slice(0, 30).map((entry, idx) => {
                  const prev = idx < fearGreed.length - 1 ? fearGreed[idx + 1] : null;
                  const change = prev ? Number(entry.value) - Number(prev.value) : 0;
                  const val = Number(entry.value);
                  const color =
                    val <= 25 ? 'text-red-500' :
                    val <= 45 ? 'text-orange-400' :
                    val <= 55 ? 'text-yellow-400' :
                    val <= 75 ? 'text-lime-400' :
                    'text-emerald-400';
                  return (
                    <tr key={entry.timestamp} className="border-b border-white/[0.02]">
                      <td className="px-2 py-1 text-gray-400">
                        {new Date(Number(entry.timestamp) * 1000).toLocaleDateString()}
                      </td>
                      <td className={`px-2 py-1 text-right font-mono font-medium ${color}`}>{entry.value}</td>
                      <td className="px-2 py-1 text-gray-400">{entry.value_classification}</td>
                      <td className={`px-2 py-1 text-right font-mono ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change !== 0 ? `${change >= 0 ? '+' : ''}${change}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Market Mood - Top Movers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top Gainers */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-emerald-400 mb-3">Top Gainers (24h)</h3>
          {topGainers.length > 0 ? (
            <div className="space-y-2">
              {topGainers.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {c.image && <img src={c.image} alt={`${c.symbol?.toUpperCase()} logo`} className="w-4 h-4 rounded-full" />}
                    <span className="text-xs text-white font-medium">{c.symbol?.toUpperCase()}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">
                    +{(c.price_change_percentage_24h ?? 0).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500">No data</div>
          )}
        </div>

        {/* Top Losers */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-400 mb-3">Top Losers (24h)</h3>
          {topLosers.length > 0 ? (
            <div className="space-y-2">
              {topLosers.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {c.image && <img src={c.image} alt={`${c.symbol?.toUpperCase()} logo`} className="w-4 h-4 rounded-full" />}
                    <span className="text-xs text-white font-medium">{c.symbol?.toUpperCase()}</span>
                  </div>
                  <span className="text-xs text-red-400 font-mono">
                    {(c.price_change_percentage_24h ?? 0).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500">No data</div>
          )}
        </div>
      </div>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Market Categories</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-500">
                  <th className="text-left px-3 py-2 font-medium">Category</th>
                  <th className="text-right px-3 py-2 font-medium">Market Cap</th>
                  <th className="text-right px-3 py-2 font-medium">24h %</th>
                  <th className="text-right px-3 py-2 font-medium">Top Coins</th>
                </tr>
              </thead>
              <tbody>
                {categories.slice(0, 20).map((cat) => (
                  <tr key={cat.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                    <td className="px-3 py-2 text-white font-medium">{cat.name}</td>
                    <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(cat.market_cap)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${(cat.market_cap_change_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {cat.market_cap_change_24h != null
                        ? `${cat.market_cap_change_24h >= 0 ? '+' : ''}${cat.market_cap_change_24h.toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400 truncate max-w-[150px]">
                      {cat.top_3_coins?.map((url: string) => {
                        const name = url.split('/').pop()?.split('.')[0] ?? '';
                        return name;
                      }).join(', ') ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!fearGreed && !markets && (
        <div className="text-center py-16 text-gray-500 text-sm">No sentiment data available</div>
      )}
    </div>
  );
}

function formatLarge(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}
