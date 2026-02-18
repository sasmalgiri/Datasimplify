'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts';

/* ---------- helpers ---------- */

function formatTVL(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/* ---------- component ---------- */

export function ProtocolChainBreakdownWidget() {
  const { data, siteTheme, customization } = useLiveDashboardStore(useShallow((s) => ({
    data: s.data,
    siteTheme: s.siteTheme,
    customization: s.customization,
  })));
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(customization.colorTheme);
  const isLight = siteTheme === 'light-blue';

  const { chartData, totalTVL, insight } = useMemo(() => {
    const detail = data.defiProtocolDetail;
    if (!detail || !detail.chainTvls) {
      return { chartData: null, totalTVL: 0, insight: null };
    }

    const entries = Object.entries(detail.chainTvls)
      .filter(([, tvl]) => tvl > 0)
      .sort(([, a], [, b]) => b - a);

    if (entries.length === 0) {
      return { chartData: null, totalTVL: 0, insight: null };
    }

    const total = entries.reduce((sum, [, tvl]) => sum + tvl, 0);

    const rows = entries.map(([chain, tvl]) => ({
      name: chain,
      value: tvl,
      pct: total > 0 ? (tvl / total) * 100 : 0,
    }));

    const topChain = entries[0][0];
    const topPct = total > 0 ? ((entries[0][1] / total) * 100).toFixed(1) : '0';
    const chainCount = entries.length;
    const insightText = `Deployed across ${chainCount} chain${chainCount !== 1 ? 's' : ''} \u2014 ${topChain} holds ${topPct}% of TVL`;

    return { chartData: rows, totalTVL: total, insight: insightText };
  }, [data.defiProtocolDetail]);

  /* ---- loading skeleton ---- */
  if (!data.defiProtocolDetail) {
    return (
      <div className="animate-pulse flex items-center justify-center" style={{ height: '200px' }}>
        <div
          className="w-32 h-32 rounded-full"
          style={{ backgroundColor: isLight ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.05)' }}
        />
      </div>
    );
  }

  /* ---- empty state ---- */
  if (!chartData || chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-sm ${st.textDim}`}>
        No chain breakdown data available
      </div>
    );
  }

  const tooltipBg = isLight ? '#ffffff' : '#111827';
  const tooltipBorder = isLight ? '#cbd5e1' : '#374151';
  const tooltipText = isLight ? '#1e293b' : '#d1d5db';
  const legendColor = isLight ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.5)';
  const borderColor = isLight ? '#ffffff' : '#0a0a0f';

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const CustomTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const entry = payload[0]?.payload;
    if (!entry) return null;

    return (
      <div
        style={{
          backgroundColor: tooltipBg,
          border: `1px solid ${tooltipBorder}`,
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '11px',
          color: tooltipText,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{entry.name}</div>
        <div>TVL: {formatTVL(entry.value)}</div>
        <div>Share: {entry.pct.toFixed(1)}%</div>
      </div>
    );
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <div>
      <div style={{ height: `${CHART_HEIGHT_MAP[customization.chartHeight]}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius="40%"
              outerRadius="70%"
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
              stroke={borderColor}
              strokeWidth={2}
              animationDuration={customization.showAnimations ? 800 : 0}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={themeColors.palette[index % themeColors.palette.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltipContent />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: legendColor, fontSize: '10px' }}>{value}</span>
              )}
              wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      {insight && (
        <p className={`text-[10px] ${st.textDim} mt-1 text-center italic`}>
          {insight}
        </p>
      )}
    </div>
  );
}
