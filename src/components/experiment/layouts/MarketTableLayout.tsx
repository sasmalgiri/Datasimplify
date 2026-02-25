'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface LayoutProps {
  coin: string;
  days: number;
}

export function MarketTableLayout({ coin }: LayoutProps) {
  const markets = useLiveDashboardStore((s) => s.data.markets);
  const global = useLiveDashboardStore((s) => s.data.global);
  const fearGreed = useLiveDashboardStore((s) => s.data.fearGreed);

  const fgRawValue = fearGreed?.[0]?.value ?? null;
  const fgValue = fgRawValue != null ? Number(fgRawValue) : null;
  const fgLabel = fearGreed?.[0]?.value_classification ?? '';

  return (
    <div className="space-y-6">
      {/* Global KPIs */}
      {global && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Total Market Cap" value={formatLarge(global.total_market_cap?.usd)} />
          <KPI label="24h Volume" value={formatLarge(global.total_volume?.usd)} />
          <KPI label="BTC Dominance" value={`${(global.market_cap_percentage?.btc ?? 0).toFixed(1)}%`} />
          <KPI
            label="Fear & Greed"
            value={fgRawValue != null ? `${fgRawValue} — ${fgLabel}` : '—'}
            color={
              fgValue != null && !Number.isNaN(fgValue)
                ? fgValue < 30
                  ? 'text-red-400'
                  : fgValue > 70
                    ? 'text-green-400'
                    : 'text-yellow-400'
                : undefined
            }
          />
        </div>
      )}

      {/* Market Table */}
      {markets && markets.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-500">
                  <th className="text-left px-3 py-2.5 font-medium">#</th>
                  <th className="text-left px-3 py-2.5 font-medium">Coin</th>
                  <th className="text-right px-3 py-2.5 font-medium">Price</th>
                  <th className="text-right px-3 py-2.5 font-medium">24h %</th>
                  <th className="text-right px-3 py-2.5 font-medium">7d %</th>
                  <th className="text-right px-3 py-2.5 font-medium">Market Cap</th>
                  <th className="text-right px-3 py-2.5 font-medium">Volume (24h)</th>
                </tr>
              </thead>
              <tbody>
                {markets.slice(0, 50).map((c) => (
                  <tr key={c.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition ${c.id === coin ? 'bg-emerald-400/5' : ''}`}>
                    <td className="px-3 py-2 text-gray-500">{c.market_cap_rank}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full" />}
                        <span className="text-white font-medium">{c.name}</span>
                        <span className="text-gray-500 uppercase">{c.symbol}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-white font-mono">${formatPrice(c.current_price)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${pctColor(c.price_change_percentage_24h)}`}>
                      {formatPct(c.price_change_percentage_24h)}
                    </td>
                    <td className={`px-3 py-2 text-right font-mono ${pctColor(c.price_change_percentage_7d_in_currency)}`}>
                      {formatPct(c.price_change_percentage_7d_in_currency)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(c.market_cap)}</td>
                    <td className="px-3 py-2 text-right text-gray-400 font-mono">{formatLarge(c.total_volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!markets && (
        <div className="text-center py-16 text-gray-500 text-sm">No market data available</div>
      )}
    </div>
  );
}

// ─── Helpers ───

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

function formatPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toPrecision(4);
}

function formatPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function pctColor(n: number | null | undefined): string {
  if (n == null) return 'text-gray-500';
  return n >= 0 ? 'text-emerald-400' : 'text-red-400';
}
