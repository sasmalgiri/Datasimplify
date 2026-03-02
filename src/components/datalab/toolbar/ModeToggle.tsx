'use client';

import { Sparkles, BarChart3, Zap } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { MODE_META } from '@/lib/datalab/modeConfig';
import type { DataLabMode } from '@/lib/datalab/types';
import { useState, useRef } from 'react';

const MODES: { value: DataLabMode; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'simple', label: 'Simple', Icon: Sparkles },
  { value: 'intermediate', label: 'Intermediate', Icon: BarChart3 },
  { value: 'advanced', label: 'Advanced', Icon: Zap },
];

export function ModeToggle() {
  const mode = useDataLabStore((s) => s.dataLabMode);
  const setMode = useDataLabStore((s) => s.setDataLabMode);
  const [hoveredMode, setHoveredMode] = useState<DataLabMode | null>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeModeClasses: Record<DataLabMode, string> = {
    simple: 'bg-emerald-400/20 text-emerald-300',
    intermediate: 'bg-blue-400/20 text-blue-300',
    advanced: 'bg-amber-400/20 text-amber-300',
  };

  const tooltipTextClasses: Record<DataLabMode, string> = {
    simple: 'text-emerald-300',
    intermediate: 'text-blue-300',
    advanced: 'text-amber-300',
  };

  return (
    <div className="relative inline-flex items-center">
      <div className="flex bg-gray-800/60 rounded-lg p-0.5 border border-white/[0.06]">
        {MODES.map(({ value, label, Icon }) => {
          const isActive = mode === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              onMouseEnter={() => {
                tipTimer.current = setTimeout(() => setHoveredMode(value), 300);
              }}
              onMouseLeave={() => {
                if (tipTimer.current) clearTimeout(tipTimer.current);
                setHoveredMode(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? `${activeModeClasses[value]} shadow-sm`
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredMode && (
        <div className="absolute z-[100] top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 text-[11px] leading-relaxed text-gray-200 bg-gray-900 border border-white/[0.1] rounded-lg shadow-xl max-w-xs whitespace-normal pointer-events-none">
          <span className={`font-medium ${tooltipTextClasses[hoveredMode]}`}>
            {MODE_META[hoveredMode].tip}
          </span>
        </div>
      )}
    </div>
  );
}
