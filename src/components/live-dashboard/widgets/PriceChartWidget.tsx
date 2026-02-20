'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors, CHART_HEIGHT_MAP, formatPrice, formatCompact } from '@/lib/live-dashboard/theme';
import { getCurrencySymbol } from '@/lib/live-dashboard/currency';

interface PriceChartWidgetProps {
  coinId?: string;
  days?: number;
}

export function PriceChartWidget({ coinId = 'bitcoin' }: PriceChartWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight];
  const cur = customization.vsCurrency || 'usd';
  const isSmooth = customization.chartStyle === 'smooth';
  const ohlcData = data.ohlc[coinId];

  if (!ohlcData || ohlcData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse">
        <div className="w-full h-48 bg-gray-700 rounded" />
      </div>
    );
  }

  // Simple SVG line chart from OHLC close prices
  const closes = ohlcData.map((d) => d[4]); // [timestamp, open, high, low, close]
  const timestamps = ohlcData.map((d) => d[0]);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const w = 600;
  const h = chartHeight;
  const padding = 20;

  const points = closes.map((p, i) => {
    const x = padding + (i / (closes.length - 1)) * (w - padding * 2);
    const y = padding + (1 - (p - min) / range) * (h - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Area fill
  const areaPoints = `${padding},${h - padding} ${points} ${w - padding},${h - padding}`;

  const isUp = closes[closes.length - 1] >= closes[0];
  const lineColor = isUp ? themeColors.primary : '#ef4444';
  const fillColor = isUp ? themeColors.fill : 'rgba(239, 68, 68, 0.1)';

  const currentPrice = closes[closes.length - 1];
  const startPrice = closes[0];
  const changePercent = ((currentPrice - startPrice) / startPrice) * 100;

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-2xl font-bold text-white">{formatPrice(currentPrice, cur)}</span>
          <span className={`ml-2 text-sm font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(timestamps[0])} — {formatDate(timestamps[timestamps.length - 1])}
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id={`grad-${coinId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padding + pct * (h - padding * 2);
          const val = max - pct * range;
          return (
            <g key={pct}>
              <line x1={padding} y1={y} x2={w - padding} y2={y} stroke="#374151" strokeWidth={0.5} />
              <text x={padding - 5} y={y + 3} fill="#6b7280" fontSize={9} textAnchor="end">
                {formatCompact(val, cur)}
              </text>
            </g>
          );
        })}
        {/* Area */}
        <polygon points={areaPoints} fill={`url(#grad-${coinId})`} />
        {/* Line */}
        <polyline points={points} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin={isSmooth ? 'round' : 'miter'} strokeLinecap={isSmooth ? 'round' : 'butt'} />
      </svg>
    </div>
  );
}
