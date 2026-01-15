'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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

// Quick Start Presets - one click, no questions
const QUICK_PRESETS = [
  {
    id: 'market-daily',
    label: 'Market Overview',
    description: 'Top 10 coins, daily',
    icon: '📊',
    config: { reportType: 'market' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC'], timeframe: '1d' },
  },
  {
    id: 'portfolio-tracker',
    label: 'Portfolio Tracker',
    description: 'Track your holdings',
    icon: '💼',
    config: { reportType: 'portfolio' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1d' },
  },
  {
    id: 'watchlist-weekly',
    label: 'Watchlist',
    description: 'Weekly coin tracking',
    icon: '👁️',
    config: { reportType: 'watchlist' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1w' },
  },
  {
    id: 'correlation',
    label: 'Correlation Matrix',
    description: 'How coins move together',
    icon: '🔗',
    config: { reportType: 'correlation' as const, coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'], timeframe: '1d' },
  },
];

type ViewMode = 'presets' | 'search' | 'result';

/**
 * HomepageTemplateFinder - Improved with Quick Presets + Smart Search
 *
 * Two modes:
 * 1. Quick Presets - One-click templates, no questions
 * 2. Smart Search - Natural language with minimal follow-ups
 */
export default function HomepageTemplateFinder({ className = '' }: HomepageTemplateFinderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('presets');
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<RoutedTemplate | null>(null);
  const [searchMessage, setSearchMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle quick preset click - instant result
  const handlePresetClick = useCallback((preset: typeof QUICK_PRESETS[0]) => {
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
      // If no coins specified and type needs coins, use top 5
      coins: intent.coins.length > 0 ? intent.coins : ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'],
      // If no timeframe, default to daily
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
  }, []);

  // Switch to search mode
  const handleSwitchToSearch = useCallback(() => {
    setViewMode('search');
    setSearchMessage('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 flex flex-col h-[450px] ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-gray-800/50 border-b border-gray-700/50 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Template Finder</h3>
              <p className="text-xs text-gray-400">
                {viewMode === 'presets' ? 'Quick start or search' : viewMode === 'search' ? 'Describe what you need' : 'Found a match'}
              </p>
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
      <div className="flex-1 overflow-y-auto p-4 dropdown-scroll">
        {/* Presets View */}
        {viewMode === 'presets' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 text-center mb-2">One-click templates</p>

            <div className="grid grid-cols-2 gap-2">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="flex flex-col items-start p-3 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-emerald-500/30 rounded-lg transition-all text-left group"
                >
                  <span className="text-lg mb-1">{preset.icon}</span>
                  <span className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                    {preset.label}
                  </span>
                  <span className="text-xs text-gray-500">{preset.description}</span>
                </button>
              ))}
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-gray-800/50 text-gray-500">or search</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSwitchToSearch}
              className="w-full py-3 px-4 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-gray-500/50 rounded-lg transition-all flex items-center justify-center gap-2 text-gray-300 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm">Search by description...</span>
            </button>
          </div>
        )}

        {/* Search View */}
        {viewMode === 'search' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-gray-300 text-sm mb-2">Describe what you need</p>
              <p className="text-gray-500 text-xs">
                Example: "track my bitcoin weekly" or "compare top coins"
              </p>
            </div>

            {searchMessage && (
              <div className="p-3 bg-gray-700/30 rounded-lg text-center">
                <p className="text-sm text-gray-300">{searchMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs text-gray-500">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {['market overview', 'track bitcoin', 'portfolio tracker', 'compare coins', 'risk analysis'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setInputValue(suggestion);
                      setTimeout(() => inputRef.current?.form?.requestSubmit(), 50);
                    }}
                    className="px-2.5 py-1 bg-gray-700/30 hover:bg-gray-600/50 text-gray-400 hover:text-white text-xs rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Result View */}
        {viewMode === 'result' && result && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Found match</p>
              <p className="text-emerald-400 text-sm font-medium">{searchMessage}</p>
            </div>

            <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-1">{result.primary.name}</h4>
              <p className="text-sm text-gray-400 mb-3">{result.primary.best_for}</p>

              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Coins:</span>
                  <span className="text-gray-300">{result.config.coins.slice(0, 5).join(', ')}{result.config.coins.length > 5 ? '...' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time range:</span>
                  <span className="text-gray-300">
                    {result.config.timeframe === '1d' ? 'Daily' : result.config.timeframe === '1h' ? 'Hourly' : 'Weekly'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/download"
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors text-center"
              >
                Get Template
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-4 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
              >
                New
              </button>
            </div>

            <p className="text-[10px] text-gray-500 text-center">
              Opens download page with setup instructions
            </p>
          </div>
        )}
      </div>

      {/* Search Input - only shown in search mode */}
      {viewMode === 'search' && (
        <form onSubmit={handleSearch} className="border-t border-gray-700/50 p-3 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. 'weekly bitcoin report'"
              className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              title="Search templates"
              aria-label="Search templates"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      )}

      {/* Footer - only shown in presets mode */}
      {viewMode === 'presets' && (
        <div className="border-t border-gray-700/50 px-4 py-2 flex-shrink-0">
          <p className="text-[10px] text-gray-500 text-center">
            Keyword matching - not AI. Templates require CryptoSheets.
          </p>
        </div>
      )}
    </div>
  );
}
