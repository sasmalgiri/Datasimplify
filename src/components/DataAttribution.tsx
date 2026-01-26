'use client';

// ============================================
// DATA ATTRIBUTION COMPONENT
// Required for commercial use of free APIs
// ============================================

import { useState } from 'react';

interface DataSource {
  name: string;
  url: string;
  license: string;
  note: string;
}

const DATA_SOURCES: DataSource[] = [
  {
    name: 'CoinLore',
    url: 'https://www.coinlore.com',
    license: 'Public API (terms apply)',
    note: 'Market prices and rankings',
  },
  {
    name: 'DefiLlama',
    url: 'https://defillama.com',
    license: 'Public data (terms apply)',
    note: 'DeFi TVL and protocol data',
  },
  {
    name: 'Finnhub',
    url: 'https://finnhub.io',
    license: 'Provider API (terms apply)',
    note: 'News and sentiment data',
  },
  {
    name: 'Etherscan',
    url: 'https://etherscan.io',
    license: 'Provider API (terms apply)',
    note: 'Ethereum blockchain data',
  },
  {
    name: 'Alternative.me',
    url: 'https://alternative.me',
    license: 'Public API (terms apply)',
    note: 'Fear & Greed Index',
  },
];

// Compact inline attribution for footer
export function DataAttributionInline() {
  return (
    <div className="text-xs text-gray-500 dark:text-gray-400">
      Data from{' '}
      {DATA_SOURCES.slice(0, 4).map((source, i) => (
        <span key={source.name}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            {source.name}
          </a>
          {i < 3 ? ', ' : ''}
        </span>
      ))}
      {' & others'}
    </div>
  );
}

// Full attribution with expandable details
export function DataAttribution() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-gray-700/50 pt-4 mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1 transition-colors"
      >
        <span>Data Sources</span>
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
          {DATA_SOURCES.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 rounded bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-200">{source.name}</div>
              <div className="text-xs text-gray-500">{source.note}</div>
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Data sources are used under their respective terms. Review each provider's current API terms for commercial use, caching, and redistribution.
      </p>
    </div>
  );
}

// Badge for individual data cards
export function DataSourceBadge({ source }: { source: string }) {
  const sourceInfo = DATA_SOURCES.find(
    (s) => s.name.toLowerCase() === source.toLowerCase()
  );

  if (!sourceInfo) return null;

  return (
    <a
      href={sourceInfo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors"
      title={sourceInfo.license}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {sourceInfo.name}
    </a>
  );
}

export default DataAttribution;
