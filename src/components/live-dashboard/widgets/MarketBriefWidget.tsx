'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

function formatCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

type Urgency = 'green' | 'yellow' | 'red';

interface BriefItem {
  urgency: Urgency;
  label: string;
  text: string;
}

function urgencyColor(u: Urgency): string {
  if (u === 'green') return '#22c55e';
  if (u === 'yellow') return '#eab308';
  return '#ef4444';
}

export function MarketBriefWidget() {
  const { data } = useLiveDashboardStore();

  const items = useMemo<BriefItem[] | null>(() => {
    const markets = data.markets;
    const global = data.global;
    const fg = data.fearGreed;
    if (!markets || !global) return null;

    const bullets: BriefItem[] = [];

    // 1. Market Direction
    const gaining = markets.filter((c) => (c.price_change_percentage_24h || 0) > 0).length;
    const pctGaining = (gaining / markets.length) * 100;
    const direction = pctGaining > 65 ? 'bullish' : pctGaining < 35 ? 'bearish' : 'mixed';
    const dirUrgency: Urgency = pctGaining > 65 ? 'green' : pctGaining < 35 ? 'red' : 'yellow';
    bullets.push({
      urgency: dirUrgency,
      label: 'Direction',
      text: `Market is ${direction} — ${pctGaining.toFixed(0)}% of top ${markets.length} coins gaining in 24h.`,
    });

    // 2. Top Mover
    const sortedByChange = [...markets].sort((a, b) =>
      Math.abs(b.price_change_percentage_24h || 0) - Math.abs(a.price_change_percentage_24h || 0)
    );
    const topMover = sortedByChange[0];
    if (topMover) {
      const ch = topMover.price_change_percentage_24h || 0;
      const isTrending = data.trending?.some((t) => t.item.id === topMover.id);
      bullets.push({
        urgency: Math.abs(ch) > 15 ? 'red' : Math.abs(ch) > 8 ? 'yellow' : 'green',
        label: 'Top Mover',
        text: `${topMover.name} (${topMover.symbol.toUpperCase()}) at ${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%${isTrending ? ' — currently trending' : ''}.`,
      });
    }

    // 3. Risk Status
    const fgValue = fg?.[0] ? parseInt(fg[0].value, 10) : 50;
    const fgLabel = fg?.[0]?.value_classification || 'Neutral';
    let riskText = `Sentiment at ${fgValue} (${fgLabel})`;
    let riskUrgency: Urgency = 'green';
    if (data.derivatives) {
      const totalOI = data.derivatives.reduce((s, d) => s + (d.open_interest || 0), 0);
      const spotVol = markets.reduce((s, m) => s + (m.total_volume || 0), 0);
      const ratio = spotVol > 0 ? totalOI / spotVol : 0;
      const riskLevel = ratio > 1.0 ? 'High' : ratio > 0.5 ? 'Moderate' : 'Low';
      riskText = `${riskLevel} risk — leverage ratio ${ratio.toFixed(2)}, F&G ${fgValue} (${fgLabel}).`;
      riskUrgency = ratio > 1.0 || fgValue > 80 || fgValue < 15 ? 'red' : ratio > 0.5 || fgValue > 70 || fgValue < 25 ? 'yellow' : 'green';
    } else {
      riskText += `. ${fgValue > 75 ? 'Extreme greed — historically a sell zone.' : fgValue < 25 ? 'Extreme fear — historically a buy zone.' : ''}`;
      riskUrgency = fgValue > 75 || fgValue < 25 ? 'red' : fgValue > 60 || fgValue < 40 ? 'yellow' : 'green';
    }
    bullets.push({ urgency: riskUrgency, label: 'Risk', text: riskText });

    // 4. Sector Leader
    if (data.categories && data.categories.length > 0) {
      const sortedCats = [...data.categories]
        .filter((c: any) => c.market_cap_change_24h != null)
        .sort((a: any, b: any) => (b.market_cap_change_24h || 0) - (a.market_cap_change_24h || 0));
      const topCat = sortedCats[0];
      const bottomCat = sortedCats[sortedCats.length - 1];
      if (topCat) {
        bullets.push({
          urgency: 'green',
          label: 'Sectors',
          text: `Leading: ${topCat.name} (${topCat.market_cap_change_24h > 0 ? '+' : ''}${topCat.market_cap_change_24h?.toFixed(1)}%). Lagging: ${bottomCat?.name} (${bottomCat?.market_cap_change_24h?.toFixed(1)}%).`,
        });
      }
    }

    // 5. Trending Alert
    if (data.trending && data.trending.length > 0) {
      const trendNames = data.trending.slice(0, 4).map((t) => t.item.name);
      bullets.push({
        urgency: 'yellow',
        label: 'Trending',
        text: `Trending now: ${trendNames.join(', ')}. High search interest signals potential momentum.`,
      });
    }

    // 6. Key Number
    const totalMcap = global.total_market_cap?.usd || 0;
    const mcapChange = global.market_cap_change_percentage_24h_usd || 0;
    bullets.push({
      urgency: mcapChange > 2 ? 'green' : mcapChange < -2 ? 'red' : 'yellow',
      label: 'Market Cap',
      text: `Total: ${formatCompact(totalMcap)} — ${mcapChange >= 0 ? 'up' : 'down'} ${Math.abs(mcapChange).toFixed(2)}% in 24h. ${global.active_cryptocurrencies?.toLocaleString() || '?'} active cryptocurrencies.`,
    });

    return bullets;
  }, [data.markets, data.global, data.fearGreed, data.derivatives, data.categories, data.trending]);

  if (!data.markets || !data.global) {
    return (
      <div className="animate-pulse space-y-3 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-700 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 bg-gray-800/50 rounded w-full mb-1" />
              <div className="h-3 bg-gray-800/50 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items) {
    return <div className="flex items-center justify-center h-32 text-gray-500 text-sm">No data available</div>;
  }

  return (
    <div className="space-y-3 py-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          {/* Urgency dot */}
          <span
            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: urgencyColor(item.urgency) }}
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{item.label}</span>
            <p className="text-xs text-gray-300 leading-relaxed mt-0.5">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
