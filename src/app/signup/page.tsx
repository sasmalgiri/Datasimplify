'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const _router = useRouter(); // Available for post-signup redirect
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');

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
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Check your email!</h2>
          <p className="text-gray-600 mb-6">
            We&apos;ve sent a confirmation link to <strong className="text-gray-900">{email}</strong>.
            Click the link to activate your account.
          </p>
          {plan && (
            <p className="text-emerald-600 mb-4">
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

  return (
    <div className="max-w-md w-full">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-emerald-600">
          <span>📊</span>
          <span>DataSimplify</span>
        </Link>
        <p className="text-gray-600 mt-2">
          {plan ? `Create account to subscribe to ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : 'Create your account'}
        </p>
      </div>

      {/* Selected Plan Banner */}
      {plan && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <p className="text-emerald-700">
            ✓ Selected plan: <strong>{plan.charAt(0).toUpperCase() + plan.slice(1)}</strong>
          </p>
          <p className="text-gray-600 text-sm">You&apos;ll proceed to payment after signup</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
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

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              href={plan ? `/login?plan=${plan}` : '/login'}
              className="text-emerald-600 hover:text-emerald-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Back to free features */}
      <div className="mt-6 text-center">
        <Link href="/market" className="text-gray-600 hover:text-gray-900 text-sm">
          ← Back to free features
        </Link>
      </div>

      {/* Terms */}
      <p className="mt-4 text-center text-gray-500 text-xs">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="text-emerald-600 hover:underline">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <FreeNavbar />
      <Breadcrumb />
      <div className="flex items-center justify-center px-4 py-12">
        <Suspense fallback={
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading...
          </div>
        }>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
