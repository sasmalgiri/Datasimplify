'use client';

import { useState } from 'react';
import { TechnicalAnalysis } from '@/components/features/TechnicalAnalysis';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DisplayOnlyBadge } from '@/components/DisplayOnlyBadge';
import { UniversalExport } from '@/components/UniversalExport';

const COINS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'TRX', name: 'TRON' },
];

export default function TechnicalPage() {
  const [selectedCoin, setSelectedCoin] = useState('BTC');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Technical Analysis</h1>
            <p className="text-gray-400">
              See what technical indicators are saying about the market.
            </p>
          </div>
          <UniversalExport name="Technical-Analysis" compact />
        </div>

        {/* Display Only Badge */}
        <DisplayOnlyBadge pageId="technical" variant="card" className="mb-6" />

        {/* Coin Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {COINS.map((c) => (
            <button
              key={c.symbol}
              type="button"
              onClick={() => setSelectedCoin(c.symbol)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                selectedCoin === c.symbol
                  ? 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30'
                  : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {c.symbol}
            </button>
          ))}
        </div>

        <TechnicalAnalysis coin={selectedCoin} showBeginnerTips={true} />
      </div>
    </div>
  );
}
