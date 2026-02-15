'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { SankeyChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP, formatCompact } from '@/lib/live-dashboard/theme';

echarts.use([SankeyChart, TooltipComponent, CanvasRenderer]);

interface SankeyFlowWidgetProps {}

const CAP_TIERS = [
  { label: 'Mega Cap (>$100B)', min: 100e9 },
  { label: 'Large Cap ($10B–$100B)', min: 10e9 },
  { label: 'Mid Cap ($1B–$10B)', min: 1e9 },
  { label: 'Small Cap ($100M–$1B)', min: 100e6 },
  { label: 'Micro Cap (<$100M)', min: 0 },
] as const;

const PERF_BUCKETS = [
  { label: 'Strong Gain (>5%)', min: 5, color: '#22c55e' },
  { label: 'Gain (0–5%)', min: 0, color: '#4ade80' },
  { label: 'Loss (0 to −5%)', min: -5, color: '#f87171' },
  { label: 'Strong Loss (<−5%)', min: -Infinity, color: '#ef4444' },
] as const;

function getTier(mcap: number) {
  for (const t of CAP_TIERS) if (mcap >= t.min) return t.label;
  return CAP_TIERS[4].label;
}

function getBucket(change: number) {
  for (const b of PERF_BUCKETS) if (change >= b.min) return b.label;
  return PERF_BUCKETS[3].label;
}

export function SankeyFlowWidget({}: SankeyFlowWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight || 'normal'];

  const option = useMemo(() => {
    if (!data.markets?.length) return null;

    const linkMap = new Map<string, { value: number; count: number }>();

    for (const coin of data.markets) {
      const tier = getTier(coin.market_cap || 0);
      const bucket = getBucket(coin.price_change_percentage_24h || 0);
      const key = `${tier}||${bucket}`;
      const existing = linkMap.get(key) || { value: 0, count: 0 };
      existing.value += coin.market_cap || 0;
      existing.count += 1;
      linkMap.set(key, existing);
    }

    const nodeSet = new Set<string>();
    const links: { source: string; target: string; value: number; count: number }[] = [];

    linkMap.forEach(({ value, count }, key) => {
      const [source, target] = key.split('||');
      nodeSet.add(source);
      nodeSet.add(target);
      links.push({ source, target, value, count });
    });

    const palette = themeColors.palette;
    const nodes = Array.from(nodeSet).map((name, i) => {
      const perfBucket = PERF_BUCKETS.find((b) => b.label === name);
      return {
        name,
        itemStyle: { color: perfBucket ? perfBucket.color : palette[i % palette.length] },
      };
    });

    return {
      ...ECHARTS_THEME,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'item' as const,
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            const d = params.data;
            return `<b>${d.source}</b> → <b>${d.target}</b><br/>${d.count} coins<br/>MCap: ${formatCompact(d.value)}`;
          }
          return `<b>${params.name}</b>`;
        },
      },
      series: [
        {
          type: 'sankey',
          left: '2%',
          right: '2%',
          top: '5%',
          bottom: '5%',
          nodeWidth: 20,
          nodeGap: 10,
          layoutIterations: 32,
          emphasis: { focus: 'adjacency' },
          lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.5 },
          label: { color: '#fff', fontSize: 10 },
          data: nodes,
          links,
        },
      ],
    };
  }, [data.markets, themeColors]);

  if (!data.markets) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        Connect API key to load data
      </div>
    );
  }

  if (!option) return null;

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: chartHeight, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  );
}
