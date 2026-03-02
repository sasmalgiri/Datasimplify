'use client';

import { useEffect, useState } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface GlobalData {
  total_market_cap?: Record<string, number>;
  total_volume?: Record<string, number>;
  market_cap_percentage?: Record<string, number>;
  market_cap_change_percentage_24h_usd?: number;
  active_cryptocurrencies?: number;
  markets?: number;
}

function formatLarge(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export default function GlobalMarketPage() {
  const [global, setGlobal] = useState<GlobalData | null>(null);
  const [fearGreed, setFearGreed] = useState<{ value: string; classification: string } | null>(null);
  const [topCoins, setTopCoins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [globalRes, fgRes, coinsRes] = await Promise.allSettled([
        fetch('/api/crypto/global'),
        fetch('/api/sentiment'),
        fetch('/api/crypto?limit=20'),
      ]);

      if (globalRes.status === 'fulfilled') {
        const g = await globalRes.value.json();
        if (g.data) setGlobal(g.data);
      }
      if (fgRes.status === 'fulfilled') {
        const fg = await fgRes.value.json();
        if (fg.data?.[0]) {
          setFearGreed({ value: fg.data[0].value, classification: fg.data[0].value_classification });
        }
      }
      if (coinsRes.status === 'fulfilled') {
        const c = await coinsRes.value.json();
        if (Array.isArray(c.data)) setTopCoins(c.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const mcapChange = global?.market_cap_change_percentage_24h_usd;
  const fgVal = fearGreed?.value ? Number(fearGreed.value) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Global Crypto Market</h1>
            <p className="text-gray-400">Real-time overview of the entire cryptocurrency market.</p>
          </div>
          <button type="button" onClick={fetchData} disabled={loading} aria-label="Refresh data" title="Refresh" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Total Market Cap" value={formatLarge(global?.total_market_cap?.usd)} />
          <StatCard label="24h Volume" value={formatLarge(global?.total_volume?.usd)} />
          <StatCard label="24h Change" value={mcapChange != null ? `${mcapChange >= 0 ? '+' : ''}${mcapChange.toFixed(2)}%` : '—'}
            color={mcapChange != null ? (mcapChange >= 0 ? 'text-emerald-400' : 'text-red-400') : undefined} />
          <StatCard label="BTC Dominance" value={global?.market_cap_percentage?.btc ? `${global.market_cap_percentage.btc.toFixed(1)}%` : '—'} />
          <StatCard label="Active Coins" value={global?.active_cryptocurrencies?.toLocaleString() ?? '—'} />
          <StatCard label="Fear & Greed"
            value={fgVal != null ? `${fgVal} — ${fearGreed?.classification}` : '—'}
            color={fgVal != null ? (fgVal < 30 ? 'text-red-400' : fgVal > 70 ? 'text-emerald-400' : 'text-yellow-400') : undefined} />
        </div>

        {/* Dominance Bars */}
        {global?.market_cap_percentage && (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Market Dominance</h2>
            <div className="space-y-3">
              {Object.entries(global.market_cap_percentage)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([coin, pct]) => (
                  <div key={coin} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 uppercase w-10">{coin}</span>
                    <div className="flex-1 bg-gray-700/50 rounded-full h-3 overflow-hidden">
                      <div className="bg-emerald-400/60 h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="text-xs text-white font-mono w-14 text-right">{pct.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Top 20 Coins Table */}
        {topCoins.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700/50">
              <h2 className="text-lg font-semibold">Top 20 Cryptocurrencies</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700/50">
                    <th className="text-left px-4 py-3 font-medium">#</th>
                    <th className="text-left px-4 py-3 font-medium">Coin</th>
                    <th className="text-right px-4 py-3 font-medium">Price</th>
                    <th className="text-right px-4 py-3 font-medium">24h</th>
                    <th className="text-right px-4 py-3 font-medium">Market Cap</th>
                    <th className="text-right px-4 py-3 font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {topCoins.map((c: any) => {
                    const change = c.price_change_percentage_24h;
                    return (
                      <tr key={c.id} className="border-b border-gray-800/30 hover:bg-gray-800/30 transition">
                        <td className="px-4 py-2.5 text-gray-500">{c.market_cap_rank}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {c.image && <img src={c.image} alt={c.name} className="w-5 h-5 rounded-full" />}
                            <span className="text-white font-medium">{c.name}</span>
                            <span className="text-gray-500 uppercase text-xs">{c.symbol}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right text-white font-mono">
                          ${c.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: c.current_price >= 1 ? 2 : 6 })}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-mono flex items-center justify-end gap-1 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-300 font-mono">{formatLarge(c.market_cap)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-400 font-mono">{formatLarge(c.total_volume)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold ${color ?? 'text-white'}`}>{value}</div>
    </div>
  );
}
