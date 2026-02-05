'use client';

import { Info, Key, Zap, FileCode } from 'lucide-react';

/**
 * PowerQueryInfo - Information card about Power Query templates
 *
 * Displays features and requirements for Power Query templates.
 * No add-in required - uses Excel's built-in Power Query.
 */
export function PowerQueryInfo({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <span className="text-3xl">📊</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-white">Power Query Templates</h3>
              <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-medium border border-emerald-500/30">
                No Add-in Required
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Uses Excel&apos;s built-in Power Query with BYOK (Bring Your Own Keys) architecture.
              Your API key stays in Excel - never touches our servers.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
            <Key className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white mb-1">BYOK Architecture</h4>
              <p className="text-xs text-gray-400">Your API key stays in Excel - complete privacy</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
            <FileCode className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white mb-1">Built-in Power Query</h4>
              <p className="text-xs text-gray-400">No installation - uses Excel&apos;s native feature</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
            <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white mb-1">Auto-Refresh</h4>
              <p className="text-xs text-gray-400">Set refresh intervals for live data</p>
            </div>
          </div>
        </div>

        {/* Data Categories */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <h4 className="text-sm font-medium text-white mb-3">Available Data</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-emerald-400 font-medium mb-1">Price Data</div>
              <div className="text-gray-400">Current price, 24h change, market cap, volume</div>
            </div>
            <div>
              <div className="text-emerald-400 font-medium mb-1">Historical</div>
              <div className="text-gray-400">OHLCV data, price history, sparklines</div>
            </div>
            <div>
              <div className="text-emerald-400 font-medium mb-1">Market</div>
              <div className="text-gray-400">Top coins, trending, global stats</div>
            </div>
            <div>
              <div className="text-emerald-400 font-medium mb-1">Indicators</div>
              <div className="text-gray-400">Fear & Greed, dominance, volume analysis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Info */}
      <div className="flex items-start gap-2 p-4 bg-emerald-500/10 rounded-lg text-xs border border-emerald-500/30">
        <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="text-gray-300">
          <p className="mb-2">
            <strong className="text-white">How it works:</strong> Open the template in Excel, 
            paste your CoinGecko API key in the designated cell, and refresh. That&apos;s it!
          </p>
          <p className="text-gray-400">
            <strong>Supported:</strong> Excel Desktop (Windows/Mac), Excel Online, Microsoft 365
          </p>
        </div>
      </div>
    </div>
  );
}

// Keep old export name for backwards compatibility
export const CRKAddInInfo = PowerQueryInfo;
export default PowerQueryInfo;
