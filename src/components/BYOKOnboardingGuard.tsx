'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { BYOKOnboardingModal } from './BYOKOnboardingModal';

const DISMISS_KEY = 'crk_byok_dismissed';

export function BYOKOnboardingGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const apiKey = useLiveDashboardStore((s) => s.apiKey);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default true to avoid flash

  // Check localStorage after mount
  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
  }, []);

  // Show modal when user is logged in but has no API key and hasn't dismissed
  useEffect(() => {
    if (!isLoading && user && !apiKey && !dismissed) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isLoading, user, apiKey, dismissed]);

  const handleSkip = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <>
      {children}
      {showModal && <BYOKOnboardingModal onClose={handleClose} onSkip={handleSkip} />}
    </>
  );
}
