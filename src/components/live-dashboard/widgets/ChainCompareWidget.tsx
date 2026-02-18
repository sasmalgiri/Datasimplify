'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors } from '@/lib/live-dashboard/theme';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

/* ---------- helpers ---------- */

function formatTVL(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/* ---------- custom tooltip ---------- */

function CustomTooltip({ active, payload, label, siteTheme }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const bg = siteTheme === 'light-blue' ? '#ffffff' : '#111827';
  const border = siteTheme === 'light-blue' ? '#bfdbfe' : '#374151';
  const text = siteTheme === 'light-blue' ? '#1e293b' : '#d1d5db';

  return (
    <div
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '11px',
        color: text,
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(1)} / 100
          {entry.payload?.rawTvl?.[entry.name] != null && (
            <span style={{ color: text, marginLeft: '4px', opacity: 0.7 }}>
              ({formatTVL(entry.payload.rawTvl[entry.name])})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- component ---------- */

export function ChainCompareWidget() {
  const { siteTheme, colorTheme, data } = useLiveDashboardStore(useShallow((s) => ({
    siteTheme: s.siteTheme,
    colorTheme: s.customization.colorTheme,
    data: s.data,
  })));
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);

  const gridStroke = siteTheme === 'light-blue' ? 'rgba(59,130,246,0.15)' : '#374151';
  const axisTextFill = siteTheme === 'light-blue' ? '#475569' : '#9ca3af';

  const { radarData, chainNames, insight } = useMemo(() => {
    const chains = data.defiChains;
    if (!chains || chains.length === 0) {
      return { radarData: null, chainNames: [], insight: null };
    }

    // Sort by TVL descending and take top 6
    const sorted = [...chains]
      .filter((c) => c.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 6);

    if (sorted.length === 0) {
      return { radarData: null, chainNames: [], insight: null };
    }

    const names = sorted.map((c) => c.name);
    const maxTvl = sorted[0].tvl;

    // Normalize TVL values to 0-100 scale (divided by max)
    // For the radar chart, we create data points per metric dimension.
    // Since we only have TVL, we create a single-dimension comparison.
    // The radar axes are the chain names, each radar "spoke" is a chain.
    const normalizedData = sorted.map((chain) => ({
      chain: chain.name,
      normalized: maxTvl > 0 ? (chain.tvl / maxTvl) * 100 : 0,
      rawTvl: chain.tvl,
      symbol: chain.tokenSymbol,
    }));

    // Build radar data: each object is a "metric" axis, with one key per chain
    // For a clean radar, we put all chains as data points on one radar.
    // Recharts RadarChart expects: data = array of { subject, chainA, chainB, ... }
    // But for comparing chains, we use chains as the axes:
    const chartData = normalizedData.map((item) => {
      const point: Record<string, any> = {
        chain: item.chain,
        TVL: parseFloat(item.normalized.toFixed(1)),
        rawTvl: { TVL: item.rawTvl },
      };
      return point;
    });

    // Insight
    const totalTVL = sorted.reduce((s, c) => s + c.tvl, 0);
    const top1Pct = totalTVL > 0 ? ((sorted[0].tvl / totalTVL) * 100).toFixed(1) : '0';
    const top3Sum = sorted.slice(0, 3).reduce((s, c) => s + c.tvl, 0);
    const top3Pct = totalTVL > 0 ? ((top3Sum / totalTVL) * 100).toFixed(1) : '0';
    const insightText = `${sorted[0].name} leads at ${top1Pct}% of top-6 TVL · Top 3 chains hold ${top3Pct}% · Total: ${formatTVL(totalTVL)}`;

    return { radarData: chartData, chainNames: names, insight: insightText };
  }, [data.defiChains]);

  /* ---- loading state ---- */
  if (!data.defiChains) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="h-36 w-36 rounded-full bg-gray-800/50" />
      </div>
    );
  }

  /* ---- empty state ---- */
  if (!radarData || radarData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-sm ${st.textDim}`}>
        No chain TVL data available
      </div>
    );
  }

  return (
    <div>
      {/* Chain badges */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
        {radarData.map((item, i) => (
          <span
            key={item.chain}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: themeColors.palette[i % themeColors.palette.length] + '20',
              color: themeColors.palette[i % themeColors.palette.length],
              border: `1px solid ${themeColors.palette[i % themeColors.palette.length]}30`,
            }}
          >
            {item.chain}
            <span style={{ opacity: 0.7 }}>{formatTVL(item.rawTvl.TVL)}</span>
          </span>
        ))}
      </div>

      {/* Radar chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke={gridStroke} />
            <PolarAngleAxis
              dataKey="chain"
              tick={{ fill: axisTextFill, fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: axisTextFill, fontSize: 9 }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              name="TVL"
              dataKey="TVL"
              stroke={themeColors.primary}
              fill={themeColors.primary}
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{
                r: 4,
                fill: themeColors.primary,
                stroke: siteTheme === 'light-blue' ? '#fff' : '#0a0a0f',
                strokeWidth: 2,
              }}
            />
            <Tooltip content={<CustomTooltip siteTheme={siteTheme} />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      {insight && (
        <p className={`text-[10px] mt-2 text-center italic ${st.textDim}`}>
          {insight}
        </p>
      )}
    </div>
  );
}
