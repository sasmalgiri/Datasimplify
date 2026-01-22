'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <FreeNavbar />
        <Breadcrumb />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  const accountLinks = [
    {
      href: '/account/keys',
      title: 'API Keys',
      description: 'Manage your API keys for data providers (CoinGecko, CoinMarketCap)',
      icon: Key,
      color: 'emerald',
    },
    {
      href: '/pricing',
      title: 'Subscription',
      description: 'View plans and manage your subscription (coming soon)',
      icon: CreditCard,
      color: 'blue',
    },
    {
      href: '#settings',
      title: 'Settings',
      description: 'Account preferences and notifications (coming soon)',
      icon: Settings,
      color: 'purple',
    },
  ];

  const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
    emerald: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-600',
      border: 'border-emerald-200 hover:border-emerald-300',
    },
    blue: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-600',
      border: 'border-blue-200 hover:border-blue-300',
    },
    purple: {
      bg: 'bg-purple-500/10',
      icon: 'text-purple-600',
      border: 'border-purple-200 hover:border-purple-300',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FreeNavbar />
      <Breadcrumb />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
          <p className="text-gray-600">
            Manage your account settings, API keys, and subscription
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

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
                className={`block group bg-white rounded-lg border ${colors.border} p-6 transition-all ${
                  isComingSoon
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:shadow-md'
                }`}
                onClick={(e) => {
                  if (isComingSoon) {
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
                      <h3 className="text-lg font-semibold text-gray-900">
                        {link.title}
                      </h3>
                      <p className="text-sm text-gray-600">{link.description}</p>
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

        {/* BYOK Info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-2">
                BYOK (Bring Your Own Key) Architecture
              </h3>
              <p className="text-emerald-800 text-sm mb-3">
                CryptoReportKit uses a BYOK architecture. Your API keys are encrypted at rest with
                AES-256-GCM and decrypted only in memory to make API calls on your behalf. Keys are
                never logged or stored in plaintext.
              </p>
              <Link
                href="/account/keys"
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                Manage Your API Keys →
              </Link>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm mb-2">Need help with your account?</p>
          <a
            href="mailto:support@cryptoreportkit.com"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Contact Support
          </a>
        </div>
      </main>
    </div>
  );
}
