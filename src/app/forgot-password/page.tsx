'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
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
            <p className="text-gray-600 mt-2">Reset your password</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
            {success ? (
              <div className="text-center">
                <div className="text-5xl mb-4">📧</div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Check your email</h2>
                <p className="text-gray-600 mb-6">
                  We&apos;ve sent a password reset link to <strong className="text-gray-900">{email}</strong>.
                  Click the link in the email to reset your password.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Don&apos;t see it? Check your spam folder.
                </p>
                <Link
                  href="/login"
                  className="inline-block py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-sm mb-6">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
                  >
                    {isLoading ? 'Sending...' : 'Send reset link'}
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
