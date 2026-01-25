'use client';

import { ExternalLink } from 'lucide-react';

interface CoinGeckoAttributionProps {
  variant?: 'default' | 'compact' | 'footer';
  className?: string;
  showIcon?: boolean;
}

/**
 * CoinGeckoAttribution - Required attribution for CoinGecko API usage
 *
 * Must be visible on ALL pages showing CoinGecko data, including:
 * - Loading states
 * - Error states
 * - Empty states
 * - Normal data display
 *
 * Compliance requirement from CoinGecko API terms of service.
 */
export function CoinGeckoAttribution({
  variant = 'default',
  className = '',
  showIcon = false
}: CoinGeckoAttributionProps) {
  if (variant === 'footer') {
    return (
      <div className={`flex items-center justify-center gap-2 text-xs text-gray-500 ${className}`}>
        <span>Powered by</span>
        <a
          href="https://www.coingecko.com/en/api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1"
        >
          CoinGecko API
          {showIcon && <ExternalLink className="w-3 h-3" />}
        </a>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-gray-400 ${className}`}>
        <span className="text-gray-500">Data:</span>
        <a
          href="https://www.coingecko.com/en/api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 underline"
        >
          CoinGecko API
        </a>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50 ${className}`}>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="text-gray-500">Powered by</span>
        <a
          href="https://www.coingecko.com/en/api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1"
        >
          CoinGecko API
          {showIcon && <ExternalLink className="w-3 h-3" />}
        </a>
      </div>
    </div>
  );
}

/**
 * LoadingWithAttribution - Loading state that includes required CoinGecko attribution
 * Use this instead of plain "Loading..." text
 */
export function LoadingWithAttribution({
  message = 'Loading data',
  className = ''
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
        <span className="text-gray-400">{message}...</span>
      </div>
      <CoinGeckoAttribution variant="compact" />
    </div>
  );
}

/**
 * ErrorWithAttribution - Error state that includes required CoinGecko attribution
 */
export function ErrorWithAttribution({
  message = 'Failed to load data',
  className = ''
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}>
      <div className="text-center">
        <span className="text-red-400">⚠ {message}</span>
      </div>
      <CoinGeckoAttribution variant="compact" />
    </div>
  );
}

/**
 * EmptyWithAttribution - Empty state that includes required CoinGecko attribution
 */
export function EmptyWithAttribution({
  message = 'No data available',
  className = ''
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}>
      <div className="text-center">
        <span className="text-gray-400">{message}</span>
      </div>
      <CoinGeckoAttribution variant="compact" />
    </div>
  );
}
