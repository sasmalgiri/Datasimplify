'use client';

import { useState } from 'react';
import {
  LOW_QUOTA_MODE,
  PRO_MODE,
  REFRESH_FREQUENCY_OPTIONS,
  ASSET_COUNT_PRESETS,
  TIMEFRAME_OPTIONS,
  getRecommendedMode,
  validateConfigForMode,
  type RefreshFrequency,
} from '@/lib/templates/templateModes';
import { SUPPORTED_COINS } from '@/lib/dataTypes';

interface TemplateControlsProps {
  selectedCoins: string[];
  onCoinsChange: (coins: string[]) => void;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  refreshFrequency: RefreshFrequency;
  onRefreshFrequencyChange: (rf: RefreshFrequency) => void;
  includeCharts: boolean;
  onIncludeChartsChange: (include: boolean) => void;
  className?: string;
}

/**
 * TemplateControls Component
 *
 * Provides prominent control knobs that users can't miss:
 * - Assets count selector
 * - Timeframe selector
 * - Refresh frequency selector
 *
 * Shows warnings when configuration exceeds recommended limits.
 */
export function TemplateControls({
  selectedCoins,
  onCoinsChange,
  timeframe,
  onTimeframeChange,
  refreshFrequency,
  onRefreshFrequencyChange,
  includeCharts,
  onIncludeChartsChange,
  className = '',
}: TemplateControlsProps) {
  const [showAllCoins, setShowAllCoins] = useState(false);
  const [customAssetCount, setCustomAssetCount] = useState<number | null>(null);

  const currentMode = getRecommendedMode(selectedCoins.length);
  const validation = validateConfigForMode(
    { assetCount: selectedCoins.length, timeframe, refreshFrequency },
    currentMode
  );

  // Toggle coin selection
  const toggleCoin = (symbol: string) => {
    onCoinsChange(
      selectedCoins.includes(symbol)
        ? selectedCoins.filter((s) => s !== symbol)
        : [...selectedCoins, symbol]
    );
  };

  // Apply preset asset count
  const applyAssetPreset = (count: number) => {
    setCustomAssetCount(count);
    // Select top N coins
    const topCoins = SUPPORTED_COINS.slice(0, count).map((c) => c.symbol);
    onCoinsChange(topCoins);
  };

  // Get available timeframes based on current mode
  const availableTimeframes = TIMEFRAME_OPTIONS.filter((tf) =>
    tf.availableIn.includes(currentMode.id)
  );

  const coinsToShow = showAllCoins ? SUPPORTED_COINS.slice(0, 50) : SUPPORTED_COINS.slice(0, 20);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mode Indicator */}
      <div className={`p-4 rounded-xl border ${
        currentMode.id === 'low_quota'
          ? 'bg-emerald-900/10 border-emerald-500/30'
          : 'bg-purple-900/10 border-purple-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentMode.id === 'low_quota'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-purple-500/20 text-purple-400'
            }`}>
              {currentMode.id === 'low_quota' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className={`font-semibold ${
                currentMode.id === 'low_quota' ? 'text-emerald-400' : 'text-purple-400'
              }`}>
                {currentMode.name}
              </h3>
              <p className="text-xs text-gray-400">{currentMode.apiRequirement}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentMode.id === 'low_quota'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-purple-500/20 text-purple-400'
          }`}>
            {selectedCoins.length} / {currentMode.maxAssets} assets
          </span>
        </div>

        {/* Validation Warnings */}
        {validation.warnings.length > 0 && (
          <div className="mt-3 space-y-1">
            {validation.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-yellow-400">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asset Count Selector */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Assets Count
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Select how many coins to include. More coins = more API calls.
        </p>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ASSET_COUNT_PRESETS.map((preset) => (
            <button
              key={preset.count}
              type="button"
              onClick={() => applyAssetPreset(preset.count)}
              className={`px-3 py-2 rounded-lg border text-sm transition ${
                selectedCoins.length === preset.count
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                  : preset.mode === 'low_quota'
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-emerald-500/50'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
              }`}
            >
              <span className="font-medium">{preset.label}</span>
              {preset.mode === 'pro' && (
                <span className="ml-1 text-xs text-purple-400">(Pro)</span>
              )}
            </button>
          ))}
        </div>

        {/* Coin Selection Grid */}
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-800/50 rounded-lg">
          {coinsToShow.map((coin) => (
            <button
              key={coin.symbol}
              type="button"
              onClick={() => toggleCoin(coin.symbol)}
              className={`px-2.5 py-1 text-xs rounded border transition ${
                selectedCoins.includes(coin.symbol)
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {selectedCoins.includes(coin.symbol) && <span className="mr-1">✓</span>}
              {coin.symbol}
            </button>
          ))}
        </div>

        {/* Show more toggle */}
        {!showAllCoins && SUPPORTED_COINS.length > 20 && (
          <button
            type="button"
            onClick={() => setShowAllCoins(true)}
            className="mt-2 text-xs text-emerald-400 hover:underline"
          >
            Show more coins...
          </button>
        )}

        <p className="text-xs text-gray-500 mt-2">
          {selectedCoins.length} selected • {selectedCoins.length <= 10 ? 'Free tier compatible' : 'May require CoinGecko Pro API (BYOK)'}
        </p>
      </div>

      {/* Timeframe Selector */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Timeframe
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Data interval for historical charts. Shorter = more API calls.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TIMEFRAME_OPTIONS.map((tf) => {
            const isAvailable = tf.availableIn.includes(currentMode.id);
            return (
              <button
                key={tf.id}
                type="button"
                onClick={() => isAvailable && onTimeframeChange(tf.id)}
                disabled={!isAvailable}
                className={`py-2 px-3 rounded-lg border text-sm transition ${
                  timeframe === tf.id
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : isAvailable
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-600 cursor-not-allowed'
                }`}
              >
                {tf.label}
                {!isAvailable && <span className="block text-xs text-purple-400">Pro</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Refresh Frequency Selector */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Frequency
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          How often data updates. Manual refresh recommended to conserve API quota.
        </p>

        <div className="space-y-2">
          {REFRESH_FREQUENCY_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                refreshFrequency === option.id
                  ? 'bg-emerald-600/10 border-emerald-500'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="refreshFrequency"
                value={option.id}
                checked={refreshFrequency === option.id}
                onChange={() => onRefreshFrequencyChange(option.id)}
                className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${
                    refreshFrequency === option.id ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {option.label}
                  </span>
                  {option.recommended && (
                    <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-400">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{option.description}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Manual Refresh Instructions */}
        {refreshFrequency === 'manual' && (
          <div className="mt-4 p-3 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
            <h4 className="font-medium text-emerald-400 text-sm mb-1 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              How to Refresh Manually
            </h4>
            <p className="text-xs text-gray-300">
              Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-emerald-400">Ctrl+Alt+F5</kbd> (Windows) or{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-emerald-400">Cmd+Alt+F5</kbd> (Mac) to refresh all data.
              Or click the "Refresh Now" button in the START_HERE sheet.
            </p>
          </div>
        )}
      </div>

      {/* Include Charts Toggle */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Include Chart Templates
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Pre-styled chart layouts. Adds ~2 API calls per asset.
            </p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => onIncludeChartsChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-emerald-600 peer-focus:ring-2 peer-focus:ring-emerald-500 transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
      </div>
    </div>
  );
}
