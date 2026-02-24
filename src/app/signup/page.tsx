'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PersonaPicker } from '@/components/persona/PersonaPicker';
import { usePersonaStore } from '@/lib/persona/personaStore';
import type { PersonaId } from '@/lib/persona/types';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'persona' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaId | null>(null);
  const [personaSaving, setPersonaSaving] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const _router = useRouter(); // Available for post-signup redirect
  const [googleLoading, setGoogleLoading] = useState(false);
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const setPersona = usePersonaStore((s) => s.setPersona);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setStep('persona');
    }
  };

  const handlePersonaSelect = async (persona: PersonaId) => {
    setSelectedPersona(persona);
  };

  const handlePersonaConfirm = async () => {
    if (!selectedPersona) return;
    setPersonaSaving(true);
    // Save to local store immediately
    setPersona(selectedPersona);
    // Try to sync to Supabase (non-blocking — user might not be verified yet)
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: { persona: selectedPersona },
        }),
      });
    } catch {
      // Non-blocking — localStorage is the primary store until verified
    }
    setPersonaSaving(false);
    setStep('success');
  };

  const handlePersonaSkip = () => {
    setStep('success');
  };

  // Step 3: Success / Check email
  if (step === 'success') {
    return (
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700 shadow-sm">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-white mb-4">Check your email!</h2>
          <p className="text-gray-400 mb-6">
            We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>.
            Click the link to activate your account.
          </p>
          {plan && (
            <p className="text-emerald-400 mb-4">
              After confirming, you&apos;ll be able to subscribe to the <strong>{plan}</strong> plan.
            </p>
          )}
          <Link
            href={plan ? `/login?plan=${plan}` : '/login'}
            className="inline-block py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Step 2: Persona selection
  if (step === 'persona') {
    return (
      <div className="max-w-3xl w-full">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-medium">1</div>
            <span className="text-xs text-gray-400 hidden sm:inline">Account</span>
          </div>
          <div className="w-8 h-px bg-emerald-400"></div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-medium">2</div>
            <span className="text-xs text-emerald-600 font-medium hidden sm:inline">Your Profile</span>
          </div>
          <div className="w-8 h-px bg-gray-600"></div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center font-medium">3</div>
            <span className="text-xs text-gray-400 hidden sm:inline">Verify</span>
          </div>
        </div>

        <PersonaPicker
          selected={selectedPersona}
          onSelect={handlePersonaSelect}
          onSkip={handlePersonaSkip}
        />

        {selectedPersona && (
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={handlePersonaConfirm}
              disabled={personaSaving}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
            >
              {personaSaving ? 'Saving...' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Step 1: Email + password form
  return (
    <div className="max-w-md w-full">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-medium">1</div>
          <span className="text-xs text-emerald-400 font-medium hidden sm:inline">Account</span>
        </div>
        <div className="w-8 h-px bg-gray-600"></div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center font-medium">2</div>
          <span className="text-xs text-gray-400 hidden sm:inline">Your Profile</span>
        </div>
        <div className="w-8 h-px bg-gray-600"></div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center font-medium">3</div>
          <span className="text-xs text-gray-400 hidden sm:inline">Verify</span>
        </div>
      </div>

      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-emerald-400">
          <span>📊</span>
          <span>CryptoReportKit</span>
        </Link>
        <p className="text-gray-400 mt-2">
          {plan ? `Create account to subscribe to ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : 'Create your free account'}
        </p>
        {!plan && (
          <p className="text-emerald-400 text-sm mt-1 font-medium">Free forever — no credit card required</p>
        )}
      </div>

      {/* Selected Plan Banner */}
      {plan && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
          <p className="text-emerald-400">
            ✓ Selected plan: <strong>{plan.charAt(0).toUpperCase() + plan.slice(1)}</strong>
          </p>
          <p className="text-gray-400 text-sm">You&apos;ll proceed to payment after signup</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition"
          >
            {isLoading ? 'Creating account...' : plan ? 'Create Account & Continue' : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-gray-800/50 text-gray-500">or</span>
          </div>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={async () => {
            setGoogleLoading(true);
            setError('');
            const { error } = await signInWithGoogle();
            if (error) {
              setError(error.message);
              setGoogleLoading(false);
            }
          }}
          disabled={googleLoading || isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white font-medium hover:bg-gray-600 disabled:opacity-50 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Redirecting...' : 'Sign up with Google'}
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link
              href={plan ? `/login?plan=${plan}` : '/login'}
              className="text-emerald-400 hover:text-emerald-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Trust signals */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">&#128274; BYOK — keys stay local</span>
        <span className="flex items-center gap-1">&#9989; 32+ free dashboards</span>
        <span className="flex items-center gap-1">&#128176; Cancel anytime</span>
      </div>

      {/* Back to free features */}
      <div className="mt-4 text-center">
        <Link href="/live-dashboards" className="text-gray-400 hover:text-white text-sm">
          ← Explore dashboards first
        </Link>
      </div>

      {/* Terms */}
      <p className="mt-4 text-center text-gray-500 text-xs">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="text-emerald-400 hover:underline">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>
      </p>
    </div>
  );
}

function SignupFormFallback() {
  return (
    <div className="max-w-md w-full">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-emerald-400">
          <span>📊</span>
          <span>CryptoReportKit</span>
        </Link>
        <p className="text-gray-400 mt-2">Create your free account</p>
        <p className="text-emerald-400 text-sm mt-1 font-medium">Free forever — no credit card required</p>
      </div>

      {/* Static Form Skeleton */}
      <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700 shadow-sm">
        <noscript>
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-3 rounded text-sm mb-4">
            JavaScript is required to create an account. Please enable JavaScript and refresh the page.
          </div>
        </noscript>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
            <div className="w-full h-12 bg-gray-700 border border-gray-600 rounded-lg animate-pulse"></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="w-full h-12 bg-gray-700 border border-gray-600 rounded-lg animate-pulse"></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
            <div className="w-full h-12 bg-gray-700 border border-gray-600 rounded-lg animate-pulse"></div>
          </div>
          <div className="w-full h-12 bg-emerald-600/30 rounded-lg animate-pulse"></div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link href="/market" className="text-gray-400 hover:text-white text-sm">
          ← Back to free features
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="flex items-center justify-center px-4 py-12">
        <Suspense fallback={<SignupFormFallback />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
