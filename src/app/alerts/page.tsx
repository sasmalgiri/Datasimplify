'use client';

import { PriceAlerts } from '@/components/features/PriceAlerts';

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">🔔 Price Alerts</h1>
        <p className="text-gray-400 mb-8">
          Get notified when prices hit your targets.
        </p>
        
        <PriceAlerts showBeginnerTips={true} />
      </div>
    </div>
  );
}
