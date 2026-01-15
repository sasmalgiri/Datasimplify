import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/featureFlags';

// Predictions page is disabled in paddle_safe mode (trading signals not allowed)
export default function PredictionsPage() {
  // Always return 404 - predictions feature is disabled in paddle_safe mode
  if (!FEATURES.predictions) {
    notFound();
  }

  // If predictions were somehow enabled, show placeholder
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p className="text-gray-400">Predictions feature not implemented.</p>
    </div>
  );
}
