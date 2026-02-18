'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors } from '@/lib/live-dashboard/theme';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

/* ---------- helpers ---------- */

function formatTVL(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/**
 * Map a 1d change value to a color.
 * Positive changes get green tones, negative get red tones.
 * The intensity scales with the magnitude of the change.
 */
function changeToColor(change1d: number): string {
  const clamped = Math.max(-15, Math.min(15, change1d));
  const intensity = Math.abs(clamped) / 15; // 0 to 1

  if (clamped >= 0) {
    // Green spectrum: from dim to bright
    const r = Math.round(20 - intensity * 10);
    const g = Math.round(80 + intensity * 131); // 80..211
    const b = Math.round(60 + intensity * 93);  // 60..153
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Red spectrum: from dim to bright
    const r = Math.round(120 + intensity * 119); // 120..239
    const g = Math.round(60 - intensity * 32);   // 60..28
    const b = Math.round(60 - intensity * 32);   // 60..28
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/* ---------- custom treemap content ---------- */

interface CustomContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  tvlFormatted?: string;
  color?: string;
  siteTheme?: string;
}

function CustomTreemapContent(props: CustomContentProps) {
  const { x = 0, y = 0, width = 0, height = 0, name, tvlFormatted, color } = props;

  if (width < 30 || height < 25) return null;

  const showTVL = width > 60 && height > 40;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        ry={4}
        fill={color || '#374151'}
        stroke="rgba(10, 10, 15, 0.8)"
        strokeWidth={2}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 + (showTVL ? -6 : 0)}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={width > 80 ? 11 : 9}
        fontWeight="bold"
      >
        {name}
      </text>
      {showTVL && tvlFormatted && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.65)"
          fontSize={9}
        >
          {tvlFormatted}
        </text>
      )}
    </g>
  );
}

/* ---------- tooltip ---------- */

function CustomTooltip({ active, payload, siteTheme }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  const bg = siteTheme === 'light-blue' ? '#ffffff' : '#111827';
  const border = siteTheme === 'light-blue' ? '#bfdbfe' : '#374151';
  const text = siteTheme === 'light-blue' ? '#1e293b' : '#d1d5db';
  const change = item.change1d ?? 0;
  const changeColor = change >= 0 ? '#34d399' : '#ef4444';

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
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{item.name}</div>
      <div>TVL: {formatTVL(item.tvl)}</div>
      <div>Category: {item.category}</div>
      <div>
        1d Change:{' '}
        <span style={{ color: changeColor }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>
      {item.mcap > 0 && <div>Market Cap: {formatTVL(item.mcap)}</div>}
    </div>
  );
}

/* ---------- component ---------- */

// Recharts v3 Treemap typing workaround for Tooltip children
const TypedTreemap = Treemap as any;

export function DefiTVLChartWidget() {
  const { siteTheme, colorTheme, data } = useLiveDashboardStore(useShallow((s) => ({
    siteTheme: s.siteTheme,
    colorTheme: s.customization.colorTheme,
    data: s.data,
  })));
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);

  const { treeData, insight } = useMemo(() => {
    const protocols = data.defiProtocols;
    if (!protocols || protocols.length === 0) {
      return { treeData: null, insight: null };
    }

    // Sort by TVL descending and take top 30
    const sorted = [...protocols]
      .filter((p) => p.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 30);

    const totalTVL = sorted.reduce((sum, p) => sum + p.tvl, 0);

    const items = sorted.map((protocol) => ({
      name: protocol.name,
      size: protocol.tvl,
      tvl: protocol.tvl,
      tvlFormatted: formatTVL(protocol.tvl),
      change1d: protocol.change_1d ?? 0,
      category: protocol.category || 'Unknown',
      mcap: protocol.mcap || 0,
      color: changeToColor(protocol.change_1d ?? 0),
      siteTheme,
    }));

    // Insight
    const gaining = sorted.filter((p) => (p.change_1d ?? 0) >= 0).length;
    const losing = sorted.length - gaining;
    const top1 = sorted[0];
    const top1Pct = totalTVL > 0 ? ((top1.tvl / totalTVL) * 100).toFixed(1) : '0';
    const insightText = `Total TVL: ${formatTVL(totalTVL)} · ${top1.name} leads at ${top1Pct}% · ${gaining} gaining, ${losing} losing (1d)`;

    return { treeData: items, insight: insightText };
  }, [data.defiProtocols, siteTheme]);

  /* ---- loading state ---- */
  if (!data.defiProtocols) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="grid grid-cols-4 gap-1 w-full h-40">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  /* ---- empty state ---- */
  if (!treeData || treeData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-sm ${st.textDim}`}>
        No DeFi protocol data available
      </div>
    );
  }

  return (
    <div>
      {/* Legend: green = positive 1d, red = negative 1d */}
      <div className="flex items-center justify-center gap-4 mb-2 text-[9px]">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#34d399' }} />
          <span className={st.textDim}>Positive 1d</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#ef4444' }} />
          <span className={st.textDim}>Negative 1d</span>
        </div>
        <span className={st.textFaint}>Size = TVL</span>
      </div>

      {/* Treemap */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <TypedTreemap
            data={treeData}
            dataKey="size"
            nameKey="name"
            stroke="rgba(10, 10, 15, 0.8)"
            strokeWidth={2}
            content={CustomTreemapContent as any}
            isAnimationActive={true}
            animationDuration={800}
          >
            <Tooltip content={<CustomTooltip siteTheme={siteTheme} />} />
          </TypedTreemap>
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
