'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface LayoutProps {
  coin: string;
  days: number;
}

export function DerivativesLayout({}: LayoutProps) {
  const tickers = useLiveDashboardStore((s) => s.data.derivatives);
  const exchanges = useLiveDashboardStore((s) => s.data.derivativesExchanges);
  const global = useLiveDashboardStore((s) => s.data.global);
  const markets = useLiveDashboardStore((s) => s.data.markets);

  const hasDerivativesData = Boolean(
    (tickers && tickers.length > 0) || (exchanges && exchanges.length > 0),
  );

  const topExchanges = exchanges?.slice(0, 30) ?? [];
  const topTickers = tickers?.slice(0, 30) ?? [];

  // Global derivatives stats
  const derivativesVolume24h = global?.total_volume?.usd ?? null;
  const totalMarketCap = global?.total_market_cap?.usd ?? null;

  // BTC & ETH from markets
  const btc = markets?.find((c) => c.id === 'bitcoin');
  const eth = markets?.find((c) => c.id === 'ethereum');

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Exchanges Tracked" value={`${exchanges?.length ?? 0}`} />
        <KPI label="Total Market Cap" value={formatLarge(totalMarketCap)} />
        <KPI label="24h Volume" value={formatLarge(derivativesVolume24h)} />
        <KPI
          label="BTC Price"
          value={btc ? `$${btc.current_price.toLocaleString()}` : '—'}
          color={btc && (btc.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
      </div>

      {/* Funding Rates Summary */}
      {topTickers.length > 0 && topTickers.some((d) => d.funding_rate != null) && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Funding Rates</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {topTickers
              .filter((d) => d.funding_rate != null)
              .slice(0, 8)
              .map((d) => {
                const rate = d.funding_rate ?? 0;
                return (
                  <div key={d.symbol} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                    <div className="text-[10px] text-gray-500 truncate">{d.market} — {d.symbol}</div>
                    <div className={`text-sm font-bold font-mono mt-0.5 ${rate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {rate >= 0 ? '+' : ''}{(rate * 100).toFixed(4)}%
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-600">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span>0% = neutral • positive = longs pay shorts</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
        </div>
      )}

      {/* Derivatives Exchanges Table */}
      {topExchanges.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Derivatives Exchanges</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-500">
                  <th className="text-left px-3 py-2 font-medium">#</th>
                  <th className="text-left px-3 py-2 font-medium">Exchange</th>
                  <th className="text-right px-3 py-2 font-medium">Open Interest (BTC)</th>
                  <th className="text-right px-3 py-2 font-medium">24h Volume</th>
                  <th className="text-right px-3 py-2 font-medium">Perpetuals</th>
                  <th className="text-right px-3 py-2 font-medium">Futures</th>
                </tr>
              </thead>
              <tbody>
                {topExchanges.map((d, i) => (
                  <tr key={d.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2">
                      <span className="text-white font-medium">{d.name}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-white font-mono">
                      {d.open_interest_btc != null ? formatBtc(d.open_interest_btc) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-300 font-mono">
                      {formatLarge(d.trade_volume_24h_btc != null ? Number(d.trade_volume_24h_btc) * (btc?.current_price ?? 0) : null)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {d.number_of_perpetual_pairs ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {d.number_of_futures_pairs ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Open Interest Overview */}
      {topExchanges.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Open Interest Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-gray-500">Total OI (BTC)</div>
              <div className="text-sm text-white font-mono font-bold">
                {formatBtc(topExchanges.reduce((sum, d) => sum + (d.open_interest_btc ?? 0), 0))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">Total OI (USD est.)</div>
              <div className="text-sm text-white font-mono font-bold">
                {formatLarge(
                  topExchanges.reduce((sum, d) => sum + (d.open_interest_btc ?? 0), 0) *
                  (btc?.current_price ?? 0)
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">Avg Funding Rate</div>
              <div className="text-sm text-yellow-400 font-mono font-bold">
                {(() => {
                  const rates = topTickers.filter((d) => d.funding_rate != null).map((d) => d.funding_rate!);
                  if (rates.length === 0) return '—';
                  const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
                  return `${avg >= 0 ? '+' : ''}${(avg * 100).toFixed(4)}%`;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Assets */}
      {(btc || eth) && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Key Assets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[btc, eth].filter(Boolean).map((asset) => (
              <div key={asset!.id} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {asset!.image && <img src={asset!.image} alt="" className="w-8 h-8 rounded-full" />}
                  <div>
                    <div className="text-sm font-medium text-white">{asset!.name}</div>
                    <div className="text-[10px] text-gray-500 uppercase">{asset!.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white font-mono">${asset!.current_price.toLocaleString()}</div>
                  <div className={`text-[10px] font-mono ${(asset!.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(asset!.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}
                    {(asset!.price_change_percentage_24h ?? 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasDerivativesData && (
        <div className="text-center py-16 text-gray-500 text-sm">No derivatives data available</div>
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

function formatBtc(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M BTC`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K BTC`;
  return `${n.toFixed(2)} BTC`;
}
