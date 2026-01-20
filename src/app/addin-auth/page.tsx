'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * Add-in Auth Page
 *
 * This page is opened in an Office Dialog from the Excel add-in.
 * After successful login, it sends the access token back to the add-in
 * via Office.context.ui.messageParent().
 *
 * Flow:
 * 1. Add-in calls Office.context.ui.displayDialogAsync(this URL)
 * 2. User logs in on this page
 * 3. Page sends token back via messageParent
 * 4. Add-in stores token in OfficeRuntime.storage
 */

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export default function AddinAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isOfficeReady, setIsOfficeReady] = useState(false);

  // Check if we're in an Office dialog context
  useEffect(() => {
    // Load Office.js dynamically
    const script = document.createElement('script');
    script.src = 'https://appsforoffice.microsoft.com/lib/1/hosted/office.js';
    script.onload = () => {
      // @ts-expect-error Office is loaded dynamically
      if (typeof Office !== 'undefined') {
        // @ts-expect-error Office is loaded dynamically
        Office.onReady(() => {
          setIsOfficeReady(true);
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!supabaseUrl || !supabaseAnonKey) return;

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        // Already logged in, send token to add-in
        sendTokenToAddin(session.access_token, session.user?.email || '');
      }
    };

    checkSession();
  }, [isOfficeReady]);

  const sendTokenToAddin = (accessToken: string, userEmail: string) => {
    setSuccess(true);

    // Send token back to add-in via Office Dialog API
    // @ts-expect-error Office is loaded dynamically
    if (typeof Office !== 'undefined' && Office.context?.ui?.messageParent) {
      // @ts-expect-error Office is loaded dynamically
      Office.context.ui.messageParent(JSON.stringify({
        type: 'CRK_TOKEN',
        access_token: accessToken,
        email: userEmail,
      }));
    } else {
      // Fallback for testing outside Office (postMessage to parent)
      if (window.opener) {
        window.opener.postMessage({
          type: 'CRK_TOKEN',
          access_token: accessToken,
          email: userEmail,
        }, '*');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Authentication not configured');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please verify your email address first');
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.session?.access_token) {
        sendTokenToAddin(data.session.access_token, data.user?.email || '');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state - dialog will close automatically
  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Login Successful</h1>
          <p className="text-gray-400 text-sm">
            Returning to Excel...
          </p>
          <p className="text-gray-500 text-xs mt-4">
            This window will close automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📊</span>
          </div>
          <h1 className="text-xl font-bold text-white">CryptoReportKit</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to connect Excel</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium text-sm transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <a
              href="https://cryptoreportkit.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Sign up
            </a>
          </p>
          <a
            href="https://cryptoreportkit.com/forgot-password"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-400"
          >
            Forgot password?
          </a>
        </div>

        {/* Office.js Status (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-500">
            Office.js: {isOfficeReady ? '✓ Ready' : 'Loading...'}
          </div>
        )}
      </div>
    </div>
  );
}
