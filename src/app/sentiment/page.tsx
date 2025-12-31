'use client';

import { FearGreedIndex } from '@/components/features/FearGreedIndex';
import { BeginnerTip } from '@/components/ui/BeginnerHelpers';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function SentimentPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Market Sentiment</h1>
        <p className="text-gray-400 mb-8">
          Measure the overall mood of the crypto market.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <FearGreedIndex showBeginnerTips={true} />

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">📚 Understanding Sentiment</h2>

            <BeginnerTip>
              Sentiment indicators show how <strong>emotional</strong> investors are feeling.
              Emotions often lead to bad decisions - understanding sentiment helps you stay rational!
            </BeginnerTip>

            <div className="space-y-4 mt-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h3 className="font-bold text-red-700">😨 Extreme Fear (0-25)</h3>
                <p className="text-sm text-red-600 mt-1">
                  People are panicking. Prices are often at their lowest.
                  &quot;Be greedy when others are fearful&quot; - Warren Buffett
                </p>
                <p className="text-xs text-red-700 mt-2">
                  💡 <strong>Tip:</strong> Could be a good buying opportunity, but do your research!
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <h3 className="font-bold text-orange-700">😟 Fear (25-50)</h3>
                <p className="text-sm text-orange-600 mt-1">
                  People are nervous but not panicking. Market is uncertain.
                </p>
                <p className="text-xs text-orange-700 mt-2">
                  💡 <strong>Tip:</strong> Watch for signs of recovery or further decline.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-700">😐 Neutral (50)</h3>
                <p className="text-sm text-yellow-600 mt-1">
                  Market is balanced. No strong emotions either way.
                </p>
                <p className="text-xs text-yellow-700 mt-2">
                  💡 <strong>Tip:</strong> Good time for rational decision-making.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-bold text-green-700">😊 Greed (50-75)</h3>
                <p className="text-sm text-green-600 mt-1">
                  People are optimistic. Prices are rising. FOMO is building.
                </p>
                <p className="text-xs text-green-700 mt-2">
                  💡 <strong>Tip:</strong> Enjoy the ride, but consider taking some profits.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                <h3 className="font-bold text-emerald-700">🤑 Extreme Greed (75-100)</h3>
                <p className="text-sm text-emerald-600 mt-1">
                  Everyone is excited! Prices might be too high.
                  &quot;Be fearful when others are greedy&quot; - Warren Buffett
                </p>
                <p className="text-xs text-emerald-700 mt-2">
                  💡 <strong>Tip:</strong> Be careful! Market corrections often follow extreme greed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Context */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">📈 Historical Examples</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-2xl">📉</span>
              <div>
                <h3 className="font-bold">March 2020 - COVID Crash</h3>
                <p className="text-sm text-gray-600">
                  Fear & Greed hit 8 (Extreme Fear). Bitcoin dropped to $3,800.
                  Those who bought during this fear saw 25x gains over 2 years.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-2xl">📈</span>
              <div>
                <h3 className="font-bold">November 2021 - All-Time High</h3>
                <p className="text-sm text-gray-600">
                  Fear & Greed hit 84 (Extreme Greed). Bitcoin reached $69,000.
                  Those who sold during this greed avoided the 77% crash that followed.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-bold">The Pattern</h3>
                <p className="text-sm text-gray-600">
                  Extreme fear often marks bottoms. Extreme greed often marks tops.
                  Using sentiment as one data point (not the only one) can improve your timing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
