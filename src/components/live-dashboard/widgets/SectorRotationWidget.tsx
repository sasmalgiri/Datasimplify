'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

type MomentumLabel = 'Accelerating' | 'Stable' | 'Decelerating';

interface SectorData {
  name: string;
  change: number;
  momentum: MomentumLabel;
  relativeStrength: number; // vs market average
}

export function SectorRotationWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { inflow, outflow, insight } = useMemo(() => {
    const categories = data.categories;
    const global = data.global;
    if (!categories || categories.length < 3) return { inflow: null, outflow: null, insight: null };

    // Market average change
    const mcapChange = global?.market_cap_change_percentage_24h_usd || 0;

    // Process sectors
    const sectors: SectorData[] = categories
      .filter((c: any) => c.name && c.market_cap_change_24h != null && Math.abs(c.market_cap_change_24h) < 100)
      .map((c: any) => {
        const change = c.market_cap_change_24h || 0;
        const relStrength = change - mcapChange; // How much above/below market

        // Momentum: compare sector change to market average
        let momentum: MomentumLabel;
        if (relStrength > 2) momentum = 'Accelerating';
        else if (relStrength < -2) momentum = 'Decelerating';
        else momentum = 'Stable';

        return {
          name: c.name,
          change,
          momentum,
          relativeStrength: relStrength,
        };
      })
      .sort((a, b) => b.relativeStrength - a.relativeStrength);

    const inflows = sectors.filter((s) => s.relativeStrength > 0).slice(0, 5);
    const outflows = sectors.filter((s) => s.relativeStrength < 0).sort((a, b) => a.relativeStrength - b.relativeStrength).slice(0, 5);

    const topInflow = inflows[0];
    const topOutflow = outflows[0];
    const insightText = topInflow && topOutflow
      ? `Rotation into ${topInflow.name} (${topInflow.change >= 0 ? '+' : ''}${topInflow.change.toFixed(1)}%). Away from ${topOutflow.name} (${topOutflow.change.toFixed(1)}%). Market avg: ${mcapChange >= 0 ? '+' : ''}${mcapChange.toFixed(1)}%.`
      : 'Insufficient sector data for rotation analysis.';

    return { inflow: inflows, outflow: outflows, insight: insightText };
  }, [data.categories, data.global]);

  if (!data.categories) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-800/50 rounded" />
        ))}
      </div>
    );
  }

  if (!inflow && !outflow) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No sector data</div>;
  }

  const MomentumIcon = ({ momentum }: { momentum: MomentumLabel }) => {
    if (momentum === 'Accelerating') return <ArrowUpRight className="w-3 h-3 text-emerald-400" />;
    if (momentum === 'Decelerating') return <ArrowDownRight className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-gray-500" />;
  };

  const SectorRow = ({ sector, type }: { sector: SectorData; type: 'inflow' | 'outflow' }) => (
    <div className="flex items-center gap-2 text-xs py-1">
      <MomentumIcon momentum={sector.momentum} />
      <span className="text-white font-medium w-32 truncate">{sector.name}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, Math.abs(sector.relativeStrength) * 10)}%`,
            backgroundColor: type === 'inflow' ? '#22c55e' : '#ef4444',
          }}
        />
      </div>
      <span className={`font-mono w-16 text-right ${sector.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(1)}%
      </span>
    </div>
  );

  return (
    <div>
      {/* Inflows */}
      {inflow && inflow.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Money Flowing In</span>
          </div>
          <div className="space-y-0.5">
            {inflow.map((s) => <SectorRow key={s.name} sector={s} type="inflow" />)}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-800 my-2" />

      {/* Outflows */}
      {outflow && outflow.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Money Flowing Out</span>
          </div>
          <div className="space-y-0.5">
            {outflow.map((s) => <SectorRow key={s.name} sector={s} type="outflow" />)}
          </div>
        </div>
      )}

      {insight && <p className="text-[10px] text-gray-400 mt-3 text-center italic">{insight}</p>}
    </div>
  );
}
