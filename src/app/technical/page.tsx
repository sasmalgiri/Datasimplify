'use client';

import { useState } from 'react';
import { TechnicalAnalysis } from '@/components/features/TechnicalAnalysis';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DisplayOnlyBadge } from '@/components/DisplayOnlyBadge';
import { UniversalExport } from '@/components/UniversalExport';
import { EducationBanner } from '@/components/EducationBanner';
import { WhatsNext } from '@/components/WhatsNext';
import { AutoJargon } from '@/components/ui/SimplifiedUI';
import { GuidedTour, TOUR_TECHNICAL } from '@/components/GuidedTour';

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
      <GuidedTour tourId="technical" pageTitle="Technical" steps={TOUR_TECHNICAL} nextPage={{ label: 'Try Risk Analysis', href: '/risk' }} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Technical Analysis</h1>
            <p className="text-gray-400">
              <AutoJargon text="See what RSI, MACD, moving averages, and Bollinger Bands are saying about the market." />
            </p>
          </div>
          <UniversalExport name="Technical-Analysis" compact />
        </div>

        <EducationBanner
          youtubeMyth="'This head-and-shoulders pattern means Bitcoin hits $100K by Tuesday!' — YouTubers present TA as if it predicts the future."
          reality="Technical indicators show momentum and trends, NOT predictions. RSI overbought doesn't mean 'sell now' — it means 'be cautious.' No indicator works in isolation. External events (regulation, hacks, macro) override chart patterns every time."
          mythId="ta-theater"
          learnLink="/learn/path"
          learnLabel="Learn: Reading Charts (Level 2)"
          storageKey="technical"
        />

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

        <WhatsNext contextLabel="Now that you've seen the indicators, deepen your understanding" />
      </div>
    </div>
  );
}
