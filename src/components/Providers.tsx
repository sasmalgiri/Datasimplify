'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { ViewModeProvider } from '@/lib/viewMode';
import { UserPreferencesProvider } from '@/components/ui/SimplifiedUI';
import { BYOKOnboardingGuard } from './BYOKOnboardingGuard';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ViewModeProvider>
        <UserPreferencesProvider>
          <BYOKOnboardingGuard>
            {children}
          </BYOKOnboardingGuard>
        </UserPreferencesProvider>
      </ViewModeProvider>
    </AuthProvider>
  );
}
