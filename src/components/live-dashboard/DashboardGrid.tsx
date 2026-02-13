'use client';

import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { DashboardWidget } from './DashboardWidget';

interface DashboardGridProps {
  definition: LiveDashboardDefinition;
}

export function DashboardGrid({ definition }: DashboardGridProps) {
  const gridCols = definition.gridColumns;
  const customization = useLiveDashboardStore((s) => s.customization);

  return (
    <div
      className="grid gap-5"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
      }}
    >
      {definition.widgets
        .sort((a, b) => (a.mobileOrder ?? 99) - (b.mobileOrder ?? 99))
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
