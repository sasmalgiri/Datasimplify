'use client';

import { RiskDashboardDemo } from '@/components/features/RiskDashboard';

export default function RiskPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">⚠️ Risk Analysis</h1>
        <p className="text-gray-400 mb-8">
          Understand how risky different cryptocurrencies are before investing.
        </p>

        <RiskDashboardDemo showBeginnerTips={true} />
      </div>
    </div>
  );
}
