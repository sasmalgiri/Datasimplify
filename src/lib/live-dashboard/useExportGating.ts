'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  getExportEntitlement,
  type ExportEntitlement,
  type ExportFormat,
  type SubscriptionTier,
} from '@/lib/entitlements';

const ANON_STORAGE_KEY = 'crk_export_count';
const ANON_STORAGE_MONTH_KEY = 'crk_export_month';

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function getAnonymousExportCount(): number {
  if (typeof window === 'undefined') return 0;
  const storedMonth = localStorage.getItem(ANON_STORAGE_MONTH_KEY);
  if (storedMonth !== getCurrentMonth()) {
    localStorage.setItem(ANON_STORAGE_MONTH_KEY, getCurrentMonth());
    localStorage.setItem(ANON_STORAGE_KEY, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(ANON_STORAGE_KEY) || '0', 10);
}

function incrementAnonymousExportCount(): number {
  const current = getAnonymousExportCount();
  const next = current + 1;
  localStorage.setItem(ANON_STORAGE_KEY, String(next));
  return next;
}

export function useExportGating(): {
  entitlement: ExportEntitlement;
  trackExport: (format: ExportFormat) => Promise<void>;
} {
  const { user, profile, refreshProfile } = useAuth();
  const [anonCount, setAnonCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setAnonCount(getAnonymousExportCount());
    }
  }, [user]);

  const tier: SubscriptionTier = (profile?.subscription_tier as SubscriptionTier) || 'free';
  const downloadsUsed = user ? (profile?.downloads_this_month || 0) : anonCount;
  const entitlement = getExportEntitlement(tier, downloadsUsed);

  const trackExport = useCallback(
    async (format: ExportFormat) => {
      if (user) {
        try {
          await fetch('/api/user/track-export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format, source: 'live-dashboard' }),
          });
          await refreshProfile();
        } catch {
          console.error('Failed to track export');
        }
      } else {
        const newCount = incrementAnonymousExportCount();
        setAnonCount(newCount);
      }
    },
    [user, refreshProfile],
  );

  return { entitlement, trackExport };
}
