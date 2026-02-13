'use client';

import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { DashboardWidget } from './DashboardWidget';

interface DashboardGridProps {
  definition: LiveDashboardDefinition;
}

export function DashboardGrid({ definition }: DashboardGridProps) {
  const gridCols = definition.gridColumns;

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
      }}
    >
      {definition.widgets
        .sort((a, b) => (a.mobileOrder ?? 99) - (b.mobileOrder ?? 99))
        .map((widget) => (
          <DashboardWidget
            key={widget.id}
            component={widget.component}
            title={widget.title}
            gridColumn={widget.gridColumn}
            gridRow={widget.gridRow}
            props={widget.props}
          />
        ))}
    </div>
  );
}
