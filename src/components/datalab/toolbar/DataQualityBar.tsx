'use client';

import { AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { isFeatureAvailable } from '@/lib/datalab/modeConfig';
import { useState } from 'react';

const SEVERITY_ICON = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const SEVERITY_COLORS = {
  error: { bg: 'bg-red-500/[0.06]', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-400' },
  warning: { bg: 'bg-amber-500/[0.06]', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-400' },
  info: { bg: 'bg-blue-500/[0.06]', border: 'border-blue-500/20', text: 'text-blue-400', icon: 'text-blue-400' },
} as const;

export function DataQualityBar() {
  const dataLabMode = useDataLabStore((s) => s.dataLabMode);
  const warnings = useDataLabStore((s) => s.dataQualityWarnings);
  const [dismissed, setDismissed] = useState(false);

  if (!isFeatureAvailable(dataLabMode, 'dataQualityWarnings')) return null;
  if (dismissed || warnings.length === 0) return null;

  // Show most severe warning prominently, count others
  const primary = warnings[0];
  const remaining = warnings.length - 1;
  const style = SEVERITY_COLORS[primary.severity];
  const Icon = SEVERITY_ICON[primary.severity];

  return (
    <div className={`px-4 py-1.5 flex items-center gap-2 border-t ${style.border} ${style.bg} max-w-[1800px] mx-auto`}>
      <Icon className={`w-3.5 h-3.5 ${style.icon} flex-shrink-0`} />
      <span className={`text-[11px] ${style.text} flex-1`}>
        {primary.message}
        {remaining > 0 && (
          <span className="text-gray-500 ml-2">+{remaining} more warning{remaining > 1 ? 's' : ''}</span>
        )}
      </span>
      <button
        type="button"
        title="Dismiss warnings"
        onClick={() => setDismissed(true)}
        className="text-gray-600 hover:text-gray-400 transition flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
