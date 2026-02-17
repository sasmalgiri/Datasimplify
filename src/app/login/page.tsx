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
  const { signIn, signInWithGoogle, resendVerificationEmail } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const redirect = searchParams.get('redirect') || '/account';

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
      // Full page redirect after login (more reliable than client-side router.push
      // since auth state needs to propagate to server components)
      if (plan) {
        window.location.href = `/pricing?plan=${plan}&checkout=true`;
      } else {
        window.location.href = redirect;
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
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
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

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-500">or</span>
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
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

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
