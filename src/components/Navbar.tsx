'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const { user, profile, isLoading, isConfigured, signOut } = useAuth();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DS</span>
            </div>
            <span className="font-bold text-xl text-gray-900">
              Data<span className="text-orange-500">Simplify</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Market
            </Link>
            <Link 
              href="/download" 
              className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              📊 Download
            </Link>
            <Link 
              href="/compare" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Compare
            </Link>
            <Link 
              href="/chat" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              🤖 AI Chat
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Pricing
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {!isConfigured ? (
              // Auth not configured - show simple CTA
              <Link
                href="/pricing"
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Get Started Free
              </Link>
            ) : isLoading ? (
              <div className="w-20 h-9 bg-gray-200 animate-pulse rounded-lg" />
            ) : user ? (
              <>
                {/* User info */}
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                  {profile && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      profile.subscription_tier === 'free' ? 'bg-gray-200 text-gray-700' :
                      profile.subscription_tier === 'starter' ? 'bg-blue-100 text-blue-700' :
                      profile.subscription_tier === 'pro' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)}
                    </span>
                  )}
                </div>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
