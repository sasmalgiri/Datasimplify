'use client';

import { useMemo, useRef, useCallback } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, CandlestickChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, DataZoomComponent,
  LegendComponent, MarkLineComponent, MarkAreaComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useDataLabStore } from '@/lib/datalab/store';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { buildChartOption } from '@/lib/datalab/chartBuilder';
import { getPresetById } from '@/lib/datalab/presets';
import { Loader2, FlaskConical } from 'lucide-react';

echarts.use([
  LineChart, BarChart, CandlestickChart, ScatterChart,
  GridComponent, TooltipComponent, DataZoomComponent,
  LegendComponent, MarkLineComponent, MarkAreaComponent, CanvasRenderer,
]);

export function DataLabCanvas() {
  const {
    layers, timestamps, ohlcRaw, editedCells, normalizeMode, logScale, vsCurrency,
    activePreset, drawings, activeDrawingTool, addDrawing, addPendingPoint, pendingPoints,
    clearPendingPoints, setActiveDrawingTool,
    isLoading, error,
  } = useDataLabStore();
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);

  const option = useMemo(() => {
    if (timestamps.length === 0 || layers.length === 0) return null;
    const preset = activePreset ? getPresetById(activePreset) : undefined;
    return buildChartOption({
      layers,
      timestamps,
      ohlcRaw,
      editedCells,
      normalizeMode,
      logScale,
      vsCurrency,
      zones: preset?.zones,
      drawings,
      siteTheme,
    });
  }, [layers, timestamps, ohlcRaw, editedCells, normalizeMode, logScale, vsCurrency, activePreset, drawings, siteTheme]);

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

  const chartInstanceRef = useRef<any>(null);

  const onChartReady = useCallback((instance: any) => {
    chartInstanceRef.current = instance;
  }, []);

  const onChartClick = useCallback((params: any) => {
    if (!activeDrawingTool || !chartInstanceRef.current) return;

    // Get the y-value from the click (data coordinate)
    const instance = chartInstanceRef.current;
    const pointInPixel = [params.event?.offsetX, params.event?.offsetY];
    if (!pointInPixel[0] || !pointInPixel[1]) return;

    // Convert pixel to data coordinate (use first yAxis on grid 0)
    const pointInData = instance.convertFromPixel({ gridIndex: 0 }, pointInPixel);
    if (!pointInData) return;

    const xIdx = Math.round(pointInData[0]);
    const yVal = pointInData[1];
    const ts = timestamps[xIdx] ?? xIdx;

    if (activeDrawingTool === 'hline') {
      // Single click → add horizontal line
      addDrawing({
        id: `draw-${Date.now()}`,
        type: 'hline',
        points: [{ x: ts, y: yVal }],
        color: '#fbbf24',
        label: '',
      });
      setActiveDrawingTool(null);
    } else if (activeDrawingTool === 'trendline') {
      const newPoints = [...pendingPoints, { x: ts, y: yVal }];
      if (newPoints.length >= 2) {
        addDrawing({
          id: `draw-${Date.now()}`,
          type: 'trendline',
          points: newPoints.slice(0, 2),
          color: '#60a5fa',
        });
        clearPendingPoints();
        setActiveDrawingTool(null);
      } else {
        addPendingPoint({ x: ts, y: yVal });
      }
    } else if (activeDrawingTool === 'fibonacci') {
      const newPoints = [...pendingPoints, { x: ts, y: yVal }];
      if (newPoints.length >= 2) {
        addDrawing({
          id: `draw-${Date.now()}`,
          type: 'fibonacci',
          points: newPoints.slice(0, 2),
          color: '#a78bfa',
        });
        clearPendingPoints();
        setActiveDrawingTool(null);
      } else {
        addPendingPoint({ x: ts, y: yVal });
      }
    }
  }, [activeDrawingTool, timestamps, pendingPoints, addDrawing, addPendingPoint, clearPendingPoints, setActiveDrawingTool]);

  return (
    <div className={`flex-1 min-h-0 ${activeDrawingTool ? 'cursor-crosshair' : ''}`}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: '100%', width: '100%' }}
        notMerge
        lazyUpdate
        onChartReady={onChartReady}
        onEvents={{ click: onChartClick }}
      />
    </div>
  );
}
