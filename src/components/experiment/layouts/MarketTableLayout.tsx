'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface LayoutProps {
  coin: string;
  days: number;
  templateId?: string;
}

export function MarketTableLayout({ coin, templateId }: LayoutProps) {
  const markets = useLiveDashboardStore((s) => s.data.markets);
  const global = useLiveDashboardStore((s) => s.data.global);
  const fearGreed = useLiveDashboardStore((s) => s.data.fearGreed);

  const fgRawValue = fearGreed?.[0]?.value ?? null;
  const fgValue = fgRawValue != null ? Number(fgRawValue) : null;
  const fgLabel = fearGreed?.[0]?.value_classification ?? '';

  // Template-specific data transformations
  const displayData = useMemo(() => {
    if (!markets || markets.length === 0) return { coins: [], gainers: [], losers: [] };
    const sorted24h = [...markets].sort(
      (a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0),
    );
    return {
      coins: markets,
      gainers: sorted24h.slice(0, 15),
      losers: sorted24h.slice(-15).reverse(),
    };
  }, [markets]);

  if (!markets) {
    return <div className="text-center py-16 text-gray-500 text-sm">No market data available</div>;
  }

  // ─── Gainers & Losers: split view ───
  if (templateId === 'gainers_losers') {
    return (
      <div className="space-y-6">
        {global && <GlobalKPIs global={global} fgRawValue={fgRawValue} fgValue={fgValue} fgLabel={fgLabel} />}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Top Gainers (24h)
            </h3>
            <CoinTable coins={displayData.gainers} highlight={coin} columns={['rank', 'coin', 'price', '24h']} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Top Losers (24h)
            </h3>
            <CoinTable coins={displayData.losers} highlight={coin} columns={['rank', 'coin', 'price', '24h']} />
          </div>
        </div>
      </div>
    );
  }

  // ─── Market Overview: stats-heavy view ───
  if (templateId === 'market_overview') {
    const btcCoin = markets.find((c) => c.id === 'bitcoin');
    const ethCoin = markets.find((c) => c.id === 'ethereum');
    const topByVolume = [...markets].sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0)).slice(0, 5);
    return (
      <div className="space-y-6">
        {global && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <KPI label="Total Market Cap" value={formatLarge(global.total_market_cap?.usd)} />
            <KPI label="24h Volume" value={formatLarge(global.total_volume?.usd)} />
            <KPI label="BTC Dominance" value={`${(global.market_cap_percentage?.btc ?? 0).toFixed(1)}%`} />
            <KPI label="ETH Dominance" value={`${(global.market_cap_percentage?.eth ?? 0).toFixed(1)}%`} />
            <KPI label="Fear & Greed" value={fgRawValue != null ? `${fgRawValue} — ${fgLabel}` : '—'}
              color={fgValue != null && !Number.isNaN(fgValue) ? fgValue < 30 ? 'text-red-400' : fgValue > 70 ? 'text-green-400' : 'text-yellow-400' : undefined} />
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Key Assets</h3>
            {btcCoin && <AssetRow c={btcCoin} />}
            {ethCoin && <AssetRow c={ethCoin} />}
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Top by Volume (24h)</h3>
            {topByVolume.map((c) => <AssetRow key={c.id} c={c} showVolume />)}
          </div>
        </div>
        <CoinTable coins={markets.slice(0, 25)} highlight={coin} columns={['rank', 'coin', 'price', '24h', '7d', 'mcap', 'vol']} />
      </div>
    );
  }

  // ─── Screener: full table with all columns ───
  if (templateId === 'screener') {
    return (
      <div className="space-y-6">
        {global && <GlobalKPIs global={global} fgRawValue={fgRawValue} fgValue={fgValue} fgLabel={fgLabel} />}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-gray-400">Showing top {Math.min(100, markets.length)} coins by market cap</span>
          </div>
          <CoinTable coins={markets.slice(0, 100)} highlight={coin} columns={['rank', 'coin', 'price', '24h', '7d', 'mcap', 'vol', 'ath_pct']} />
        </div>
      </div>
    );
  }

  // ─── Watchlist: curated top coins ───
  if (templateId === 'watchlist') {
    const watchIds = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'cardano', 'dogecoin', 'polkadot', 'avalanche-2', 'chainlink'];
    const watchCoins = watchIds.map((id) => markets.find((c) => c.id === id)).filter(Boolean) as typeof markets;
    return (
      <div className="space-y-6">
        {global && <GlobalKPIs global={global} fgRawValue={fgRawValue} fgValue={fgValue} fgLabel={fgLabel} />}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <span className="text-xs text-gray-400">Your watchlist — top tracked assets</span>
          </div>
          <CoinTable coins={watchCoins} highlight={coin} columns={['rank', 'coin', 'price', '24h', '7d', 'mcap', 'vol']} />
        </div>
      </div>
    );
  }

  // ─── ETF Tracker: ETF-relevant coins + stats ───
  if (templateId === 'etf_tracker') {
    const etfIds = ['bitcoin', 'ethereum', 'solana', 'ripple', 'litecoin', 'bitcoin-cash', 'chainlink', 'polkadot', 'avalanche-2', 'cardano'];
    const etfCoins = etfIds.map((id) => markets.find((c) => c.id === id)).filter(Boolean) as typeof markets;
    const btcCoin = markets.find((c) => c.id === 'bitcoin');
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="BTC Price" value={btcCoin ? `$${formatPrice(btcCoin.current_price)}` : '—'} />
          <KPI label="BTC 24h Change" value={btcCoin ? formatPct(btcCoin.price_change_percentage_24h) : '—'}
            color={pctColor(btcCoin?.price_change_percentage_24h)} />
          <KPI label="Total Market Cap" value={formatLarge(global?.total_market_cap?.usd)} />
          <KPI label="BTC Dominance" value={`${(global?.market_cap_percentage?.btc ?? 0).toFixed(1)}%`} />
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <span className="text-xs text-gray-400">ETF-eligible assets & key holdings</span>
          </div>
          <CoinTable coins={etfCoins} highlight={coin} columns={['rank', 'coin', 'price', '24h', '7d', 'mcap', 'vol']} />
        </div>
      </div>
    );
  }

  // ─── Macro Indicators: market-wide metrics ───
  if (templateId === 'macro_indicators') {
    const topStable = markets.filter((c) => ['tether', 'usd-coin', 'dai', 'first-digital-usd'].includes(c.id));
    const topByMcap = markets.slice(0, 10);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <KPI label="Total Market Cap" value={formatLarge(global?.total_market_cap?.usd)} />
          <KPI label="24h Volume" value={formatLarge(global?.total_volume?.usd)} />
          <KPI label="BTC Dominance" value={`${(global?.market_cap_percentage?.btc ?? 0).toFixed(1)}%`} />
          <KPI label="Active Cryptos" value={global?.active_cryptocurrencies?.toLocaleString() ?? '—'} />
          <KPI label="Fear & Greed" value={fgRawValue != null ? `${fgRawValue} — ${fgLabel}` : '—'}
            color={fgValue != null && !Number.isNaN(fgValue) ? fgValue < 30 ? 'text-red-400' : fgValue > 70 ? 'text-green-400' : 'text-yellow-400' : undefined} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Top 10 by Market Cap</h3>
            <CoinTable coins={topByMcap} highlight={coin} columns={['rank', 'coin', 'price', '24h', 'mcap']} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Stablecoins</h3>
            {topStable.length > 0 ? (
              <CoinTable coins={topStable} highlight={coin} columns={['rank', 'coin', 'price', '24h', 'mcap']} />
            ) : (
              <div className="text-xs text-gray-500 py-4 text-center">No stablecoin data available</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Default / Alerts Summary / Compare: full market table ───
  return (
    <div className="space-y-6">
      {global && <GlobalKPIs global={global} fgRawValue={fgRawValue} fgValue={fgValue} fgLabel={fgLabel} />}
      <CoinTable coins={markets.slice(0, 50)} highlight={coin} columns={['rank', 'coin', 'price', '24h', '7d', 'mcap', 'vol']} />
    </div>
  );
}

// ─── Shared Components ───

type ColumnId = 'rank' | 'coin' | 'price' | '24h' | '7d' | 'mcap' | 'vol' | 'ath_pct';

function CoinTable({ coins, highlight, columns }: { coins: any[]; highlight: string; columns: ColumnId[] }) {
  const headers: Record<ColumnId, string> = {
    rank: '#', coin: 'Coin', price: 'Price', '24h': '24h %', '7d': '7d %',
    mcap: 'Market Cap', vol: 'Volume (24h)', ath_pct: 'ATH %',
  };
  const align: Record<ColumnId, string> = {
    rank: 'text-left', coin: 'text-left', price: 'text-right', '24h': 'text-right', '7d': 'text-right',
    mcap: 'text-right', vol: 'text-right', ath_pct: 'text-right',
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-gray-500">
              {columns.map((col) => (
                <th key={col} className={`${align[col]} px-3 py-2.5 font-medium`}>{headers[col]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coins.map((c) => (
              <tr key={c.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition ${c.id === highlight ? 'bg-emerald-400/5' : ''}`}>
                {columns.map((col) => {
                  switch (col) {
                    case 'rank': return <td key={col} className="px-3 py-2 text-gray-500">{c.market_cap_rank}</td>;
                    case 'coin': return (
                      <td key={col} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {c.image && <img src={c.image} alt={`${c.name} logo`} className="w-5 h-5 rounded-full" />}
                          <span className="text-white font-medium">{c.name}</span>
                          <span className="text-gray-500 uppercase">{c.symbol}</span>
                        </div>
                      </td>
                    );
                    case 'price': return <td key={col} className="px-3 py-2 text-right text-white font-mono">${formatPrice(c.current_price)}</td>;
                    case '24h': return <td key={col} className={`px-3 py-2 text-right font-mono ${pctColor(c.price_change_percentage_24h)}`}>{formatPct(c.price_change_percentage_24h)}</td>;
                    case '7d': return <td key={col} className={`px-3 py-2 text-right font-mono ${pctColor(c.price_change_percentage_7d_in_currency)}`}>{formatPct(c.price_change_percentage_7d_in_currency)}</td>;
                    case 'mcap': return <td key={col} className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(c.market_cap)}</td>;
                    case 'vol': return <td key={col} className="px-3 py-2 text-right text-gray-400 font-mono">{formatLarge(c.total_volume)}</td>;
                    case 'ath_pct': return <td key={col} className={`px-3 py-2 text-right font-mono ${pctColor(c.ath_change_percentage)}`}>{formatPct(c.ath_change_percentage)}</td>;
                    default: return null;
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetRow({ c, showVolume }: { c: any; showVolume?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2">
        {c.image && <img src={c.image} alt={`${c.name} logo`} className="w-6 h-6 rounded-full" />}
        <div>
          <div className="text-white text-sm font-medium">{c.name}</div>
          <div className="text-gray-500 text-[10px] uppercase">{c.symbol}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-white text-sm font-mono">${formatPrice(c.current_price)}</div>
        <div className={`text-[10px] font-mono ${pctColor(c.price_change_percentage_24h)}`}>
          {showVolume ? `Vol: ${formatLarge(c.total_volume)}` : formatPct(c.price_change_percentage_24h)}
        </div>
      </div>
    </div>
  );
}

function GlobalKPIs({ global, fgRawValue, fgValue, fgLabel }: { global: any; fgRawValue: any; fgValue: number | null; fgLabel: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <KPI label="Total Market Cap" value={formatLarge(global.total_market_cap?.usd)} />
      <KPI label="24h Volume" value={formatLarge(global.total_volume?.usd)} />
      <KPI label="BTC Dominance" value={`${(global.market_cap_percentage?.btc ?? 0).toFixed(1)}%`} />
      <KPI label="Fear & Greed" value={fgRawValue != null ? `${fgRawValue} — ${fgLabel}` : '—'}
        color={fgValue != null && !Number.isNaN(fgValue) ? fgValue < 30 ? 'text-red-400' : fgValue > 70 ? 'text-green-400' : 'text-yellow-400' : undefined} />
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

// ─── Helpers ───

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
