import { notFound } from 'next/navigation';
import { PriceAlerts } from '@/components/features/PriceAlerts';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FEATURES } from '@/lib/featureFlags';

// Check feature flag at build/request time - return 404 if disabled
export default function AlertsPage() {
  // In paddle_safe mode, alerts feature is disabled - return proper 404
  if (!FEATURES.alerts) {
    notFound();
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
