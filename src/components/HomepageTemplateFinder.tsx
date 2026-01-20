'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  parseUserIntent,
  routeToTemplate,
  type ParsedIntent,
  type RoutedTemplate,
} from '@/lib/templates/reportAssistant';

interface HomepageTemplateFinderProps {
  className?: string;
}

// All 11 Templates from the catalog
const ALL_TEMPLATES = [
  // Market Templates
  {
    id: 'market-overview',
    label: 'Market Overview',
    description: 'Top coins, daily data',
    icon: '📊',
    category: 'market',
    freeSafe: true,
    config: { reportType: 'market' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC'], timeframe: '1d' },
  },
  {
    id: 'market-advanced',
    label: 'Advanced Market',
    description: 'Volume analysis & trends',
    icon: '📈',
    category: 'market',
    freeSafe: false,
    config: { reportType: 'market' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1d' },
  },
  // Watchlist Templates
  {
    id: 'watchlist-simple',
    label: 'Simple Watchlist',
    description: 'Track 5-10 coins',
    icon: '👁️',
    category: 'watchlist',
    freeSafe: true,
    config: { reportType: 'watchlist' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1d' },
  },
  {
    id: 'watchlist-pro',
    label: 'Pro Watchlist',
    description: 'Up to 50 coins + charts',
    icon: '👀',
    category: 'watchlist',
    freeSafe: false,
    config: { reportType: 'watchlist' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1d' },
  },
  // Screener Templates
  {
    id: 'screener-basic',
    label: 'Basic Screener',
    description: 'Filter by metrics',
    icon: '🔍',
    category: 'screener',
    freeSafe: false,
    config: { reportType: 'screener' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1d' },
  },
  {
    id: 'screener-advanced',
    label: 'Advanced Screener',
    description: 'Technical indicators',
    icon: '🔎',
    category: 'screener',
    freeSafe: false,
    config: { reportType: 'screener' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1d' },
  },
  // Portfolio Templates
  {
    id: 'portfolio-tracker',
    label: 'Portfolio Tracker',
    description: 'Track holdings & P&L',
    icon: '💼',
    category: 'portfolio',
    freeSafe: true,
    config: { reportType: 'portfolio' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1d' },
  },
  {
    id: 'portfolio-advanced',
    label: 'Advanced Portfolio',
    description: 'Risk & rebalancing',
    icon: '💰',
    category: 'portfolio',
    freeSafe: false,
    config: { reportType: 'portfolio' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1d' },
  },
  // Correlation Template
  {
    id: 'correlation-matrix',
    label: 'Correlation Matrix',
    description: 'How coins move together',
    icon: '🔗',
    category: 'correlation',
    freeSafe: false,
    config: { reportType: 'correlation' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1d' },
  },
  // Risk Template
  {
    id: 'risk-dashboard',
    label: 'Risk Dashboard',
    description: 'Volatility & drawdown',
    icon: '⚠️',
    category: 'risk',
    freeSafe: false,
    config: { reportType: 'risk' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1d' },
  },
];

type ViewMode = 'presets' | 'search' | 'result';

/**
 * HomepageTemplateFinder - All 11 Templates with Show More
 */
export default function HomepageTemplateFinder({ className = '' }: HomepageTemplateFinderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('presets');
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<RoutedTemplate | null>(null);
  const [searchMessage, setSearchMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle quick preset click - instant result
  const handlePresetClick = useCallback((preset: typeof ALL_TEMPLATES[0]) => {
    const intent: ParsedIntent = {
      reportType: preset.config.reportType,
      coins: preset.config.coins,
      timeframe: preset.config.timeframe,
      confidence: 'high',
      needsClarification: false,
      clarificationQuestions: [],
      isRefused: false,
      refusalReason: null,
      originalText: preset.label,
      understood: `${preset.label} template`,
    };

    const recommendation = routeToTemplate(intent, true);
    if (recommendation) {
      setResult(recommendation);
      setSearchMessage(`${preset.icon} ${preset.label}`);
      setViewMode('result');
    }
  }, []);

  // Handle search submit - smart parsing with auto-defaults
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const query = inputValue.trim();
    setInputValue('');

    // Parse the input
    const intent = parseUserIntent(query);

    // If refused (trading advice), show message and stay in search
    if (intent.isRefused) {
      setSearchMessage("I find templates only. Try 'market overview' or 'track BTC'.");
      return;
    }

    // If no report type detected, show helpful message
    if (!intent.reportType) {
      setSearchMessage("Try: 'market overview', 'portfolio', 'watchlist', or 'compare coins'");
      return;
    }

    // Auto-fill missing data with smart defaults
    const filledIntent: ParsedIntent = {
      ...intent,
      coins: intent.coins.length > 0 ? intent.coins : ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'],
      timeframe: intent.timeframe || '1d',
    };

    const recommendation = routeToTemplate(filledIntent, true);
    if (recommendation) {
      setResult(recommendation);
      setSearchMessage(intent.understood || `Found: ${recommendation.primary.name}`);
      setViewMode('result');
    } else {
      setSearchMessage("No match found. Try a different search.");
    }
  }, [inputValue]);

  // Reset to presets view
  const handleReset = useCallback(() => {
    setViewMode('presets');
    setResult(null);
    setSearchMessage('');
    setInputValue('');
    setShowAllPresets(false);
  }, []);

  // Switch to search mode
  const handleSwitchToSearch = useCallback(() => {
    setViewMode('search');
    setSearchMessage('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Show only first 4 presets unless expanded
  const visiblePresets = showAllPresets ? ALL_TEMPLATES : ALL_TEMPLATES.slice(0, 4);
  const hiddenCount = ALL_TEMPLATES.length - 4;

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-gray-800/50 border-b border-gray-700/50 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Template Finder</h3>
              <p className="text-[10px] text-gray-400">{ALL_TEMPLATES.length} Excel templates</p>
            </div>
          </div>
          {viewMode !== 'presets' && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className={`p-3 overflow-y-auto dropdown-scroll ${showAllPresets ? 'template-content-expanded' : ''}`}>
        {/* Presets View */}
        {viewMode === 'presets' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {visiblePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="flex items-center gap-2 p-2.5 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-emerald-500/30 rounded-lg transition-all text-left group"
                >
                  <span className="text-base flex-shrink-0">{preset.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors truncate">
                        {preset.label}
                      </span>
                      {preset.freeSafe && (
                        <span className="text-[8px] px-1 py-0.5 bg-green-500/20 text-green-400 rounded flex-shrink-0">FREE</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 block truncate">{preset.description}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Show More / Less button */}
            {!showAllPresets && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllPresets(true)}
                className="w-full py-1.5 text-xs text-gray-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1"
              >
                <span>+{hiddenCount} more templates</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {showAllPresets && (
              <button
                type="button"
                onClick={() => setShowAllPresets(false)}
                className="w-full py-1.5 text-xs text-gray-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1"
              >
                <span>Show less</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}

            {/* Search button */}
            <button
              type="button"
              onClick={handleSwitchToSearch}
              className="w-full py-2 px-3 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-gray-500/50 rounded-lg transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-white text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search by description...</span>
            </button>
          </div>
        )}

        {/* Search View */}
        {viewMode === 'search' && (
          <div className="space-y-3">
            <div className="text-center py-2">
              <p className="text-gray-300 text-xs mb-1">Describe what you need</p>
              <p className="text-gray-500 text-[10px]">
                e.g. "track my bitcoin weekly" or "compare top coins"
              </p>
            </div>

            {searchMessage && (
              <div className="p-2 bg-gray-700/30 rounded-lg text-center">
                <p className="text-xs text-gray-300">{searchMessage}</p>
              </div>
            )}

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g. 'weekly bitcoin report'"
                className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                title="Search templates"
                aria-label="Search templates"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5">
              {['market overview', 'portfolio', 'correlation', 'risk'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setInputValue(suggestion);
                    setTimeout(() => inputRef.current?.form?.requestSubmit(), 50);
                  }}
                  className="px-2 py-1 bg-gray-700/30 hover:bg-gray-600/50 text-gray-400 hover:text-white text-[10px] rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result View */}
        {viewMode === 'result' && result && (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-emerald-400 text-sm font-medium">{searchMessage}</p>
            </div>

            <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-3">
              <h4 className="font-medium text-white text-sm mb-1">{result.primary.name}</h4>
              <p className="text-xs text-gray-400 mb-2">{result.primary.best_for}</p>

              <div className="flex gap-4 text-[10px] text-gray-500">
                <span>Coins: <span className="text-gray-300">{result.config.coins.slice(0, 3).join(', ')}{result.config.coins.length > 3 ? '...' : ''}</span></span>
                <span>Time: <span className="text-gray-300">
                  {result.config.timeframe === '1d' ? 'Daily' : result.config.timeframe === '1h' ? 'Hourly' : 'Weekly'}
                </span></span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/templates"
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors text-center"
              >
                Get Template
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-3 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition-colors"
              >
                New
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {viewMode === 'presets' && (
        <div className="border-t border-gray-700/50 px-3 py-1.5 flex-shrink-0">
          <p className="text-[9px] text-gray-500 text-center">
            BYOK: Bring Your Own Key. <span className="text-green-400">FREE</span> = works with free CoinGecko API.
          </p>
        </div>
      )}
    </div>
  );
}
