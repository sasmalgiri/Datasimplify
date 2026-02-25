'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { ViewModeProvider } from '@/lib/viewMode';
import { BYOKOnboardingGuard } from './BYOKOnboardingGuard';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ViewModeProvider>
        <BYOKOnboardingGuard>
          {children}
        </BYOKOnboardingGuard>
      </ViewModeProvider>
    </AuthProvider>
  );
}
