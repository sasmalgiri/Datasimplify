'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface LayoutProps {
  coin: string;
  days: number;
  templateId?: string;
}

export function DefiProtocolLayout({ templateId }: LayoutProps) {
  const protocols = useLiveDashboardStore((s) => s.data.defiProtocols);
  const chains = useLiveDashboardStore((s) => s.data.defiChains);
  const tvlHistory = useLiveDashboardStore((s) => s.data.defiTvlHistory);

  const totalTvl = protocols?.reduce((sum, p) => sum + (p.tvl || 0), 0) ?? 0;
  const topProtocols = protocols?.slice(0, 30) ?? [];

  // ─── DeFi Yields: protocol performance focus ───
  if (templateId === 'defi_yields') {
    // Sort by daily change to show yield/performance
    const byChange = protocols
      ? [...protocols].filter((p) => p.change_1d != null).sort((a, b) => (b.change_1d ?? 0) - (a.change_1d ?? 0))
      : [];
    const topPerformers = byChange.slice(0, 15);
    const bottomPerformers = byChange.slice(-15).reverse();

    // Protocols by category
    const categoryMap: Record<string, { count: number; tvl: number }> = {};
    protocols?.forEach((p) => {
      const cat = p.category || 'Unknown';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, tvl: 0 };
      categoryMap[cat].count++;
      categoryMap[cat].tvl += p.tvl || 0;
    });
    const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1].tvl - a[1].tvl).slice(0, 10);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Total DeFi TVL" value={formatLarge(totalTvl)} />
          <KPI label="Protocols" value={`${protocols?.length ?? 0}`} />
          <KPI label="Categories" value={`${Object.keys(categoryMap).length}`} />
          <KPI label="Chains" value={`${chains?.length ?? 0}`} />
        </div>

        {/* Top Performers by 1d change */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-emerald-400">Top Gainers (1d TVL Change)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">Protocol</th>
                    <th className="text-right px-3 py-2 font-medium">TVL</th>
                    <th className="text-right px-3 py-2 font-medium">1d %</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((p) => (
                    <tr key={p.name} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {p.logo && <img src={p.logo} alt={`${p.name} logo`} className="w-4 h-4 rounded-full" />}
                          <span className="text-white font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(p.tvl)}</td>
                      <td className="px-3 py-2 text-right text-emerald-400 font-mono font-bold">+{(p.change_1d ?? 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-red-400">Top Losers (1d TVL Change)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">Protocol</th>
                    <th className="text-right px-3 py-2 font-medium">TVL</th>
                    <th className="text-right px-3 py-2 font-medium">1d %</th>
                  </tr>
                </thead>
                <tbody>
                  {bottomPerformers.map((p) => (
                    <tr key={p.name} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {p.logo && <img src={p.logo} alt={`${p.name} logo`} className="w-4 h-4 rounded-full" />}
                          <span className="text-white font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(p.tvl)}</td>
                      <td className="px-3 py-2 text-right text-red-400 font-mono font-bold">{(p.change_1d ?? 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        {sortedCategories.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">DeFi Categories by TVL</h3>
            <div className="space-y-2">
              {sortedCategories.map(([cat, data]) => {
                const pct = totalTvl > 0 ? (data.tvl / totalTvl) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-white w-28 truncate font-medium">{cat}</span>
                    <div className="flex-1 h-4 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400/40 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 font-mono w-12 text-right">{pct.toFixed(1)}%</span>
                    <span className="text-xs text-gray-300 font-mono w-20 text-right">{formatLarge(data.tvl)}</span>
                    <span className="text-[10px] text-gray-500 w-8 text-right">{data.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!protocols && (
          <div className="text-center py-16 text-gray-500 text-sm">No DeFi data available</div>
        )}
      </div>
    );
  }

  // ─── Default: DeFi TVL (original view) ───
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Total DeFi TVL" value={formatLarge(totalTvl)} />
        <KPI label="Protocols Tracked" value={`${protocols?.length ?? 0}`} />
        <KPI label="Chains" value={`${chains?.length ?? 0}`} />
        <KPI
          label="TVL Trend"
          value={tvlHistory && tvlHistory.length > 1
            ? `${((tvlHistory[tvlHistory.length - 1].tvl / tvlHistory[0].tvl - 1) * 100).toFixed(1)}%`
            : '—'}
          color={tvlHistory && tvlHistory.length > 1 && tvlHistory[tvlHistory.length - 1].tvl > tvlHistory[0].tvl ? 'text-emerald-400' : 'text-red-400'}
        />
      </div>

      {chains && chains.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Top Chains by TVL</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {chains.slice(0, 8).map((chain) => (
              <div key={chain.name} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                <div className="text-xs font-medium text-white">{chain.name}</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{formatLarge(chain.tvl)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {topProtocols.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Top DeFi Protocols</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-500">
                  <th className="text-left px-3 py-2 font-medium">#</th>
                  <th className="text-left px-3 py-2 font-medium">Protocol</th>
                  <th className="text-left px-3 py-2 font-medium">Category</th>
                  <th className="text-left px-3 py-2 font-medium">Chains</th>
                  <th className="text-right px-3 py-2 font-medium">TVL</th>
                  <th className="text-right px-3 py-2 font-medium">1d %</th>
                </tr>
              </thead>
              <tbody>
                {topProtocols.map((p, i) => (
                  <tr key={p.name} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {p.logo && <img src={p.logo} alt={`${p.name} logo`} className="w-5 h-5 rounded-full" />}
                        <span className="text-white font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-400">{p.category || '—'}</td>
                    <td className="px-3 py-2 text-gray-400 truncate max-w-[120px]">
                      {p.chains?.slice(0, 3).join(', ') ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-white font-mono">{formatLarge(p.tvl)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${p.change_1d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {p.change_1d != null ? `${p.change_1d >= 0 ? '+' : ''}${p.change_1d.toFixed(2)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tvlHistory && tvlHistory.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">TVL History (last {tvlHistory.length} days)</h3>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="border-b border-white/[0.06] text-gray-500">
                  <th className="text-left px-2 py-1.5 font-medium">Date</th>
                  <th className="text-right px-2 py-1.5 font-medium">TVL</th>
                  <th className="text-right px-2 py-1.5 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {tvlHistory.slice(-30).map((entry, idx) => {
                  const prevIdx = tvlHistory.length - 30 + idx - 1;
                  const prev = prevIdx >= 0 ? tvlHistory[prevIdx]?.tvl : null;
                  const change = prev ? ((entry.tvl - prev) / prev) * 100 : 0;
                  return (
                    <tr key={entry.date} className="border-b border-white/[0.02]">
                      <td className="px-2 py-1 text-gray-400">
                        {new Date(entry.date * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-1 text-right text-white font-mono">{formatLarge(entry.tvl)}</td>
                      <td className={`px-2 py-1 text-right font-mono ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change !== 0 ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!protocols && (
        <div className="text-center py-16 text-gray-500 text-sm">No DeFi data available</div>
      )}
    </div>
  );
}

function KPI({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold ${color ?? 'text-white'}`}>{value}</div>
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
