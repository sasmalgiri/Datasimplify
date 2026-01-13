'use client';

import { PriceAlerts } from '@/components/features/PriceAlerts';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { isFeatureEnabled } from '@/lib/featureFlags';

export default function AlertsPage() {
  const alertsEnabled = isFeatureEnabled('alerts');

  if (!alertsEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <FreeNavbar />
        <Breadcrumb />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold mb-4">Price Alerts</h1>
          <p className="text-gray-700 mb-4">
            This feature is currently disabled in this configuration.
          </p>
          <p className="text-gray-600 text-sm">
            DataSimplify provides research and comparison tools for education purposes.
            Price alert functionality is not available in the current mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Price Alerts</h1>
        <p className="text-gray-400 mb-8">
          Get notified when prices hit your targets.
        </p>

        <PriceAlerts showBeginnerTips={true} />
      </div>
    </div>
  );
}
