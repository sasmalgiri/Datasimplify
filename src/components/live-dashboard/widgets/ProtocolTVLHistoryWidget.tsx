'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
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

export function ProtocolTVLHistoryWidget() {
  const { data, siteTheme, customization } = useLiveDashboardStore(useShallow((s) => ({
    data: s.data,
    siteTheme: s.siteTheme,
    customization: s.customization,
  })));
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(customization.colorTheme);
  const isLight = siteTheme === 'light-blue';

  const { chartData, insight } = useMemo(() => {
    const detail = data.defiProtocolDetail;
    if (!detail || !detail.tvlHistory || detail.tvlHistory.length === 0) {
      return { chartData: null, insight: null };
    }

    // Take only the last 90 days of history
    const history = detail.tvlHistory.slice(-90);

    const rows = history.map((entry) => ({
      date: new Date(entry.date * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      tvl: entry.tvl,
    }));

    const startTVL = history[0].tvl;
    const endTVL = history[history.length - 1].tvl;
    const changePct = startTVL > 0
      ? ((endTVL - startTVL) / startTVL) * 100
      : 0;
    const sign = changePct >= 0 ? '+' : '';
    const insightText = `TVL trend: ${formatTVL(startTVL)} \u2192 ${formatTVL(endTVL)} over 90d (${sign}${changePct.toFixed(1)}%)`;

    return { chartData: rows, insight: insightText };
  }, [data.defiProtocolDetail]);

  /* ---- loading skeleton ---- */
  if (!data.defiProtocolDetail) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-6 rounded"
            style={{
              width: `${60 + Math.random() * 40}%`,
              backgroundColor: isLight ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.05)',
            }}
          />
        ))}
      </div>
    );
  }

  /* ---- empty state ---- */
  if (!chartData || chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-sm ${st.textDim}`}>
        No TVL history available for this protocol
      </div>
    );
  }

  const tooltipBg = isLight ? '#ffffff' : '#111827';
  const tooltipBorder = isLight ? '#cbd5e1' : '#374151';
  const tooltipText = isLight ? '#1e293b' : '#d1d5db';
  const axisTextColor = isLight ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.4)';
  const gridStroke = isLight ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)';

  return (
    <div>
      <div style={{ height: `${CHART_HEIGHT_MAP[customization.chartHeight]}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="tvlHistoryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={themeColors.primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={themeColors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: axisTextColor, fontSize: 10 }}
              axisLine={{ stroke: gridStroke }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: axisTextColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatTVL(v)}
              width={60}
            />
            <Tooltip
              formatter={(value: number | undefined) => [formatTVL(value ?? 0), 'TVL']}
              labelFormatter={(label: string) => label}
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '8px',
                fontSize: '11px',
              }}
              itemStyle={{ color: tooltipText }}
              labelStyle={{ color: tooltipText, fontWeight: 600 }}
              cursor={{ stroke: themeColors.primary, strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="tvl"
              stroke={themeColors.primary}
              strokeWidth={2}
              fill="url(#tvlHistoryGrad)"
              animationDuration={customization.showAnimations ? 800 : 0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      {insight && (
        <p className={`text-[10px] ${st.textDim} mt-2 text-center italic`}>
          {insight}
        </p>
      )}
    </div>
  );
}
