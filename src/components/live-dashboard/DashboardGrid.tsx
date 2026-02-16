'use client';

import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { useLiveDashboardStore, DEFAULT_VISIBLE_WIDGET_COUNT } from '@/lib/live-dashboard/store';
import { useAuth } from '@/lib/auth';
import { PLAN_LIMITS } from '@/lib/entitlements';
import { DashboardWidget } from './DashboardWidget';

interface DashboardGridProps {
  definition: LiveDashboardDefinition;
}

export function DashboardGrid({ definition }: DashboardGridProps) {
  const gridCols = definition.gridColumns;
  const customization = useLiveDashboardStore((s) => s.customization);
  const enabledWidgets = useLiveDashboardStore((s) => s.enabledWidgets);
  const { profile } = useAuth();

  const tier = profile?.subscription_tier ?? 'free';
  const maxWidgets = PLAN_LIMITS[tier].maxDashboardWidgets;

  // Determine which widgets to show
  const sortedWidgets = [...definition.widgets].sort((a, b) => (a.mobileOrder ?? 99) - (b.mobileOrder ?? 99));
  const defaultWidgetIds = sortedWidgets.slice(0, DEFAULT_VISIBLE_WIDGET_COUNT).map((w) => w.id);
  const activeWidgetIds = (enabledWidgets[definition.slug] ?? defaultWidgetIds).slice(0, maxWidgets);

  return (
    <div
      className="grid gap-5"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
      }}
    >
      {sortedWidgets
        .filter((widget) => activeWidgetIds.includes(widget.id))
        .map((widget) => {
          // Merge user customization with widget definition props
          const effectiveProps = { ...widget.props };
          if (customization.coinId && effectiveProps.coinId) {
            effectiveProps.coinId = customization.coinId;
          }
          if (customization.coinIds.length > 0 && effectiveProps.coinIds) {
            effectiveProps.coinIds = customization.coinIds;
          }
          if (customization.days > 0 && effectiveProps.days) {
            effectiveProps.days = customization.days;
          }
          if (customization.dataLimit > 0 && effectiveProps.limit != null) {
            effectiveProps.limit = customization.dataLimit;
          }

          return (
            <DashboardWidget
              key={widget.id}
              component={widget.component}
              title={widget.title}
              gridColumn={widget.gridColumn}
              gridRow={widget.gridRow}
              props={effectiveProps}
            />
          );
        })}
    </div>
  );
}
