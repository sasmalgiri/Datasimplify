'use client';

import { StrategyBacktester } from '@/components/features/StrategyBacktester';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function BacktestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Strategy Backtester</h1>
        <p className="text-gray-400 mb-8">
          Test trading strategies on historical data before risking real money.
        </p>

        <StrategyBacktester showBeginnerTips={true} />
      </div>
    </div>
  );
}
