'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  User,
  Key,
  Settings,
  CreditCard,
  LogOut,
  ArrowRight,
  Shield,
  ShieldCheck,
  Download,
  UserCircle,
} from 'lucide-react';
import { usePersonaStore } from '@/lib/persona/personaStore';
import { getPersonaDefinition } from '@/lib/persona/helpers';
import { PersonaPicker } from '@/components/persona/PersonaPicker';
import type { PersonaId } from '@/lib/persona/types';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').filter(Boolean).map(e => e.trim().toLowerCase());

export default function AccountPage() {
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);
  const [timedOut, setTimedOut] = useState(false);
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const persona = usePersonaStore((s) => s.persona);
  const setPersona = usePersonaStore((s) => s.setPersona);
  const syncToSupabase = usePersonaStore((s) => s.syncToSupabase);
  const personaDef = getPersonaDefinition(persona);

  // Hard timeout: if auth takes more than 4 seconds, stop waiting
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Redirect if auth is done (or timed out) and there's no user
    if ((!authLoading || timedOut) && !user && !redirectedRef.current) {
      redirectedRef.current = true;
      router.push('/login');
    }
  }, [user, authLoading, timedOut, router]);

  const handleSignOut = () => {
    // Fire-and-forget: signOut clears state/cookies/localStorage synchronously
    // first, then calls Supabase API (async, non-blocking).
    signOut();
    // Hard redirect immediately — don't wait for the Supabase API call.
    window.location.href = '/login';
  };

  if ((authLoading && !timedOut) || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        <FreeNavbar />
        <Breadcrumb />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">{timedOut ? 'Redirecting to login...' : 'Loading...'}</div>
        </div>
      </div>
    );
  }

  const isAdmin = user.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;

  const accountLinks = [
    {
      href: '/byok',
      title: 'API Key Guide',
      description: 'Learn how to get and use your CoinGecko API key (BYOK)',
      icon: Key,
      color: 'emerald',
    },
    {
      href: '/pricing',
      title: 'Subscription',
      description: isAdmin || profile?.subscription_tier === 'pro'
        ? 'Pro plan active — manage your subscription'
        : 'Free plan — upgrade to Pro for full access',
      icon: CreditCard,
      color: 'blue',
    },
    {
      href: '#persona',
      title: 'Your Persona',
      description: personaDef
        ? `${personaDef.name} — ${personaDef.tagline}`
        : 'Set your persona for personalized content',
      icon: UserCircle,
      color: 'amber',
    },
    {
      href: '#settings',
      title: 'Settings',
      description: 'Account preferences and notifications (coming soon)',
      icon: Settings,
      color: 'purple',
    },
    ...(isAdmin ? [{
      href: '/admin',
      title: 'Admin Dashboard',
      description: 'Manage users, subscriptions, and platform settings',
      icon: ShieldCheck,
      color: 'red' as const,
    }] : []),
  ];

  const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
    emerald: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-400',
      border: 'border-emerald-500/30 hover:border-emerald-400/50',
    },
    blue: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-400',
      border: 'border-blue-500/30 hover:border-blue-400/50',
    },
    purple: {
      bg: 'bg-purple-500/10',
      icon: 'text-purple-400',
      border: 'border-purple-500/30 hover:border-purple-400/50',
    },
    amber: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-400',
      border: 'border-amber-500/30 hover:border-amber-400/50',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      icon: 'text-cyan-400',
      border: 'border-cyan-500/30 hover:border-cyan-400/50',
    },
    pink: {
      bg: 'bg-pink-500/10',
      icon: 'text-pink-400',
      border: 'border-pink-500/30 hover:border-pink-400/50',
    },
    rose: {
      bg: 'bg-rose-500/10',
      icon: 'text-rose-400',
      border: 'border-rose-500/30 hover:border-rose-400/50',
    },
    red: {
      bg: 'bg-red-500/10',
      icon: 'text-red-400',
      border: 'border-red-500/30 hover:border-red-400/50',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">My Account</h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
          <p className="text-gray-400">
            Manage your account settings, API keys, and subscription
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-full">
              <User className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Account Information</h2>
              <p className="text-gray-400">{user.email}</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-gray-500">
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isAdmin || profile?.subscription_tier === 'pro'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {isAdmin ? 'Admin' : profile?.subscription_tier === 'pro' ? 'Pro' : 'Free Plan'}
                </span>
                {personaDef && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                    {personaDef.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Meter */}
        {profile && (
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-white">Monthly Downloads</h3>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">
                  {profile.downloads_this_month} of {profile.downloads_limit} used
                </span>
                <span className="text-gray-500">
                  {Math.max(0, profile.downloads_limit - profile.downloads_this_month)} remaining
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    profile.downloads_this_month / profile.downloads_limit > 0.9
                      ? 'bg-red-500'
                      : profile.downloads_this_month / profile.downloads_limit > 0.7
                        ? 'bg-yellow-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (profile.downloads_this_month / profile.downloads_limit) * 100)}%` }}
                />
              </div>
            </div>
            {!isAdmin && profile.subscription_tier === 'free' && (
              <p className="text-xs text-gray-500 mt-2">
                Free plan: {profile.downloads_limit} downloads/month.{' '}
                <Link href="/pricing" className="text-emerald-400 hover:text-emerald-300">
                  Upgrade to Pro for 300/month
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-4 mb-8">
          {accountLinks.map((link) => {
            const colors = colorClasses[link.color];
            const Icon = link.icon;
            const isComingSoon = link.href.startsWith('#');

            return (
              <Link
                key={link.href}
                href={isComingSoon ? '#' : link.href}
                className={`block group bg-gray-800/50 rounded-lg border ${colors.border} p-6 transition-all ${
                  isComingSoon
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:shadow-md hover:shadow-emerald-500/5'
                }`}
                onClick={(e) => {
                  if (link.href === '#persona') {
                    e.preventDefault();
                    setShowPersonaPicker(!showPersonaPicker);
                  } else if (isComingSoon) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${colors.bg} rounded-lg`}>
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {link.title}
                      </h3>
                      <p className="text-sm text-gray-400">{link.description}</p>
                    </div>
                  </div>
                  {!isComingSoon && (
                    <ArrowRight className={`w-5 h-5 ${colors.icon} group-hover:translate-x-1 transition-transform`} />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Persona Picker (inline) */}
        {showPersonaPicker && (
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 mb-8" id="persona">
            <h3 className="font-semibold text-white mb-4">Change Your Persona</h3>
            <PersonaPicker
              selected={persona}
              onSelect={async (id: PersonaId) => {
                setPersona(id);
                await syncToSupabase();
                setShowPersonaPicker(false);
              }}
              compact
              title=""
              subtitle=""
            />
          </div>
        )}

        {/* BYOK Info */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-300 mb-2">
                BYOK (Bring Your Own Key) Architecture
              </h3>
              <p className="text-emerald-200/80 text-sm mb-3">
                CryptoReportKit uses a true BYOK architecture. Your CoinGecko API key stays in your
                browser - we never see, store, or transmit your keys. You maintain full control
                and privacy over your data access.
              </p>
              <Link
                href="/byok"
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                View BYOK Setup Guide →
              </Link>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm mb-2">Need help with your account?</p>
          <Link
            href="/contact"
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  );
}
