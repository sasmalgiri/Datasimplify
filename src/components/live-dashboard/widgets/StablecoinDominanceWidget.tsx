'use client';

import { useMemo, useState, useCallback } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors } from '@/lib/live-dashboard/theme';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector,
} from 'recharts';

/* ---------- helpers ---------- */

function formatCirculating(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/* ---------- active shape for hover ---------- */

function renderActiveShape(props: any) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} fontSize={13} fontWeight="bold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#9ca3af" fontSize={10}>
        {payload.symbol}
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fill="#d1d5db" fontSize={11}>
        {formatCirculating(value)}
      </text>
      <text x={cx} y={cy + 40} textAnchor="middle" fill="#6b7280" fontSize={10}>
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
}

/* ---------- custom tooltip ---------- */

function CustomPieTooltip({ active, payload, siteTheme }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

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
      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
        {item.name} ({item.symbol})
      </div>
      <div>Circulating: {formatCirculating(item.value)}</div>
    </div>
  );
}

/* ---------- component ---------- */

// Recharts v3 Pie typing workaround for Cell children
const TypedPie = Pie as any;

export function StablecoinDominanceWidget() {
  const { siteTheme, colorTheme, data } = useLiveDashboardStore((s) => ({
    siteTheme: s.siteTheme,
    colorTheme: s.customization.colorTheme,
    data: s.data,
  }));
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);

  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const onPieEnter = useCallback((_: any, index: number) => setActiveIndex(index), []);
  const onPieLeave = useCallback(() => setActiveIndex(-1), []);

  const { pieData, totalMcap, insight } = useMemo(() => {
    const stablecoins = data.defiStablecoins;
    if (!stablecoins || stablecoins.length === 0) {
      return { pieData: null, totalMcap: 0, insight: null };
    }

    // Sort by circulating supply descending and take top 10
    const sorted = [...stablecoins]
      .filter((s) => s.circulating > 0)
      .sort((a, b) => b.circulating - a.circulating);

    const top10 = sorted.slice(0, 10);
    const totalAll = sorted.reduce((sum, s) => sum + s.circulating, 0);
    const top10Total = top10.reduce((sum, s) => sum + s.circulating, 0);

    const slices: { name: string; symbol: string; value: number; fill: string }[] = top10.map(
      (sc, i) => ({
        name: sc.name,
        symbol: sc.symbol,
        value: sc.circulating,
        fill: themeColors.palette[i % themeColors.palette.length] as string,
      }),
    );

    // Add "Others" slice if there are more stablecoins beyond top 10
    if (sorted.length > 10 && totalAll > top10Total) {
      slices.push({
        name: 'Others',
        symbol: 'OTHER',
        value: totalAll - top10Total,
        fill: '#4b5563',
      });
    }

    // Insight text
    const top1 = top10[0];
    const top1Pct = totalAll > 0 ? ((top1.circulating / totalAll) * 100).toFixed(1) : '0';
    const top3Sum = top10.slice(0, 3).reduce((s, sc) => s + sc.circulating, 0);
    const top3Pct = totalAll > 0 ? ((top3Sum / totalAll) * 100).toFixed(1) : '0';
    const insightText = `${top1.name} dominates at ${top1Pct}% · Top 3 hold ${top3Pct}% · ${sorted.length} stablecoins tracked`;

    return { pieData: slices, totalMcap: totalAll, insight: insightText };
  }, [data.defiStablecoins, themeColors]);

  /* ---- loading state ---- */
  if (!data.defiStablecoins) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="h-32 w-32 rounded-full bg-gray-800/50" />
      </div>
    );
  }

  /* ---- empty state ---- */
  if (!pieData || pieData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-sm ${st.textDim}`}>
        No stablecoin data available
      </div>
    );
  }

  const tooltipText = siteTheme === 'light-blue' ? '#1e293b' : '#d1d5db';

  return (
    <div>
      {/* Total market cap header */}
      <div className="text-center mb-3">
        <p className={`text-[10px] uppercase tracking-widest font-medium ${st.textDim}`}>
          Total Stablecoin Market Cap
        </p>
        <p className={`text-2xl font-bold ${st.textPrimary}`}>
          {formatCirculating(totalMcap)}
        </p>
      </div>

      {/* Pie chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <TypedPie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              activeIndex={activeIndex >= 0 ? activeIndex : undefined}
              activeShape={renderActiveShape}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {pieData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.fill} stroke="none" />
              ))}
            </TypedPie>
            <Tooltip content={<CustomPieTooltip siteTheme={siteTheme} />} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: tooltipText, fontSize: '10px' }}>{value}</span>
              )}
            />
          </PieChart>
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
