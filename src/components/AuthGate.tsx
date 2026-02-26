'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { FreeNavbar } from '@/components/FreeNavbar';
import { LogIn, Lock } from 'lucide-react';
import { IS_BETA_MODE } from '@/lib/betaMode';

interface AuthGateProps {
  children: React.ReactNode;
  /** Where to redirect after login — e.g. '/command-center' */
  redirectPath?: string;
  /** Human-readable feature name for the message — e.g. 'Command Center' */
  featureName?: string;
}

/**
 * Wraps a page that requires authentication.
 *
 * - While auth is loading: shows a spinner
 * - If not logged in: shows a "Sign in required" message with login link
 * - If logged in: renders children
 *
 * In beta mode, authentication is skipped and children are rendered directly.
 */
export function AuthGate({ children, redirectPath, featureName = 'this feature' }: AuthGateProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);

  // In beta mode, skip auth entirely
  if (IS_BETA_MODE) {
    return <>{children}</>;
  }

  // Auto-redirect to login (soft — the UI below is the fallback)
  useEffect(() => {
    if (!isLoading && !user && !redirectedRef.current) {
      redirectedRef.current = true;
      const loginUrl = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login';
      router.push(loginUrl);
    }
  }, [isLoading, user, router, redirectPath]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        <FreeNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Not logged in — show message (fallback if redirect hasn't fired yet)
  if (!user) {
    const loginUrl = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login';
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        <FreeNavbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-10">
            <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Sign in required</h1>
            <p className="text-gray-400 text-sm mb-6">
              You need to be logged in to use {featureName}. Sign in or create a free account to continue.
            </p>
            <Link
              href={loginUrl}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <p className="text-xs text-gray-600 mt-4">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-emerald-400 hover:text-emerald-300">
                Sign up free
              </Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Authenticated — render the page
  return <>{children}</>;
}
