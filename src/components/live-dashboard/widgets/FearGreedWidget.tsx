'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';

function getColor(value: number): string {
  if (value <= 25) return '#ef4444'; // Extreme Fear - red
  if (value <= 45) return '#f97316'; // Fear - orange
  if (value <= 55) return '#eab308'; // Neutral - yellow
  if (value <= 75) return '#84cc16'; // Greed - lime
  return '#22c55e'; // Extreme Greed - green
}

function getLabel(classification: string): string {
  return classification || 'Unknown';
}

export function FearGreedWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const fg = data.fearGreed?.[0];

  if (!fg) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="w-32 h-32 bg-gray-700 rounded-full" />
      </div>
    );
  }

  const value = parseInt(fg.value, 10);
  const color = getColor(value);
  const label = getLabel(fg.value_classification);

  // SVG gauge
  const radius = 60;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative">
        <svg width="160" height="100" viewBox="0 0 160 100">
          {/* Background arc */}
          <path
            d="M 10 90 A 60 60 0 0 1 150 90"
            fill="none"
            stroke="#374151"
            strokeWidth={10}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 10 90 A 60 60 0 0 1 150 90"
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-3xl font-bold text-white">{value}</span>
        </div>
      </div>
      <span className="text-lg font-semibold mt-2" style={{ color }}>{label}</span>
      <span className="text-xs text-gray-500 mt-1">
        {new Date(parseInt(fg.timestamp, 10) * 1000).toLocaleDateString()}
      </span>
    </div>
  );
}
