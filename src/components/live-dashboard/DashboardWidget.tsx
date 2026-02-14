'use client';

import { Suspense, type ComponentType } from 'react';
import { AlertCircle } from 'lucide-react';
import { CARD_CLASSES } from '@/lib/live-dashboard/theme';

// Widget registry — maps component name strings to actual components
import { KPICards } from './widgets/KPICards';
import { TopCoinsTable } from './widgets/TopCoinsTable';
import { PriceChartWidget } from './widgets/PriceChartWidget';
import { GainersLosersWidget } from './widgets/GainersLosersWidget';
import { FearGreedWidget } from './widgets/FearGreedWidget';
import { TrendingWidget } from './widgets/TrendingWidget';
import { DominanceWidget } from './widgets/DominanceWidget';
// Phase 2 widgets (lazy-loaded via dynamic import is not needed — tree-shaking handles it)
import { CandlestickChartWidget } from './widgets/CandlestickChartWidget';
import { VolumeChartWidget } from './widgets/VolumeChartWidget';
import { HeatmapWidget } from './widgets/HeatmapWidget';
import { TreemapWidget } from './widgets/TreemapWidget';
import { MultiLineChartWidget } from './widgets/MultiLineChartWidget';
import { RadarChartWidget } from './widgets/RadarChartWidget';
import { PieChartWidget } from './widgets/PieChartWidget';
import { CorrelationWidget } from './widgets/CorrelationWidget';
import { CategoryBarWidget } from './widgets/CategoryBarWidget';
import { CoinCompareWidget } from './widgets/CoinCompareWidget';
import { ExchangeVolumeWidget } from './widgets/ExchangeVolumeWidget';
import { SupplyWidget } from './widgets/SupplyWidget';
import { MarketCapTimelineWidget } from './widgets/MarketCapTimelineWidget';
// Phase 3 widgets
import { BubbleChartWidget } from './widgets/BubbleChartWidget';
import { AltseasonWidget } from './widgets/AltseasonWidget';
import { HistoricalPriceWidget } from './widgets/HistoricalPriceWidget';
import { DerivativesTableWidget } from './widgets/DerivativesTableWidget';
import { PerformanceHeatmapWidget } from './widgets/PerformanceHeatmapWidget';
import { MiniSparklineGrid } from './widgets/MiniSparklineGrid';
// Phase 4 comparison widgets
import { BoxPlotWidget } from './widgets/BoxPlotWidget';
import { ReturnsBarWidget } from './widgets/ReturnsBarWidget';
// Phase 5 advanced charts
import { AreaChartWidget } from './widgets/AreaChartWidget';
import { WaterfallChartWidget } from './widgets/WaterfallChartWidget';

const WIDGET_REGISTRY: Record<string, ComponentType<any>> = {
  KPICards,
  TopCoinsTable,
  PriceChartWidget,
  GainersLosersWidget,
  FearGreedWidget,
  TrendingWidget,
  DominanceWidget,
  CandlestickChartWidget,
  VolumeChartWidget,
  HeatmapWidget,
  TreemapWidget,
  MultiLineChartWidget,
  RadarChartWidget,
  PieChartWidget,
  CorrelationWidget,
  CategoryBarWidget,
  CoinCompareWidget,
  ExchangeVolumeWidget,
  SupplyWidget,
  MarketCapTimelineWidget,
  BubbleChartWidget,
  AltseasonWidget,
  HistoricalPriceWidget,
  DerivativesTableWidget,
  PerformanceHeatmapWidget,
  MiniSparklineGrid,
  BoxPlotWidget,
  ReturnsBarWidget,
  AreaChartWidget,
  WaterfallChartWidget,
};

interface DashboardWidgetProps {
  component: string;
  title: string;
  gridColumn: string;
  gridRow?: string;
  props?: Record<string, any>;
}

export function DashboardWidget({ component, title, gridColumn, gridRow, props }: DashboardWidgetProps) {
  const Component = WIDGET_REGISTRY[component];

  // KPI cards get no wrapper card (they are their own cards)
  if (component === 'KPICards') {
    return (
      <div style={{ gridColumn, gridRow }}>
        {Component ? <Component {...(props || {})} /> : <UnknownWidget name={component} />}
      </div>
    );
  }

  return (
    <div
      className={`${CARD_CLASSES} p-5 flex flex-col`}
      style={{ gridColumn, gridRow }}
    >
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <div className="w-1 h-3.5 bg-emerald-400 rounded-full" />
        {title}
      </h3>
      <div className="flex-1 min-h-0">
        <Suspense fallback={<WidgetSkeleton />}>
          {Component ? <Component {...(props || {})} /> : <UnknownWidget name={component} />}
        </Suspense>
      </div>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-white/[0.04] rounded w-3/4" />
      <div className="h-4 bg-white/[0.04] rounded w-1/2" />
      <div className="h-24 bg-white/[0.04] rounded" />
    </div>
  );
}

function UnknownWidget({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm p-4">
      <AlertCircle className="w-4 h-4" />
      Widget &quot;{name}&quot; not found
    </div>
  );
}
