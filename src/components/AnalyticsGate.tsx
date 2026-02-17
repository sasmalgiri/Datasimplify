'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

function readConsent(): CookieConsent | null {
  try {
    const raw = window.localStorage.getItem('cookie-consent');
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

export default function AnalyticsGate() {
  // Start disabled (matches server render) — read consent in useEffect
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => {
      const updated = readConsent();
      setEnabled(Boolean(updated?.analytics));
    };

    // Initial read
    sync();

    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'cookie-consent') return;
      sync();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('cookie-consent-changed', sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cookie-consent-changed', sync);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
