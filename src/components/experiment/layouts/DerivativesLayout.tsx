'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface LayoutProps {
  coin: string;
  days: number;
  templateId?: string;
}

export function DerivativesLayout({ templateId }: LayoutProps) {
  const tickers = useLiveDashboardStore((s) => s.data.derivatives);
  const exchanges = useLiveDashboardStore((s) => s.data.derivativesExchanges);
  const global = useLiveDashboardStore((s) => s.data.global);
  const markets = useLiveDashboardStore((s) => s.data.markets);

  const topExchanges = exchanges?.slice(0, 30) ?? [];
  const topTickers = tickers?.slice(0, 30) ?? [];

  const derivativesVolume24h = global?.total_volume?.usd ?? null;
  const totalMarketCap = global?.total_market_cap?.usd ?? null;

  const btc = markets?.find((c) => c.id === 'bitcoin');
  const eth = markets?.find((c) => c.id === 'ethereum');

  // ─── Funding Rates: emphasize rates ───
  if (templateId === 'funding_rates') {
    const ratesData = topTickers.filter((d) => d.funding_rate != null);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Contracts with Funding" value={`${ratesData.length}`} />
          <KPI label="Avg Funding Rate" value={(() => {
            if (ratesData.length === 0) return '—';
            const avg = ratesData.reduce((a, b) => a + (b.funding_rate ?? 0), 0) / ratesData.length;
            return `${avg >= 0 ? '+' : ''}${(avg * 100).toFixed(4)}%`;
          })()} color={(() => {
            if (ratesData.length === 0) return undefined;
            const avg = ratesData.reduce((a, b) => a + (b.funding_rate ?? 0), 0) / ratesData.length;
            return avg >= 0 ? 'text-emerald-400' : 'text-red-400';
          })()} />
          <KPI label="BTC Price" value={btc ? `$${btc.current_price.toLocaleString()}` : '—'} />
          <KPI label="Total Market Cap" value={formatLarge(totalMarketCap)} />
        </div>
        {ratesData.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Perpetual Funding Rates</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">#</th>
                    <th className="text-left px-3 py-2 font-medium">Exchange</th>
                    <th className="text-left px-3 py-2 font-medium">Pair</th>
                    <th className="text-right px-3 py-2 font-medium">Funding Rate</th>
                    <th className="text-right px-3 py-2 font-medium">Price</th>
                    <th className="text-right px-3 py-2 font-medium">24h Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {ratesData.slice(0, 30).map((d, i) => {
                    const rate = d.funding_rate ?? 0;
                    return (
                      <tr key={`${d.market}-${d.symbol}`} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2 text-white font-medium">{d.market}</td>
                        <td className="px-3 py-2 text-gray-300">{d.symbol}</td>
                        <td className={`px-3 py-2 text-right font-mono font-bold ${rate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {rate >= 0 ? '+' : ''}{(rate * 100).toFixed(4)}%
                        </td>
                        <td className="px-3 py-2 text-right text-gray-300 font-mono">
                          {d.last != null ? `$${Number(d.last).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-400 font-mono">
                          {d.volume_24h != null ? formatLarge(Number(d.volume_24h)) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span>Positive rate = longs pay shorts &middot; Negative rate = shorts pay longs</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Open Interest: emphasize OI data ───
  if (templateId === 'open_interest') {
    const sortedByOI = [...topExchanges].sort((a, b) => (b.open_interest_btc ?? 0) - (a.open_interest_btc ?? 0));
    const totalOI = sortedByOI.reduce((sum, d) => sum + (d.open_interest_btc ?? 0), 0);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Total OI (BTC)" value={formatBtc(totalOI)} />
          <KPI label="Total OI (USD est.)" value={formatLarge(totalOI * (btc?.current_price ?? 0))} />
          <KPI label="Exchanges Tracked" value={`${sortedByOI.length}`} />
          <KPI label="BTC Price" value={btc ? `$${btc.current_price.toLocaleString()}` : '—'} />
        </div>
        {sortedByOI.length > 0 && (
          <>
            {/* OI Distribution */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Open Interest Distribution</h3>
              <div className="space-y-2">
                {sortedByOI.slice(0, 10).map((d) => {
                  const pct = totalOI > 0 ? ((d.open_interest_btc ?? 0) / totalOI) * 100 : 0;
                  return (
                    <div key={d.id} className="flex items-center gap-3">
                      <span className="text-xs text-white w-24 truncate font-medium">{d.name}</span>
                      <div className="flex-1 h-4 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400/40 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 font-mono w-16 text-right">{pct.toFixed(1)}%</span>
                      <span className="text-xs text-gray-300 font-mono w-24 text-right">{formatBtc(d.open_interest_btc ?? 0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Exchange Table */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-white">Exchanges Ranked by Open Interest</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-gray-500">
                      <th className="text-left px-3 py-2 font-medium">#</th>
                      <th className="text-left px-3 py-2 font-medium">Exchange</th>
                      <th className="text-right px-3 py-2 font-medium">Open Interest (BTC)</th>
                      <th className="text-right px-3 py-2 font-medium">OI (USD est.)</th>
                      <th className="text-right px-3 py-2 font-medium">Share</th>
                      <th className="text-right px-3 py-2 font-medium">Perpetuals</th>
                      <th className="text-right px-3 py-2 font-medium">Futures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByOI.map((d, i) => {
                      const oiBtc = d.open_interest_btc ?? 0;
                      return (
                        <tr key={d.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                          <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                          <td className="px-3 py-2 text-white font-medium">{d.name}</td>
                          <td className="px-3 py-2 text-right text-white font-mono">{formatBtc(oiBtc)}</td>
                          <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(oiBtc * (btc?.current_price ?? 0))}</td>
                          <td className="px-3 py-2 text-right text-emerald-400 font-mono">{totalOI > 0 ? `${(oiBtc / totalOI * 100).toFixed(1)}%` : '—'}</td>
                          <td className="px-3 py-2 text-right text-gray-400">{d.number_of_perpetual_pairs ?? '—'}</td>
                          <td className="px-3 py-2 text-right text-gray-400">{d.number_of_futures_pairs ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── Liquidations: volume-based activity view ───
  if (templateId === 'liquidations') {
    const sortedByVolume = [...topExchanges].sort((a, b) => {
      const va = Number(a.trade_volume_24h_btc ?? 0);
      const vb = Number(b.trade_volume_24h_btc ?? 0);
      return vb - va;
    });
    const totalVolBtc = sortedByVolume.reduce((s, d) => s + Number(d.trade_volume_24h_btc ?? 0), 0);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="24h Derivatives Volume" value={formatLarge(totalVolBtc * (btc?.current_price ?? 0))} />
          <KPI label="Volume (BTC)" value={formatBtc(totalVolBtc)} />
          <KPI label="BTC 24h Change" value={btc ? `${(btc.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}${(btc.price_change_percentage_24h ?? 0).toFixed(2)}%` : '—'} color={btc ? ((btc.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400') : undefined} />
          <KPI label="Exchanges" value={`${sortedByVolume.length}`} />
        </div>
        {sortedByVolume.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Exchanges by 24h Volume (Liquidation Activity Proxy)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">#</th>
                    <th className="text-left px-3 py-2 font-medium">Exchange</th>
                    <th className="text-right px-3 py-2 font-medium">24h Vol (BTC)</th>
                    <th className="text-right px-3 py-2 font-medium">24h Vol (USD)</th>
                    <th className="text-right px-3 py-2 font-medium">OI (BTC)</th>
                    <th className="text-right px-3 py-2 font-medium">Vol/OI Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedByVolume.map((d, i) => {
                    const vol = Number(d.trade_volume_24h_btc ?? 0);
                    const oi = d.open_interest_btc ?? 0;
                    const ratio = oi > 0 ? vol / oi : 0;
                    return (
                      <tr key={d.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2 text-white font-medium">{d.name}</td>
                        <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatBtc(vol)}</td>
                        <td className="px-3 py-2 text-right text-white font-mono">{formatLarge(vol * (btc?.current_price ?? 0))}</td>
                        <td className="px-3 py-2 text-right text-gray-400 font-mono">{formatBtc(oi)}</td>
                        <td className={`px-3 py-2 text-right font-mono ${ratio > 2 ? 'text-red-400' : ratio > 1 ? 'text-yellow-400' : 'text-gray-400'}`}>{ratio > 0 ? `${ratio.toFixed(2)}x` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center text-[10px] text-gray-600">
          High Vol/OI ratio may indicate elevated liquidation activity. Direct liquidation data requires exchange-specific APIs.
        </div>
      </div>
    );
  }

  // ─── On-Chain BTC: BTC-specific metrics from markets data ───
  if (templateId === 'onchain_btc') {
    const btcData = btc;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <KPI label="BTC Price" value={btcData ? `$${btcData.current_price.toLocaleString()}` : '—'} />
          <KPI label="Market Cap" value={formatLarge(btcData?.market_cap)} />
          <KPI label="24h Volume" value={formatLarge(btcData?.total_volume)} />
          <KPI label="Circulating Supply" value={btcData?.circulating_supply ? `${(btcData.circulating_supply / 1e6).toFixed(2)}M BTC` : '—'} />
          <KPI label="ATH" value={btcData?.ath ? `$${btcData.ath.toLocaleString()}` : '—'} />
        </div>
        {btcData && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">BTC Key Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetricRow label="24h Change" value={`${(btcData.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}${(btcData.price_change_percentage_24h ?? 0).toFixed(2)}%`} color={(btcData.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'} />
              <MetricRow label="7d Change" value={btcData.price_change_percentage_7d_in_currency != null ? `${btcData.price_change_percentage_7d_in_currency >= 0 ? '+' : ''}${btcData.price_change_percentage_7d_in_currency.toFixed(2)}%` : '—'} color={btcData.price_change_percentage_7d_in_currency != null ? (btcData.price_change_percentage_7d_in_currency >= 0 ? 'text-emerald-400' : 'text-red-400') : undefined} />
              <MetricRow label="ATH Change" value={btcData.ath_change_percentage != null ? `${btcData.ath_change_percentage.toFixed(2)}%` : '—'} color="text-red-400" />
              <MetricRow label="ATL" value={btcData.atl != null ? `$${btcData.atl.toLocaleString()}` : '—'} />
              <MetricRow label="MCap Rank" value={`#${btcData.market_cap_rank ?? '—'}`} />
              <MetricRow label="Max Supply" value={btcData.max_supply ? `${(btcData.max_supply / 1e6).toFixed(0)}M BTC` : '21M BTC'} />
            </div>
          </div>
        )}
        <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 text-[11px] text-amber-400">
          For detailed on-chain data (hashrate, difficulty, active addresses), visit the DataLab or Charts page which uses Blockchain.com APIs.
        </div>
      </div>
    );
  }

  // ─── ETH Gas Tracker: ETH-specific metrics ───
  if (templateId === 'eth_gas_tracker') {
    const ethData = eth;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <KPI label="ETH Price" value={ethData ? `$${ethData.current_price.toLocaleString()}` : '—'} />
          <KPI label="Market Cap" value={formatLarge(ethData?.market_cap)} />
          <KPI label="24h Volume" value={formatLarge(ethData?.total_volume)} />
          <KPI label="ETH Dominance" value={`${(global?.market_cap_percentage?.eth ?? 0).toFixed(1)}%`} />
          <KPI label="ATH" value={ethData?.ath ? `$${ethData.ath.toLocaleString()}` : '—'} />
        </div>
        {ethData && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">ETH Key Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetricRow label="24h Change" value={`${(ethData.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}${(ethData.price_change_percentage_24h ?? 0).toFixed(2)}%`} color={(ethData.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'} />
              <MetricRow label="7d Change" value={ethData.price_change_percentage_7d_in_currency != null ? `${ethData.price_change_percentage_7d_in_currency >= 0 ? '+' : ''}${ethData.price_change_percentage_7d_in_currency.toFixed(2)}%` : '—'} color={ethData.price_change_percentage_7d_in_currency != null ? (ethData.price_change_percentage_7d_in_currency >= 0 ? 'text-emerald-400' : 'text-red-400') : undefined} />
              <MetricRow label="ATH Change" value={ethData.ath_change_percentage != null ? `${ethData.ath_change_percentage.toFixed(2)}%` : '—'} color="text-red-400" />
              <MetricRow label="Circulating" value={ethData.circulating_supply ? `${(ethData.circulating_supply / 1e6).toFixed(2)}M ETH` : '—'} />
              <MetricRow label="MCap Rank" value={`#${ethData.market_cap_rank ?? '—'}`} />
              <MetricRow label="ETH/BTC" value={btc && ethData ? (ethData.current_price / btc.current_price).toFixed(5) : '—'} />
            </div>
          </div>
        )}
        <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 text-[11px] text-amber-400">
          Real-time gas prices require Etherscan API integration. This view shows ETH market data from CoinGecko.
        </div>
      </div>
    );
  }

  // ─── Exchange Flows: exchanges ranked by volume ───
  if (templateId === 'exchange_flows') {
    const topByVol = markets ? [...markets].sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0)).slice(0, 20) : [];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Total 24h Volume" value={formatLarge(global?.total_volume?.usd)} />
          <KPI label="Total Market Cap" value={formatLarge(totalMarketCap)} />
          <KPI label="BTC Dominance" value={`${(global?.market_cap_percentage?.btc ?? 0).toFixed(1)}%`} />
          <KPI label="Active Cryptos" value={global?.active_cryptocurrencies?.toLocaleString() ?? '—'} />
        </div>
        {topByVol.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Top Assets by 24h Volume (Exchange Flow Proxy)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">#</th>
                    <th className="text-left px-3 py-2 font-medium">Asset</th>
                    <th className="text-right px-3 py-2 font-medium">Price</th>
                    <th className="text-right px-3 py-2 font-medium">24h Volume</th>
                    <th className="text-right px-3 py-2 font-medium">Vol/MCap %</th>
                    <th className="text-right px-3 py-2 font-medium">24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  {topByVol.map((c, i) => {
                    const volMcapRatio = c.market_cap > 0 ? (c.total_volume / c.market_cap) * 100 : 0;
                    return (
                      <tr key={c.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {c.image && <img src={c.image} alt={`${c.name} logo`} className="w-5 h-5 rounded-full" />}
                            <span className="text-white font-medium">{c.name}</span>
                            <span className="text-gray-500 uppercase text-[10px]">{c.symbol}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-white font-mono">${formatPrice(c.current_price)}</td>
                        <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(c.total_volume)}</td>
                        <td className={`px-3 py-2 text-right font-mono ${volMcapRatio > 20 ? 'text-yellow-400' : 'text-gray-400'}`}>{volMcapRatio.toFixed(1)}%</td>
                        <td className={`px-3 py-2 text-right font-mono ${(c.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {(c.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}{(c.price_change_percentage_24h ?? 0).toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Mining Stats: BTC mining-focused metrics ───
  if (templateId === 'mining_stats') {
    const btcData = btc;
    const pow = markets?.filter((c) => ['bitcoin', 'litecoin', 'bitcoin-cash', 'dogecoin', 'ethereum-classic', 'monero', 'zcash', 'ravencoin'].includes(c.id)) ?? [];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="BTC Price" value={btcData ? `$${btcData.current_price.toLocaleString()}` : '—'} />
          <KPI label="BTC Market Cap" value={formatLarge(btcData?.market_cap)} />
          <KPI label="BTC 24h Volume" value={formatLarge(btcData?.total_volume)} />
          <KPI label="BTC Supply" value={btcData?.circulating_supply ? `${(btcData.circulating_supply / 1e6).toFixed(2)}M / 21M` : '—'} />
        </div>
        {pow.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Proof-of-Work Coins</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">#</th>
                    <th className="text-left px-3 py-2 font-medium">Coin</th>
                    <th className="text-right px-3 py-2 font-medium">Price</th>
                    <th className="text-right px-3 py-2 font-medium">Market Cap</th>
                    <th className="text-right px-3 py-2 font-medium">24h %</th>
                    <th className="text-right px-3 py-2 font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {pow.map((c, i) => (
                    <tr key={c.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {c.image && <img src={c.image} alt={`${c.name} logo`} className="w-5 h-5 rounded-full" />}
                          <span className="text-white font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-white font-mono">${formatPrice(c.current_price)}</td>
                      <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(c.market_cap)}</td>
                      <td className={`px-3 py-2 text-right font-mono ${(c.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(c.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}{(c.price_change_percentage_24h ?? 0).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-right text-gray-400 font-mono">{formatLarge(c.total_volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 text-[11px] text-amber-400">
          Detailed mining stats (hashrate, difficulty, miners revenue) are available in DataLab &amp; Charts using Blockchain.com APIs.
        </div>
      </div>
    );
  }

  // ─── Token Unlocks: market cap & supply focus ───
  if (templateId === 'token_unlocks') {
    const withSupply = markets?.filter((c) => c.max_supply != null && c.max_supply > 0).slice(0, 20) ?? [];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Total Market Cap" value={formatLarge(totalMarketCap)} />
          <KPI label="Coins Tracked" value={`${markets?.length ?? 0}`} />
          <KPI label="With Max Supply" value={`${withSupply.length}`} />
          <KPI label="24h Volume" value={formatLarge(derivativesVolume24h)} />
        </div>
        {withSupply.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Token Supply &amp; Unlock Progress</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">#</th>
                    <th className="text-left px-3 py-2 font-medium">Token</th>
                    <th className="text-right px-3 py-2 font-medium">Circulating</th>
                    <th className="text-right px-3 py-2 font-medium">Max Supply</th>
                    <th className="text-right px-3 py-2 font-medium">Unlocked %</th>
                    <th className="text-right px-3 py-2 font-medium">Price</th>
                    <th className="text-right px-3 py-2 font-medium">FDV</th>
                  </tr>
                </thead>
                <tbody>
                  {withSupply.map((c, i) => {
                    const pct = c.max_supply! > 0 ? ((c.circulating_supply ?? 0) / c.max_supply!) * 100 : 0;
                    const fdv = c.current_price * (c.max_supply ?? c.circulating_supply ?? 0);
                    return (
                      <tr key={c.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {c.image && <img src={c.image} alt={`${c.name} logo`} className="w-5 h-5 rounded-full" />}
                            <span className="text-white font-medium">{c.name}</span>
                            <span className="text-gray-500 uppercase text-[10px]">{c.symbol}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatSupply(c.circulating_supply ?? 0)}</td>
                        <td className="px-3 py-2 text-right text-gray-400 font-mono">{formatSupply(c.max_supply!)}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400/60 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="text-emerald-400 font-mono text-[10px] w-10 text-right">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-white font-mono">${formatPrice(c.current_price)}</td>
                        <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(fdv)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Staking Rewards: PoS coins focus ───
  if (templateId === 'staking_rewards') {
    const posCoins = markets?.filter((c) => ['ethereum', 'solana', 'cardano', 'polkadot', 'avalanche-2', 'cosmos', 'near', 'algorand', 'tezos', 'aptos', 'sui', 'celestia'].includes(c.id)) ?? [];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="PoS Coins Tracked" value={`${posCoins.length}`} />
          <KPI label="Total PoS MCap" value={formatLarge(posCoins.reduce((s, c) => s + (c.market_cap ?? 0), 0))} />
          <KPI label="ETH Price" value={eth ? `$${eth.current_price.toLocaleString()}` : '—'} />
          <KPI label="ETH Dominance" value={`${(global?.market_cap_percentage?.eth ?? 0).toFixed(1)}%`} />
        </div>
        {posCoins.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Proof-of-Stake Assets</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">#</th>
                    <th className="text-left px-3 py-2 font-medium">Token</th>
                    <th className="text-right px-3 py-2 font-medium">Price</th>
                    <th className="text-right px-3 py-2 font-medium">Market Cap</th>
                    <th className="text-right px-3 py-2 font-medium">24h %</th>
                    <th className="text-right px-3 py-2 font-medium">7d %</th>
                    <th className="text-right px-3 py-2 font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {posCoins.map((c, i) => (
                    <tr key={c.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {c.image && <img src={c.image} alt={`${c.name} logo`} className="w-5 h-5 rounded-full" />}
                          <span className="text-white font-medium">{c.name}</span>
                          <span className="text-gray-500 uppercase text-[10px]">{c.symbol}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-white font-mono">${formatPrice(c.current_price)}</td>
                      <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(c.market_cap)}</td>
                      <td className={`px-3 py-2 text-right font-mono ${(c.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(c.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}{(c.price_change_percentage_24h ?? 0).toFixed(2)}%
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${(c.price_change_percentage_7d_in_currency ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {c.price_change_percentage_7d_in_currency != null ? `${c.price_change_percentage_7d_in_currency >= 0 ? '+' : ''}${c.price_change_percentage_7d_in_currency.toFixed(2)}%` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-400 font-mono">{formatLarge(c.total_volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 text-[11px] text-amber-400">
          Staking APY data requires protocol-specific APIs. This view shows Proof-of-Stake asset market data.
        </div>
      </div>
    );
  }

  // ─── Default: full derivatives view (original) ───
  const hasDerivativesData = Boolean(
    (tickers && tickers.length > 0) || (exchanges && exchanges.length > 0),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Exchanges Tracked" value={`${exchanges?.length ?? 0}`} />
        <KPI label="Total Market Cap" value={formatLarge(totalMarketCap)} />
        <KPI label="24h Volume" value={formatLarge(derivativesVolume24h)} />
        <KPI label="BTC Price" value={btc ? `$${btc.current_price.toLocaleString()}` : '—'} color={btc && (btc.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'} />
      </div>

      {topTickers.length > 0 && topTickers.some((d) => d.funding_rate != null) && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Funding Rates</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {topTickers.filter((d) => d.funding_rate != null).slice(0, 8).map((d) => {
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
        </div>
      )}

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
                    <td className="px-3 py-2 text-white font-medium">{d.name}</td>
                    <td className="px-3 py-2 text-right text-white font-mono">{d.open_interest_btc != null ? formatBtc(d.open_interest_btc) : '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(d.trade_volume_24h_btc != null ? Number(d.trade_volume_24h_btc) * (btc?.current_price ?? 0) : null)}</td>
                    <td className="px-3 py-2 text-right text-gray-400">{d.number_of_perpetual_pairs ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-400">{d.number_of_futures_pairs ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!hasDerivativesData && (
        <div className="text-center py-16 text-gray-500 text-sm">No derivatives data available</div>
      )}
    </div>
  );
}

// ─── Shared Components ───

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`text-sm font-mono font-bold mt-0.5 ${color ?? 'text-white'}`}>{value}</div>
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

function formatPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toPrecision(4);
}

function formatSupply(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}
