'use client';

import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface SampleDataBadgeProps {
  /**
   * Type of data being displayed
   * - 'sample': Illustrative/sample data for demonstration
   * - 'fallback': Real data source unavailable, using fallback
   * - 'live': Real-time data from live source
   * - 'cached': Cached real data (may be slightly stale)
   */
  type: 'sample' | 'fallback' | 'live' | 'cached';

  /**
   * Additional message to display
   */
  message?: string;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Show as inline badge or block banner
   */
  variant?: 'badge' | 'banner';

  /**
   * Optional class name
   */
  className?: string;
}

/**
 * SampleDataBadge - Reusable component for labeling data source type
 *
 * Use this component whenever displaying data to users to clearly indicate
 * whether the data is:
 * - Sample/illustrative data (for layout preview, demonstration)
 * - Fallback data (when live source is unavailable)
 * - Live/real-time data
 * - Cached data
 *
 * This follows our "no-fake-data" policy by always being transparent
 * about the source and nature of displayed data.
 */
export function SampleDataBadge({
  type,
  message,
  size = 'sm',
  variant = 'badge',
  className = '',
}: SampleDataBadgeProps) {
  const config = {
    sample: {
      icon: Info,
      label: 'Sample Data',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      defaultMessage: 'This is illustrative sample data for demonstration purposes.',
    },
    fallback: {
      icon: AlertTriangle,
      label: 'Fallback Data',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-400',
      defaultMessage: 'Live data source unavailable. Showing cached fallback data.',
    },
    live: {
      icon: CheckCircle,
      label: 'Live Data',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      defaultMessage: 'Real-time data from live source.',
    },
    cached: {
      icon: CheckCircle,
      label: 'Cached',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      defaultMessage: 'Cached data. May be slightly delayed.',
    },
  };

  const { icon: Icon, label, bgColor, borderColor, textColor, defaultMessage } = config[type];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded ${bgColor} ${textColor} ${sizeClasses[size]} ${className}`}
      >
        <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
        <span>{label}</span>
      </span>
    );
  }

  // Banner variant
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <Icon className={`${textColor} w-4 h-4 mt-0.5 flex-shrink-0`} />
        <div>
          <p className={`${textColor} text-sm font-medium`}>{label}</p>
          <p className={`${textColor} text-xs opacity-80 mt-0.5`}>
            {message || defaultMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * SampleDataNotice - A more prominent notice for sample data
 *
 * Use this when displaying significant sample data that users need to be aware of.
 */
export function SampleDataNotice({
  title = 'Sample Data',
  message = 'The data shown below is for demonstration purposes only and does not represent real values.',
  className = '',
}: {
  title?: string;
  message?: string;
  className?: string;
}) {
  return (
    <div className={`bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-amber-300 text-sm font-medium">{title}</p>
          <p className="text-amber-400 text-xs mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * LiveDataBadge - Quick badge for indicating live data
 */
export function LiveDataBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded ${className}`}>
      <CheckCircle className="w-3 h-3" />
      <span>Live Data</span>
    </span>
  );
}

export default SampleDataBadge;
