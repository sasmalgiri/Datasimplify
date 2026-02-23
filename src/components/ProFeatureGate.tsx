'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Lock } from 'lucide-react';

interface ProFeatureGateProps {
  children: React.ReactNode;
  /** Feature name shown in the upgrade prompt */
  feature?: string;
}

/**
 * Wraps content that requires a Pro subscription.
 * Free users see a blurred preview with an upgrade CTA overlay.
 * Pro users see the content normally.
 */
export function ProFeatureGate({ children, feature }: ProFeatureGateProps) {
  const { profile, isAdmin } = useAuth();

  if (isAdmin || profile?.subscription_tier === 'pro') {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none filter blur-sm opacity-60">
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-lg">
        <div className="text-center p-6 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
            <Lock className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Pro Feature
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {feature
              ? `${feature} is available on the Pro plan.`
              : 'This feature is available on the Pro plan.'}
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
