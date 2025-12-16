'use client';

import { StrategyBacktester } from '@/components/features/StrategyBacktester';

export default function BacktestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Strategy Backtester</h1>
        <p className="text-gray-600 mb-8">
          Test trading strategies on historical data before risking real money.
        </p>
        
        <StrategyBacktester showBeginnerTips={true} />
      </div>
    </div>
  );
}
