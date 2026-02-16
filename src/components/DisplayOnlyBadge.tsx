/**
 * Display Only Badge Component
 *
 * Shows "Display Only" indicator and "Recreate in Excel" link
 * for analytics pages that can be recreated with Excel templates.
 */

'use client';

import Link from 'next/link';
import { PageId, PAGE_TEMPLATE_MAP } from '@/lib/templates/pageMapping';
import { TEMPLATES, TemplateType } from '@/lib/templates/templateConfig';

interface DisplayOnlyBadgeProps {
  pageId: PageId;
  showRecreate?: boolean;
  className?: string;
  variant?: 'inline' | 'card';
}

export function DisplayOnlyBadge({
  pageId,
  showRecreate = true,
  className = '',
  variant = 'inline',
}: DisplayOnlyBadgeProps) {
  const templates = PAGE_TEMPLATE_MAP[pageId] || [];
  const primaryTemplate = templates[0];
  const templateConfig = primaryTemplate ? TEMPLATES[primaryTemplate] : null;

  if (variant === 'card') {
    return (
      <div
        className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Display Only
            </span>
            <span className="text-gray-400 text-sm">
              Educational visualization • Not investment advice
            </span>
          </div>

          {showRecreate && templateConfig && (
            <Link
              href={`/download?template=${primaryTemplate}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30"
            >
              <span>📊</span>
              <span>Recreate in Excel</span>
              <span className="text-xs opacity-70">({templateConfig.name})</span>
            </Link>
          )}
        </div>

        {templates.length > 1 && showRecreate && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <span className="text-xs text-gray-500">Related templates: </span>
            {templates.slice(1, 4).map((t) => {
              const config = TEMPLATES[t];
              return (
                <Link
                  key={t}
                  href={`/download?template=${t}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 text-xs text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded transition-colors"
                >
                  {config?.icon} {config?.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Inline variant (compact)
  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
        Display Only
      </span>

      {showRecreate && templateConfig && (
        <Link
          href={`/download?template=${primaryTemplate}`}
          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>📊</span>
          <span>Recreate in Excel →</span>
        </Link>
      )}
    </div>
  );
}

/**
 * Data Source Badge - Shows which API provides the data
 */
interface DataSourceBadgeProps {
  sources: ('coingecko' | 'defillama' | 'alternative')[];
  className?: string;
}

export function DataSourceBadge({ sources, className = '' }: DataSourceBadgeProps) {
  const sourceInfo: Record<string, { label: string; color: string }> = {
    coingecko: { label: 'CoinGecko', color: 'text-green-400 bg-green-500/20' },
    defillama: { label: 'DeFiLlama', color: 'text-purple-400 bg-purple-500/20' },
    alternative: { label: 'Alternative.me', color: 'text-orange-400 bg-orange-500/20' },
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-gray-500">Data:</span>
      {sources.map((source) => {
        const info = sourceInfo[source];
        return (
          <span
            key={source}
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${info.color}`}
          >
            {info.label}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Full Page Header with Display Only info
 */
interface PageHeaderWithBadgeProps {
  title: string;
  description?: string;
  pageId: PageId;
  sources?: ('coingecko' | 'defillama' | 'alternative')[];
  children?: React.ReactNode;
}

export function PageHeaderWithBadge({
  title,
  description,
  pageId,
  sources = ['coingecko'],
  children,
}: PageHeaderWithBadgeProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && (
            <p className="text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {children}
      </div>

      <DisplayOnlyBadge pageId={pageId} variant="card" />

      <div className="mt-2">
        <DataSourceBadge sources={sources} />
      </div>
    </div>
  );
}

export default DisplayOnlyBadge;
