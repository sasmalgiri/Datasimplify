'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, CandlestickChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, DataZoomComponent,
  LegendComponent, MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useDataLabStore } from '@/lib/datalab/store';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { buildChartOption } from '@/lib/datalab/chartBuilder';
import { Loader2, FlaskConical } from 'lucide-react';

echarts.use([
  LineChart, BarChart, CandlestickChart, ScatterChart,
  GridComponent, TooltipComponent, DataZoomComponent,
  LegendComponent, MarkLineComponent, CanvasRenderer,
]);

export function DataLabCanvas() {
  const {
    layers, timestamps, ohlcRaw, editedCells, normalizeMode, isLoading, error,
  } = useDataLabStore();
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);

  const option = useMemo(() => {
    if (timestamps.length === 0 || layers.length === 0) return null;
    return buildChartOption({
      layers,
      timestamps,
      ohlcRaw,
      editedCells,
      normalizeMode,
      siteTheme,
    });
  }, [layers, timestamps, ohlcRaw, editedCells, normalizeMode, siteTheme]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-400 font-medium mb-1">Failed to load data</p>
          <p className="text-red-400/70 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!option) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <FlaskConical className="w-10 h-10 text-emerald-400/30 mx-auto mb-4" />
          <p className="text-gray-300 text-lg font-medium mb-2">Choose a preset to get started</p>
          <p className="text-gray-500 text-sm mb-1">
            Click one of the preset buttons above to load a pre-configured analysis,
            or use the <span className="text-emerald-400">+ Add</span> button to build your own.
          </p>
          <p className="text-gray-600 text-xs">
            Hover over any element for an explanation of what it does.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0">
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: '100%', width: '100%' }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
