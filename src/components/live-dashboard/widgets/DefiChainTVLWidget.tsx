'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore, type DefiChain } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function formatTVL(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function DefiChainTVLWidget() {
  const { data, siteTheme, customization } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(customization.colorTheme);
  const isLight = siteTheme === 'light-blue';

  const { chartData, insight } = useMemo(() => {
    const chains = data.defiChains;
    if (!chains || !Array.isArray(chains)) return { chartData: null, insight: null };

    const sorted = [...chains]
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 15);

    if (sorted.length === 0) return { chartData: null, insight: null };

    const rows = sorted.map((chain: DefiChain) => ({
      name: chain.name.length > 14 ? chain.name.slice(0, 14) + '\u2026' : chain.name,
      fullName: chain.name,
      tvl: chain.tvl,
      tokenSymbol: chain.tokenSymbol || '',
    }));

    const totalTVL = sorted.reduce((s, c) => s + c.tvl, 0);
    const topChain = sorted[0];
    const topShare = totalTVL > 0 ? ((topChain.tvl / totalTVL) * 100).toFixed(1) : '0';
    const insightText = `Top 15 chain TVL: ${formatTVL(totalTVL)} \u00B7 #1 ${topChain.name} (${topShare}% share) \u00B7 ${sorted.length} chains shown`;

    return { chartData: rows, insight: insightText };
  }, [data.defiChains]);

  // Skeleton loading state
  if (!data.defiChains) {
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
        No DeFi chain data available
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
              tickFormatter={(v: number) => formatTVL(v)}
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
              formatter={(value: number | undefined) => [formatTVL(value ?? 0), 'TVL']}
              labelFormatter={(label: string, payload: readonly any[]) => {
                const item = payload?.[0]?.payload;
                const suffix = item?.tokenSymbol ? ` (${item.tokenSymbol})` : '';
                return `${item?.fullName || label}${suffix}`;
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
              dataKey="tvl"
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
