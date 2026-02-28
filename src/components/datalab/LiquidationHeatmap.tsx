'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { isFeatureAvailable } from '@/lib/datalab/modeConfig';

const LEVERAGES = [2, 3, 5, 10, 25, 50, 100];

interface LiqLevel {
  leverage: number;
  longLiq: number;
  shortLiq: number;
}

interface LiquidationHeatmapProps {
  show: boolean;
  onClose: () => void;
}

export function LiquidationHeatmap({ show, onClose }: LiquidationHeatmapProps) {
  const dataLabMode = useDataLabStore((s) => s.dataLabMode);
  const rawData = useDataLabStore((s) => s.rawData);

  if (!isFeatureAvailable(dataLabMode, 'liquidationHeatmap')) return null;
  if (!show) return null;

  const closes = rawData.price as number[] | undefined;
  const currentPrice = closes && closes.length > 0 ? closes[closes.length - 1] : null;

  const levels = useMemo<LiqLevel[]>(() => {
    if (!currentPrice) return [];
    return LEVERAGES.map((lev) => ({
      leverage: lev,
      longLiq: currentPrice * (1 - 1 / lev), // Long liquidation = price * (1 - 1/leverage)
      shortLiq: currentPrice * (1 + 1 / lev), // Short liquidation = price * (1 + 1/leverage)
    }));
  }, [currentPrice]);

  if (!currentPrice || levels.length === 0) return null;

  const formatPrice = (p: number) =>
    p >= 1 ? `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `$${p.toFixed(4)}`;

  return (
    <div className="border-t border-white/[0.04] bg-white/[0.01] max-w-[1800px] mx-auto">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white flex items-center gap-2">
            <span className="text-orange-400">&#9632;</span>
            Liquidation Levels (Estimated)
            <span className="text-[10px] text-gray-500 font-normal ml-2">
              Current: {formatPrice(currentPrice)}
            </span>
          </h4>
          <button type="button" title="Close liquidation heatmap" onClick={onClose}
            className="text-gray-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {levels.map((lev) => {
            const longDist = ((currentPrice - lev.longLiq) / currentPrice * 100).toFixed(1);
            const shortDist = ((lev.shortLiq - currentPrice) / currentPrice * 100).toFixed(1);

            return (
              <div key={lev.leverage} className="text-center">
                <div className="text-[9px] text-gray-500 font-medium mb-1">{lev.leverage}x</div>
                <div className="bg-red-500/10 border border-red-500/20 rounded px-1.5 py-1 mb-0.5">
                  <div className="text-[9px] text-red-400 font-mono">{formatPrice(lev.longLiq)}</div>
                  <div className="text-[8px] text-red-400/60">-{longDist}%</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-1">
                  <div className="text-[9px] text-emerald-400 font-mono">{formatPrice(lev.shortLiq)}</div>
                  <div className="text-[8px] text-emerald-400/60">+{shortDist}%</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-2 text-[9px] text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-red-500/30" /> Long liquidation (below)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-500/30" /> Short liquidation (above)
          </span>
          <span className="ml-auto">Estimated from current price + leverage. Not real exchange data.</span>
        </div>
      </div>
    </div>
  );
}
