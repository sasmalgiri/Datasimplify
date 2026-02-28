'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface LayoutProps {
  coin: string;
  days: number;
}

export function DefiProtocolLayout({}: LayoutProps) {
  const protocols = useLiveDashboardStore((s) => s.data.defiProtocols);
  const chains = useLiveDashboardStore((s) => s.data.defiChains);
  const tvlHistory = useLiveDashboardStore((s) => s.data.defiTvlHistory);

  const totalTvl = protocols?.reduce((sum, p) => sum + (p.tvl || 0), 0) ?? 0;
  const topProtocols = protocols?.slice(0, 30) ?? [];

  return (
    <div className="space-y-6">
      {/* KPIs */}
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

      {/* Chain breakdown */}
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

      {/* Protocol table */}
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

      {/* TVL History */}
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
