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

  return (
    <div className="relative inline-flex items-center">
      <div className="flex bg-gray-800/60 rounded-lg p-0.5 border border-white/[0.06]">
        {MODES.map(({ value, label, Icon }) => {
          const meta = MODE_META[value];
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
                  ? 'text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              style={isActive ? { backgroundColor: meta.color + '30', color: meta.color } : undefined}
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
          <span className="font-medium" style={{ color: MODE_META[hoveredMode].color }}>
            {MODE_META[hoveredMode].tip}
          </span>
        </div>
      )}
    </div>
  );
}
