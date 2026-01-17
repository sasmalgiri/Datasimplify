'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { signIn, resendVerificationEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowVerificationMessage(false);
    setResendSuccess(false);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        setShowVerificationMessage(true);
      } else {
        setError(error.message);
      }
      setIsLoading(false);
    } else {
      // Redirect to checkout if plan selected, otherwise dashboard
      if (plan) {
        router.push(`/pricing?plan=${plan}&checkout=true`);
      } else {
        router.push(redirect);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    setResendLoading(true);
    setResendSuccess(false);

    const { error } = await resendVerificationEmail(email);

    if (error) {
      setError(error.message);
    } else {
      setResendSuccess(true);
    }
    setResendLoading(false);
  };

  return (
    <div className="max-w-md w-full">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-emerald-600">
          <span>📊</span>
          <span>CryptoReportKit</span>
        </Link>
        <p className="text-gray-600 mt-2">
          {plan ? `Sign in to subscribe to ${plan}` : 'Sign in to your account'}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Email not verified message */}
          {showVerificationMessage && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-4 rounded">
              <p className="font-medium mb-2">📧 Email not verified</p>
              <p className="text-sm mb-3">
                Please check your inbox and click the verification link we sent you.
                Check your spam folder if you don&apos;t see it.
              </p>
              {resendSuccess ? (
                <p className="text-sm text-green-400">
                  ✓ Verification email sent! Check your inbox.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="text-sm bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded transition"
                >
                  {resendLoading ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link
              href={plan ? `/signup?plan=${plan}` : '/signup'}
              className="text-emerald-600 hover:text-emerald-700"
            >
              Sign up
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
    </div>
  );
}

export default function LoginPage() {
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
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
