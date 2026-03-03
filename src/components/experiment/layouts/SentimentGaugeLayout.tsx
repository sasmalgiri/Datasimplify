'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

function DataDisclaimer({ text }: { text: string }) {
  return (
    <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 flex items-start gap-2">
      <span className="text-amber-400 mt-0.5 flex-shrink-0">⚠️</span>
      <p className="text-[11px] text-amber-200/80 leading-relaxed">{text}</p>
    </div>
  );
}

interface LayoutProps {
  coin: string;
  days: number;
  templateId?: string;
}

export function SentimentGaugeLayout({ templateId }: LayoutProps) {
  const fearGreed = useLiveDashboardStore((s) => s.data.fearGreed);
  const markets = useLiveDashboardStore((s) => s.data.markets);
  const categories = useLiveDashboardStore((s) => s.data.categories);

  const current = fearGreed?.[0];
  const fgRawValue = current?.value ?? null;
  const fgValue = fgRawValue != null ? Number(fgRawValue) : null;
  const fgLabel = current?.value_classification ?? '';

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

  const topGainers = markets
    ?.filter((c) => c.price_change_percentage_24h != null)
    .sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0))
    .slice(0, 5) ?? [];

  const topLosers = markets
    ?.filter((c) => c.price_change_percentage_24h != null)
    .sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0))
    .slice(0, 5) ?? [];

  // ─── Social Sentiment: focus on market movers & categories ───
  if (templateId === 'social_sentiment') {
    const topByVol = markets
      ?.filter((c) => c.total_volume != null)
      .sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0))
      .slice(0, 10) ?? [];

    return (
      <div className="space-y-6">
        <DataDisclaimer text="This view uses price movements and trading volume as sentiment proxies. Actual social sentiment analysis (Twitter/X mentions, Reddit activity, NLP scores) requires specialized social analytics APIs." />
        {/* Mini gauge at top */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Market Mood" value={fgRawValue != null ? `${fgRawValue} — ${fgLabel}` : '—'}
            color={gaugeColor} />
          <KPI label="BTC 24h" value={(() => {
            const btc = markets?.find((c) => c.id === 'bitcoin');
            return btc ? `${(btc.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}${(btc.price_change_percentage_24h ?? 0).toFixed(2)}%` : '—';
          })()}
            color={(() => {
              const btc = markets?.find((c) => c.id === 'bitcoin');
              return btc ? ((btc.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400') : undefined;
            })()} />
          <KPI label="Gainers/Losers" value={markets ? `${markets.filter((c) => (c.price_change_percentage_24h ?? 0) > 0).length} / ${markets.filter((c) => (c.price_change_percentage_24h ?? 0) < 0).length}` : '—'} />
          <KPI label="Categories" value={`${categories?.length ?? 0}`} />
        </div>

        {/* Market Movers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-emerald-400 mb-3">Bullish Sentiment (Top Gainers)</h3>
            {topGainers.length > 0 ? (
              <div className="space-y-2.5">
                {topGainers.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {c.image && <img src={c.image} alt={`${c.symbol?.toUpperCase()} logo`} className="w-5 h-5 rounded-full" />}
                      <div>
                        <span className="text-xs text-white font-medium">{c.name}</span>
                        <span className="text-[10px] text-gray-500 ml-1.5">{c.symbol?.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-emerald-400 font-mono font-bold">+{(c.price_change_percentage_24h ?? 0).toFixed(2)}%</span>
                      <div className="text-[10px] text-gray-500 font-mono">${formatPrice(c.current_price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500">No data</div>
            )}
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-red-400 mb-3">Bearish Sentiment (Top Losers)</h3>
            {topLosers.length > 0 ? (
              <div className="space-y-2.5">
                {topLosers.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {c.image && <img src={c.image} alt={`${c.symbol?.toUpperCase()} logo`} className="w-5 h-5 rounded-full" />}
                      <div>
                        <span className="text-xs text-white font-medium">{c.name}</span>
                        <span className="text-[10px] text-gray-500 ml-1.5">{c.symbol?.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-red-400 font-mono font-bold">{(c.price_change_percentage_24h ?? 0).toFixed(2)}%</span>
                      <div className="text-[10px] text-gray-500 font-mono">${formatPrice(c.current_price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500">No data</div>
            )}
          </div>
        </div>

        {/* Trending by Volume */}
        {topByVol.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Trending by Volume (Social Interest Proxy)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">#</th>
                    <th className="text-left px-3 py-2 font-medium">Coin</th>
                    <th className="text-right px-3 py-2 font-medium">Price</th>
                    <th className="text-right px-3 py-2 font-medium">24h Volume</th>
                    <th className="text-right px-3 py-2 font-medium">Vol/MCap %</th>
                    <th className="text-right px-3 py-2 font-medium">24h %</th>
                  </tr>
                </thead>
                <tbody>
                  {topByVol.map((c, i) => {
                    const ratio = c.market_cap > 0 ? (c.total_volume / c.market_cap) * 100 : 0;
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
                        <td className={`px-3 py-2 text-right font-mono ${ratio > 20 ? 'text-yellow-400' : 'text-gray-400'}`}>{ratio.toFixed(1)}%</td>
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

        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Sector Sentiment (Category Performance)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">Category</th>
                    <th className="text-right px-3 py-2 font-medium">Market Cap</th>
                    <th className="text-right px-3 py-2 font-medium">24h %</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.slice(0, 15).map((cat) => (
                    <tr key={cat.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="px-3 py-2 text-white font-medium">{cat.name}</td>
                      <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(cat.market_cap)}</td>
                      <td className={`px-3 py-2 text-right font-mono ${(cat.market_cap_change_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {cat.market_cap_change_24h != null ? `${cat.market_cap_change_24h >= 0 ? '+' : ''}${cat.market_cap_change_24h.toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── NFT Collections: NFT-related categories ───
  if (templateId === 'nft_collections') {
    const nftCategories = categories?.filter((c) =>
      c.name.toLowerCase().includes('nft') ||
      c.name.toLowerCase().includes('metaverse') ||
      c.name.toLowerCase().includes('gaming') ||
      c.name.toLowerCase().includes('collectible') ||
      c.name.toLowerCase().includes('art'),
    ) ?? [];

    const nftCoins = markets?.filter((c) =>
      ['axie-infinity', 'the-sandbox', 'decentraland', 'enjincoin', 'flow', 'immutable-x', 'gala', 'apecoin', 'illuvium', 'ronin'].includes(c.id),
    ) ?? [];

    return (
      <div className="space-y-6">
        <DataDisclaimer text="This view shows NFT/gaming-related fungible tokens and categories from CoinGecko. Actual NFT collection data (floor prices, sales volume, unique holders) requires marketplace APIs like OpenSea or Reservoir." />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="NFT/Gaming Categories" value={`${nftCategories.length}`} />
          <KPI label="NFT Tokens Tracked" value={`${nftCoins.length}`} />
          <KPI label="Market Mood" value={fgRawValue != null ? `${fgRawValue} — ${fgLabel}` : '—'} color={gaugeColor} />
          <KPI label="Total NFT MCap" value={formatLarge(nftCoins.reduce((s, c) => s + (c.market_cap ?? 0), 0))} />
        </div>

        {nftCoins.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">NFT &amp; Gaming Tokens</h3>
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
                    <th className="text-right px-3 py-2 font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {nftCoins.map((c, i) => (
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
                      <td className="px-3 py-2 text-right text-gray-400 font-mono">{formatLarge(c.total_volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {nftCategories.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">NFT &amp; Gaming Categories</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">Category</th>
                    <th className="text-right px-3 py-2 font-medium">Market Cap</th>
                    <th className="text-right px-3 py-2 font-medium">24h %</th>
                  </tr>
                </thead>
                <tbody>
                  {nftCategories.map((cat) => (
                    <tr key={cat.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="px-3 py-2 text-white font-medium">{cat.name}</td>
                      <td className="px-3 py-2 text-right text-gray-300 font-mono">{formatLarge(cat.market_cap)}</td>
                      <td className={`px-3 py-2 text-right font-mono ${(cat.market_cap_change_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {cat.market_cap_change_24h != null ? `${cat.market_cap_change_24h >= 0 ? '+' : ''}${cat.market_cap_change_24h.toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {nftCoins.length === 0 && nftCategories.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">No NFT/gaming data found in current market data</div>
        )}
      </div>
    );
  }

  // ─── Default: Fear & Greed (original view) ───
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
