'use client';

import { useViewMode } from '@/lib/viewMode';
import { Sparkles, Zap } from 'lucide-react';

interface ViewModeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ViewModeToggle({ className = '', compact = false }: ViewModeToggleProps) {
  const { mode, setMode, isSimple, isPro } = useViewMode();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setMode(isSimple ? 'pro' : 'simple')}
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition ${
          isPro
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        } ${className}`}
        title={isPro ? 'Switch to Simple mode' : 'Switch to Pro mode'}
      >
        {isPro ? <Zap className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
        {isPro ? 'Pro' : 'Simple'}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-1 p-0.5 bg-gray-800/50 rounded-full border border-gray-700 ${className}`}>
      <button
        type="button"
        onClick={() => setMode('simple')}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
          isSimple
            ? 'bg-emerald-500 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Sparkles className="w-3 h-3" />
        Simple
      </button>
      <button
        type="button"
        onClick={() => setMode('pro')}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
          isPro
            ? 'bg-purple-500 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Zap className="w-3 h-3" />
        Pro
      </button>
    </div>
  );
}
