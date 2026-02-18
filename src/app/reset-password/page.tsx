'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  // Supabase sets the session from the recovery link automatically.
  // We just need to wait for the auth state to be ready.
  useEffect(() => {
    const supabase = createBrowserClient();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true);
        }
      }
    );

    // Also check if session already exists (user may have landed here with valid session)
    supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
      if (data.session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserClient();
      if (!supabase) {
        setError('Supabase is not configured.');
        setIsLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/account'), 3000);
    } catch {
      setError('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FreeNavbar />
      <Breadcrumb />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-emerald-600">
              <span>📊</span>
              <span>CryptoReportKit</span>
            </Link>
            <p className="text-gray-600 mt-2">Set your new password</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
            {success ? (
              <div className="text-center">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Password updated!</h2>
                <p className="text-gray-600 mb-6">
                  Your password has been reset successfully. Redirecting to your account...
                </p>
                <Link
                  href="/account"
                  className="inline-block py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
                >
                  Go to Account
                </Link>
              </div>
            ) : !sessionReady ? (
              <div className="text-center">
                <div className="text-5xl mb-4">🔑</div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Verifying your link...</h2>
                <p className="text-gray-600 mb-6">
                  Please wait while we verify your password reset link. If this takes too long, try clicking the link in your email again.
                </p>
                <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-sm mb-6">
                  Enter your new password below. It must be at least 8 characters.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      New password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm new password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                      placeholder="Confirm your password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
                  >
                    {isLoading ? 'Updating...' : 'Update password'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-emerald-600 hover:text-emerald-700 text-sm">
                    ← Back to login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
