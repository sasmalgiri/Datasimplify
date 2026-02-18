'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore, type DefiDexItem } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function formatVolume(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatChange(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '\u2014';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function DexVolumeOverviewWidget() {
  const { data, siteTheme, customization } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(customization.colorTheme);
  const isLight = siteTheme === 'light-blue';

  const { chartData, insight } = useMemo(() => {
    const dexes = data.defiDexOverview;
    if (!dexes || !Array.isArray(dexes)) return { chartData: null, insight: null };

    const sorted = [...dexes]
      .sort((a, b) => b.totalVolume24h - a.totalVolume24h)
      .slice(0, 15);

    if (sorted.length === 0) return { chartData: null, insight: null };

    const rows = sorted.map((dex: DefiDexItem) => ({
      name: dex.name.length > 12 ? dex.name.slice(0, 12) + '\u2026' : dex.name,
      fullName: dex.name,
      volume24h: dex.totalVolume24h,
      volume7d: dex.totalVolume7d,
      change1d: dex.change_1d,
      chains: dex.chains,
    }));

    const totalVol24h = sorted.reduce((s, d) => s + d.totalVolume24h, 0);
    const topDex = sorted[0];
    const topShare = totalVol24h > 0 ? ((topDex.totalVolume24h / totalVol24h) * 100).toFixed(1) : '0';
    const insightText = `Total 24h DEX volume: ${formatVolume(totalVol24h)} \u2014 ${topDex.name} leads with ${topShare}% share`;

    return { chartData: rows, insight: insightText };
  }, [data.defiDexOverview]);

  // Skeleton loading state
  if (!data.defiDexOverview) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-16 bg-gray-800/50 rounded" />
            <div className="flex-1 h-4 bg-gray-800/50 rounded" style={{ width: `${90 - i * 10}%` }} />
          </div>
        ))}
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[280px] ${st.textDim} text-sm`}>
        No DEX volume data available
      </div>
    );
  }

  const tooltipBg = isLight ? '#ffffff' : '#111827';
  const tooltipBorder = isLight ? '#cbd5e1' : '#374151';
  const tooltipText = isLight ? '#1e293b' : '#d1d5db';
  const axisTextColor = isLight ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.4)';

  return (
    <div>
      <div style={{ height: `${CHART_HEIGHT_MAP[customization.chartHeight]}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 5, bottom: 5 }}
          >
            <XAxis
              type="number"
              tick={{ fill: axisTextColor, fontSize: 10 }}
              tickFormatter={(v: number) => formatVolume(v)}
              axisLine={{ stroke: isLight ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fill: axisTextColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number | undefined) => [formatVolume(value ?? 0), '24h Volume']}
              labelFormatter={(label: string, payload: readonly any[]) => {
                const item = payload?.[0]?.payload;
                if (!item) return label;
                const vol7d = item.volume7d ? ` | 7d: ${formatVolume(item.volume7d)}` : '';
                const chg = item.change1d != null ? ` | 1d: ${formatChange(item.change1d)}` : '';
                return `${item.fullName || label}${vol7d}${chg}`;
              }}
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '8px',
                fontSize: '11px',
              }}
              itemStyle={{ color: tooltipText }}
              labelStyle={{ color: tooltipText, fontWeight: 600 }}
              cursor={{ fill: isLight ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.03)' }}
            />
            <Bar
              dataKey="volume24h"
              radius={[0, 4, 4, 0]}
              maxBarSize={20}
              animationDuration={customization.showAnimations ? 800 : 0}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={themeColors.palette[index % themeColors.palette.length]}
                  fillOpacity={0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {insight && (
        <p className={`text-[10px] ${st.textDim} mt-1 text-center italic`}>{insight}</p>
      )}
    </div>
  );
}
