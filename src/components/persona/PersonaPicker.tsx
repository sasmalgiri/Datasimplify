'use client';

import { useState } from 'react';
import {
  TrendingUp,
  CandlestickChart,
  Layers,
  FlaskConical,
  Briefcase,
  Building2,
  Video,
  Check,
} from 'lucide-react';
import { PERSONA_LIST } from '@/lib/persona/definitions';
import type { PersonaId } from '@/lib/persona/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  CandlestickChart,
  Layers,
  FlaskConical,
  Briefcase,
  Video,
  Building2,
};

// Short bullet points per persona for the picker
const PERSONA_BULLETS: Record<PersonaId, string[]> = {
  'casual-investor': [
    'Portfolio tracking & P&L',
    'Price alerts & watchlist',
    'Daily market summaries',
  ],
  'active-trader': [
    'Technical screener & charts',
    'Derivatives & funding rates',
    'Volume & momentum signals',
  ],
  'defi-explorer': [
    'DeFi TVL & yield explorer',
    'DEX analytics & pools',
    'Protocol-level deep dives',
  ],
  'analyst-researcher': [
    'Correlation & risk matrices',
    'Data exports & report packs',
    'Sector analysis & intelligence',
  ],
  'freelancer-consultant': [
    'Client-ready report kits',
    'Consistent formatting & audit trail',
    'Workspace snapshots & versioned exports',
  ],
  'content-creator': [
    'Weekly market pack in one click',
    'Trending coins & sentiment data',
    'Chart exports for videos & posts',
  ],
  'fund-manager': [
    'Multi-portfolio risk metrics',
    'Tax & compliance exports',
    'Institutional-grade analytics',
  ],
};

interface PersonaPickerProps {
  selected?: PersonaId | null;
  onSelect: (persona: PersonaId) => void;
  onSkip?: () => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function PersonaPicker({
  selected,
  onSelect,
  onSkip,
  title = 'How do you use crypto?',
  subtitle = 'We\'ll personalize your experience based on your answer',
  compact = false,
}: PersonaPickerProps) {
  const [hoveredId, setHoveredId] = useState<PersonaId | null>(null);

  return (
    <div className={compact ? '' : 'max-w-3xl mx-auto'}>
      {!compact && (
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PERSONA_LIST.map((persona) => {
          const Icon = ICON_MAP[persona.icon];
          const isSelected = selected === persona.id;
          const isHovered = hoveredId === persona.id;

          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => onSelect(persona.id)}
              onMouseEnter={() => setHoveredId(persona.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                relative text-left p-4 rounded-xl border-2 transition-all duration-200
                ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : isHovered
                      ? 'border-gray-300 bg-gray-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Icon + Name */}
              <div className="flex items-center gap-2.5 mb-2">
                {Icon && (
                  <Icon
                    className={`w-5 h-5 ${
                      isSelected ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                  />
                )}
                <h3
                  className={`font-semibold text-sm ${
                    isSelected ? 'text-emerald-700' : 'text-gray-900'
                  }`}
                >
                  {persona.name}
                </h3>
              </div>

              {/* Tagline */}
              <p className="text-xs text-gray-500 mb-2.5">{persona.tagline}</p>

              {/* Bullets */}
              <ul className="space-y-1">
                {PERSONA_BULLETS[persona.id].map((bullet, i) => (
                  <li
                    key={i}
                    className={`text-xs flex items-start gap-1.5 ${
                      isSelected ? 'text-emerald-700' : 'text-gray-600'
                    }`}
                  >
                    <span className="mt-0.5 text-emerald-400">&#8226;</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {onSkip && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
