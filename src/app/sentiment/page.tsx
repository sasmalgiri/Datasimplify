'use client';

import { FearGreedIndex } from '@/components/features/FearGreedIndex';
import { BeginnerTip } from '@/components/ui/BeginnerHelpers';
import { FreeNavbar } from '@/components/FreeNavbar';
import { AuthGate } from '@/components/AuthGate';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DisplayOnlyBadge } from '@/components/DisplayOnlyBadge';
import { UniversalExport } from '@/components/UniversalExport';
import { EducationBanner } from '@/components/EducationBanner';
import { WhatsNext } from '@/components/WhatsNext';
import { AutoJargon } from '@/components/ui/SimplifiedUI';
import { DataTrustStrip } from '@/components/DataFreshness';
import { GuidedTour, TOUR_SENTIMENT } from '@/components/GuidedTour';

export default function SentimentPage() {
  return (
    <AuthGate redirectPath="/sentiment" featureName="Sentiment Analysis">
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <GuidedTour tourId="sentiment" pageTitle="Sentiment" steps={TOUR_SENTIMENT} nextPage={{ label: 'Try Technical Analysis', href: '/technical' }} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Market Sentiment</h1>
            <p className="text-gray-400">
              <AutoJargon text="Measure market sentiment with the Fear & Greed Index and social sentiment indicators." />
            </p>
          </div>
          <UniversalExport name="Market-Sentiment" compact />
        </div>

        <EducationBanner
          youtubeMyth="'Extreme Fear = buy everything! Extreme Greed = sell everything!' — YouTubers treat the Fear & Greed Index as a simple buy/sell signal."
          reality="Extreme fear can persist for months during bear markets. Buying at the first sign of fear in 2022 would have led to further 50% losses. Use this as ONE input alongside fundamentals, not as a standalone trigger."
          mythId="buy-the-dip-danger"
          learnLink="/learn/path"
          learnLabel="Learn: Fear & Greed Index (Level 1)"
          storageKey="sentiment"
        />

        <DataTrustStrip source="Alternative.me" />

        {/* Display Only Badge */}
        <DisplayOnlyBadge pageId="sentiment" variant="card" className="mb-6" />

        <div className="grid md:grid-cols-2 gap-6">
          <FearGreedIndex showBeginnerTips={true} />

          <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white mb-4">📚 Understanding Sentiment</h2>

            <BeginnerTip>
              Sentiment indicators show how <strong>emotional</strong> investors are feeling.
              Emotions often lead to bad decisions - understanding sentiment helps you stay rational!
            </BeginnerTip>

            <div className="space-y-4 mt-4">
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                <h3 className="font-bold text-red-400">😨 Extreme Fear (0-25)</h3>
                <p className="text-sm text-red-400/80 mt-1">
                  Sentiment is very negative. Markets are often highly volatile during these periods.
                </p>
                <p className="text-xs text-red-400 mt-2">
                  💡 <strong>Tip:</strong> Treat this as educational context, not a recommendation.
                </p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg">
                <h3 className="font-bold text-orange-400">😟 Fear (25-50)</h3>
                <p className="text-sm text-orange-400/80 mt-1">
                  People are nervous but not panicking. Market is uncertain.
                </p>
                <p className="text-xs text-orange-400 mt-2">
                  💡 <strong>Tip:</strong> Use sentiment alongside other information and risk disclosures.
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-400">😐 Neutral (50)</h3>
                <p className="text-sm text-yellow-400/80 mt-1">
                  Market is balanced. No strong emotions either way.
                </p>
                <p className="text-xs text-yellow-400 mt-2">
                  💡 <strong>Tip:</strong> Use this as a baseline reference point.
                </p>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                <h3 className="font-bold text-green-400">😊 Greed (50-75)</h3>
                <p className="text-sm text-green-400/80 mt-1">
                  People are optimistic. Prices are rising. FOMO is building.
                </p>
                <p className="text-xs text-green-400 mt-2">
                  💡 <strong>Tip:</strong> Use sentiment as educational context, not as a recommendation.
                </p>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg">
                <h3 className="font-bold text-emerald-400">🤑 Extreme Greed (75-100)</h3>
                <p className="text-sm text-emerald-400/80 mt-1">
                  Sentiment is very positive. Markets can still be volatile during these periods.
                </p>
                <p className="text-xs text-emerald-400 mt-2">
                  💡 <strong>Tip:</strong> Treat this as educational context, not a recommendation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <WhatsNext contextLabel="Understand what drives sentiment and how to use it wisely" />

        {/* Historical Context */}
        <div className="mt-8 bg-gray-800/60 rounded-xl border border-gray-700/50 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-white mb-4">📈 Historical Examples</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600/50">
              <span className="text-2xl">📉</span>
              <div>
                <h3 className="font-bold text-white">March 2020 - COVID Crash</h3>
                <p className="text-sm text-gray-400">
                  Fear & Greed hit 8 (Extreme Fear). Bitcoin dropped to around $3,800.
                  The market later recovered significantly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600/50">
              <span className="text-2xl">📈</span>
              <div>
                <h3 className="font-bold text-white">November 2021 - All-Time High</h3>
                <p className="text-sm text-gray-400">
                  Fear & Greed hit 84 (Extreme Greed). Bitcoin reached around $69,000.
                  The market later experienced a major drawdown.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600/50">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-bold text-white">The Pattern</h3>
                <p className="text-sm text-gray-400">
                  Extreme fear often marks bottoms. Extreme greed often marks tops.
                  Using sentiment as one data point (not the only one) can improve your timing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGate>
  );
}
