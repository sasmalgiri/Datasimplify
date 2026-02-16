'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

const KNOWN_DEX_IDS = new Set([
  'uniswap', 'uniswap_v3', 'uniswap_v2',
  'sushiswap', 'pancakeswap', 'pancakeswap_v2', 'pancakeswap_v3',
  'curve', 'curve_finance',
  'raydium', 'jupiter',
  'orca', 'orca_whirlpools',
  'trader_joe', 'trader_joe_v2',
  'camelot', 'camelot_v3',
  'aerodrome', 'velodrome',
  'balancer', 'balancer_v2',
  'dydx', 'dydx_perpetual',
  'osmosis', 'thorswap',
  'quickswap', 'spookyswap',
  'biswap', 'mdex',
]);

function formatCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function DEXVolumeWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { dexList, pieData, insight } = useMemo(() => {
    const exchanges = data.exchanges;
    if (!exchanges || !Array.isArray(exchanges)) return { dexList: null, pieData: null, insight: null };

    let dexVol = 0;
    let cexVol = 0;
    const dexes: Array<{ name: string; volume: number }> = [];

    for (const ex of exchanges) {
      const vol = parseFloat(ex.trade_volume_24h_btc_normalized || ex.trade_volume_24h_btc || '0') * 60000; // rough BTC→USD
      const isDex = KNOWN_DEX_IDS.has(ex.id?.toLowerCase()) || ex.centralized === false;

      if (isDex) {
        dexVol += vol;
        dexes.push({ name: ex.name || ex.id, volume: vol });
      } else {
        cexVol += vol;
      }
    }

    dexes.sort((a, b) => b.volume - a.volume);
    const topDex = dexes.slice(0, 10);

    const total = dexVol + cexVol;
    const dexShare = total > 0 ? (dexVol / total) * 100 : 0;

    const pie = [
      { name: 'DEX', value: dexVol, fill: themeColors.primary },
      { name: 'CEX', value: cexVol, fill: '#6b7280' },
    ];

    const insightText = `DEX share: ${dexShare.toFixed(1)}% · ${dexes.length} DEXes tracked · Top: ${topDex[0]?.name || 'N/A'}`;

    return { dexList: topDex, pieData: pie, insight: insightText };
  }, [data.exchanges, themeColors]);

  if (!data.exchanges) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="h-24 w-24 rounded-full bg-gray-800/50" />
      </div>
    );
  }

  if (!dexList || dexList.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No DEX volume data available</div>;
  }

  return (
    <div>
      {/* DEX vs CEX Pie */}
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData || []}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData?.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined) => formatCompact(value ?? 0)}
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ color: '#d1d5db' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* DEX Rankings */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {dexList.slice(0, 6).map((dex, i) => {
            const maxVol = dexList[0]?.volume || 1;
            const pct = (dex.volume / maxVol) * 100;
            return (
              <div key={dex.name} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-4 text-right">{i + 1}</span>
                <span className="text-white font-medium truncate w-24">{dex.name}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: themeColors.primary }}
                  />
                </div>
                <span className="text-gray-400 w-16 text-right shrink-0">{formatCompact(dex.volume)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[9px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColors.primary }} />
          <span className="text-gray-400">DEX</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-gray-400">CEX</span>
        </div>
      </div>

      {insight && <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>}
    </div>
  );
}
