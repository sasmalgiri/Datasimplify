'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { ViewModeProvider } from '@/lib/viewMode';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ViewModeProvider>
        {children}
      </ViewModeProvider>
    </AuthProvider>
  );
}
