'use client';

import { Suspense, type ComponentType } from 'react';
import { AlertCircle } from 'lucide-react';

// Widget registry — maps component name strings to actual components
import { KPICards } from './widgets/KPICards';
import { TopCoinsTable } from './widgets/TopCoinsTable';
import { PriceChartWidget } from './widgets/PriceChartWidget';
import { GainersLosersWidget } from './widgets/GainersLosersWidget';
import { FearGreedWidget } from './widgets/FearGreedWidget';
import { TrendingWidget } from './widgets/TrendingWidget';
import { DominanceWidget } from './widgets/DominanceWidget';

const WIDGET_REGISTRY: Record<string, ComponentType<any>> = {
  KPICards,
  TopCoinsTable,
  PriceChartWidget,
  GainersLosersWidget,
  FearGreedWidget,
  TrendingWidget,
  DominanceWidget,
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
      className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex flex-col"
      style={{ gridColumn, gridRow }}
    >
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
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
      <div className="h-4 bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
      <div className="h-20 bg-gray-700 rounded" />
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
