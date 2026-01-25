'use client';

import { Info, CheckCircle, Key, Zap, Shield } from 'lucide-react';

/**
 * CRKAddInInfo - Information card about the CRK Excel Add-in
 *
 * Displays features and requirements for the CRK add-in.
 * No mode selection - CRK is the only option.
 */
export function CRKAddInInfo({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <span className="text-3xl">📊</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-white">CRK Excel Add-in</h3>
              <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-medium border border-emerald-500/30">
                ✓ Active
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Native Excel add-in with BYOK (Bring Your Own Keys) architecture.
              Connect your own API keys for unlimited data access.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
            <Key className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white mb-1">BYOK Architecture</h4>
              <p className="text-xs text-gray-400">Use your own API keys - no rate limits from us</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
            <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white mb-1">50+ Functions</h4>
              <p className="text-xs text-gray-400">Comprehensive data, charts, and indicators</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
            <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white mb-1">AES-256 Encrypted</h4>
              <p className="text-xs text-gray-400">Your API keys stored with bank-grade security</p>
            </div>
          </div>
        </div>

        {/* Function Categories */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <h4 className="text-sm font-medium text-white mb-3">Available Functions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-emerald-400 font-medium mb-1">Price Data</div>
              <div className="text-gray-400">PRICE, CHANGE24H, MARKETCAP, VOLUME</div>
            </div>
            <div>
              <div className="text-emerald-400 font-medium mb-1">Historical</div>
              <div className="text-gray-400">OHLCV, HISTORICAL, SPARKLINE</div>
            </div>
            <div>
              <div className="text-emerald-400 font-medium mb-1">Technical</div>
              <div className="text-gray-400">RSI, MACD, SMA, EMA, BB, STOCH</div>
            </div>
            <div>
              <div className="text-emerald-400 font-medium mb-1">Market</div>
              <div className="text-gray-400">GLOBAL, DOMINANCE, FEARGREED</div>
            </div>
          </div>
        </div>
      </div>

      {/* Installation Info */}
      <div className="flex items-start gap-2 p-4 bg-emerald-500/10 rounded-lg text-xs border border-emerald-500/30">
        <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="text-gray-300">
          <p className="mb-2">
            <strong className="text-white">Installation Required:</strong> After downloading your template,
            you&apos;ll need to install the CRK Add-in from the Microsoft Office Store.
          </p>
          <p className="text-gray-400">
            <strong>Supported Providers:</strong> CoinGecko (free/pro), Binance, CoinMarketCap, Alternative.me (Fear & Greed)
          </p>
        </div>
      </div>
    </div>
  );
}

export default CRKAddInInfo;
