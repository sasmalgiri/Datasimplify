'use client';

import { getDataSource, getAttribution, getAttributionUrl, isDisplayOnly } from '@/lib/dataSources';

interface SourceAttributionProps {
  sourceId: string;
  variant?: 'inline' | 'footer' | 'badge';
  showLogo?: boolean;
  className?: string;
}

/**
 * SourceAttribution - Required attribution for data sources
 *
 * IMPORTANT: Display-only sources like CoinGecko REQUIRE visible attribution.
 * This component ensures compliance with data provider terms.
 */
export function SourceAttribution({
  sourceId,
  variant = 'inline',
  showLogo = false,
  className = '',
}: SourceAttributionProps) {
  const source = getDataSource(sourceId);
  const attribution = getAttribution(sourceId);
  const attributionUrl = getAttributionUrl(sourceId);

  if (!source || !attribution) return null;

  // Inline variant - simple text link
  if (variant === 'inline') {
    return (
      <span className={`text-xs text-gray-500 ${className}`}>
        {attributionUrl ? (
          <a
            href={attributionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 hover:underline"
          >
            {attribution}
          </a>
        ) : (
          attribution
        )}
      </span>
    );
  }

  // Badge variant - highlighted attribution
  if (variant === 'badge') {
    return (
      <span
        className={`
          inline-flex items-center gap-1.5 px-2 py-1
          bg-gray-100 dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          rounded-full text-xs text-gray-600 dark:text-gray-400
          ${className}
        `}
      >
        {showLogo && sourceId === 'coingecko' && (
          <CoinGeckoLogo className="w-3 h-3" />
        )}
        {attributionUrl ? (
          <a
            href={attributionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
          >
            {attribution}
          </a>
        ) : (
          attribution
        )}
      </span>
    );
  }

  // Footer variant - more prominent, includes display-only warning
  if (variant === 'footer') {
    const isDisplayOnlySource = isDisplayOnly(sourceId);

    return (
      <div
        className={`
          flex items-center justify-between p-3
          bg-gray-50 dark:bg-gray-800/50
          border-t border-gray-200 dark:border-gray-700
          text-xs text-gray-500 dark:text-gray-400
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          {showLogo && sourceId === 'coingecko' && (
            <CoinGeckoLogo className="w-4 h-4" />
          )}
          <span>
            Source:{' '}
            {attributionUrl ? (
              <a
                href={attributionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {source.name}
              </a>
            ) : (
              source.name
            )}
          </span>
        </div>

        {isDisplayOnlySource && (
          <span className="text-yellow-600 dark:text-yellow-500">
            Display only • Not available for download
          </span>
        )}
      </div>
    );
  }

  return null;
}

/**
 * CoinGecko logo component (simple SVG)
 */
function CoinGeckoLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * Multi-source attribution component
 */
interface MultiSourceAttributionProps {
  sourceIds: string[];
  variant?: 'inline' | 'footer';
  className?: string;
}

export function MultiSourceAttribution({
  sourceIds,
  variant = 'inline',
  className = '',
}: MultiSourceAttributionProps) {
  // Filter to sources that need attribution
  const sourcesWithAttribution = sourceIds
    .map((id) => ({
      id,
      source: getDataSource(id),
      attribution: getAttribution(id),
      url: getAttributionUrl(id),
    }))
    .filter((s) => s.attribution);

  if (sourcesWithAttribution.length === 0) return null;

  if (variant === 'inline') {
    return (
      <span className={`text-xs text-gray-500 ${className}`}>
        Data:{' '}
        {sourcesWithAttribution.map((s, i) => (
          <span key={s.id}>
            {i > 0 && ', '}
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 hover:underline"
              >
                {s.source?.name}
              </a>
            ) : (
              s.source?.name
            )}
          </span>
        ))}
      </span>
    );
  }

  if (variant === 'footer') {
    const hasDisplayOnly = sourceIds.some(isDisplayOnly);

    return (
      <div
        className={`
          p-3 bg-gray-50 dark:bg-gray-800/50
          border-t border-gray-200 dark:border-gray-700
          text-xs text-gray-500 dark:text-gray-400
          ${className}
        `}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Data sources: </span>
            {sourcesWithAttribution.map((s, i) => (
              <span key={s.id}>
                {i > 0 && ', '}
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {s.source?.name}
                  </a>
                ) : (
                  s.source?.name
                )}
              </span>
            ))}
          </div>

          {hasDisplayOnly && (
            <span className="text-yellow-600 dark:text-yellow-500">
              Some data is display-only
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
}

/**
 * "No Download" warning for display-only sources
 */
interface NoDownloadWarningProps {
  sourceId: string;
  className?: string;
}

export function NoDownloadWarning({ sourceId, className = '' }: NoDownloadWarningProps) {
  if (!isDisplayOnly(sourceId)) return null;

  const source = getDataSource(sourceId);

  return (
    <div
      className={`
        flex items-center gap-2 p-2
        bg-yellow-50 dark:bg-yellow-900/20
        border border-yellow-200 dark:border-yellow-800
        rounded-lg text-xs text-yellow-700 dark:text-yellow-400
        ${className}
      `}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>
        {source?.name} data is for display only and cannot be downloaded.
        Use alternative data sources for exports.
      </span>
    </div>
  );
}
