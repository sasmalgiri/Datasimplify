'use client';

import { useState, useEffect } from 'react';
import { useWizard } from '../WizardContext';
import { WizardNav } from '../shared/WizardNav';
import { useAuth } from '@/lib/auth';
import { Turnstile } from '@/components/security/Turnstile';
import { Mail, CheckCircle, User } from 'lucide-react';

export function EmailStep() {
  const { state, dispatch } = useWizard();
  const { user } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadsRemaining, setDownloadsRemaining] = useState(5);

  // Auto-fill from logged-in user or localStorage
  useEffect(() => {
    if (user?.email) {
      dispatch({ type: 'SET_EMAIL', email: user.email });
      dispatch({ type: 'SET_AUTHENTICATED', authenticated: true });
      fetchDownloadStatus(user.email);
    } else {
      const savedEmail = localStorage.getItem('crk_user_email');
      if (savedEmail) {
        dispatch({ type: 'SET_EMAIL', email: savedEmail });
        dispatch({ type: 'SET_AUTHENTICATED', authenticated: true });
        fetchDownloadStatus(savedEmail);
      }
    }
  }, [user, dispatch]);

  const fetchDownloadStatus = async (email: string) => {
    try {
      const response = await fetch(`/api/user/track-download?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setDownloadsRemaining(data.downloadsRemaining ?? 5);
      }
    } catch (err) {
      console.error('Error fetching download status:', err);
    }
  };

  const handleRegister = async () => {
    if (!state.email || !state.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          turnstileToken: state.turnstileToken || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('crk_user_email', state.email.toLowerCase());
      dispatch({ type: 'SET_AUTHENTICATED', authenticated: true });
      setDownloadsRemaining(data.downloadsRemaining ?? 5);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleChangeEmail = () => {
    localStorage.removeItem('crk_user_email');
    dispatch({ type: 'SET_AUTHENTICATED', authenticated: false });
    dispatch({ type: 'SET_EMAIL', email: '' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 mb-4">
              {state.isAuthenticated ? (
                <User className="w-6 h-6 text-blue-400" />
              ) : (
                <Mail className="w-6 h-6 text-blue-400" />
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {state.isAuthenticated ? 'Welcome back!' : 'Enter Your Email'}
            </h2>
            <p className="text-gray-400 text-sm">
              {state.isAuthenticated
                ? 'Continue with your account'
                : 'We track downloads to provide free access. No spam, ever.'}
            </p>
          </div>

          {state.isAuthenticated ? (
            /* Authenticated State */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{state.email}</p>
                    <p className="text-sm text-emerald-400">
                      {downloadsRemaining} downloads remaining this month
                    </p>
                  </div>
                </div>
              </div>

              {!user && (
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Use a different email
                </button>
              )}

              {/* Logged in user info */}
              {user && (
                <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">
                    Signed in as CryptoReportKit user
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Registration Form */
            <div className="space-y-4">
              <div>
                <label htmlFor="wizard-email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email address
                </label>
                <input
                  id="wizard-email"
                  type="email"
                  value={state.email}
                  onChange={(e) => dispatch({ type: 'SET_EMAIL', email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>

              {/* Turnstile CAPTCHA */}
              <div className="flex justify-center">
                <Turnstile
                  onVerify={(token) => dispatch({ type: 'SET_TURNSTILE_TOKEN', token })}
                  onExpire={() => dispatch({ type: 'SET_TURNSTILE_TOKEN', token: null })}
                  theme="dark"
                  size="normal"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleRegister}
                disabled={isRegistering || !state.email.includes('@')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {isRegistering ? 'Verifying...' : 'Continue'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Free users get 5 downloads per month. No credit card required.
              </p>
            </div>
          )}
        </div>
      </div>

      <WizardNav />
    </div>
  );
}
