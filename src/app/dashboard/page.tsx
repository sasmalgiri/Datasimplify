'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

interface DownloadHistory {
  id: string;
  category: string;
  format: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, profile, isLoading, signOut, remainingDownloads } = useAuth();
  const [downloads, setDownloads] = useState<DownloadHistory[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchDownloadHistory();
    }
  }, [user]);

  const fetchDownloadHistory = async () => {
    try {
      const res = await fetch('/api/user/downloads');
      const data = await res.json();
      if (data.downloads) {
        setDownloads(data.downloads);
      }
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    }
  };

  const handleUpgrade = async (tier: string) => {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/paddle/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      // Paddle uses their own billing portal - redirect to Paddle customer portal
      // For now, redirect to pricing page to change plans
      window.location.href = '/pricing';
    } catch (error) {
      console.error('Portal error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const tierColors: Record<string, string> = {
    free: 'bg-gray-600',
    starter: 'bg-blue-600',
    pro: 'bg-purple-600',
    business: 'bg-yellow-600',
  };

  const tierLabels: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    business: 'Business',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-400">
              DataSimplify
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/download" className="text-gray-400 hover:text-white">
                Downloads
              </Link>
              <Link href="/chat" className="text-gray-400 hover:text-white">
                AI Chat
              </Link>
              <button
                onClick={signOut}
                className="text-gray-400 hover:text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Subscription */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm">Current Plan</h3>
              <span className={`px-3 py-1 rounded-full text-sm ${tierColors[profile.subscription_tier]}`}>
                {tierLabels[profile.subscription_tier]}
              </span>
            </div>
            <p className="text-2xl font-bold">
              {profile.subscription_tier === 'free' ? 'Free' : 
               profile.subscription_tier === 'starter' ? '$19/mo' :
               profile.subscription_tier === 'pro' ? '$49/mo' : '$99/mo'}
            </p>
            {profile.subscription_tier !== 'free' && (
              <button
                onClick={handleManageBilling}
                className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
              >
                Manage billing →
              </button>
            )}
          </div>

          {/* Downloads */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-4">Downloads This Month</h3>
            <p className="text-2xl font-bold">
              {profile.downloads_this_month} / {profile.downloads_limit === 999999 ? '∞' : profile.downloads_limit}
            </p>
            <div className="mt-2 bg-gray-700 rounded-full h-2">
              <div
                className={`bg-blue-500 rounded-full h-2 progress-bar progress-w-${Math.round(Math.min(100, (profile.downloads_this_month / profile.downloads_limit) * 100) / 5) * 5}`}
              />
            </div>
            <p className="mt-2 text-gray-400 text-sm">
              {remainingDownloads() === 999999 ? 'Unlimited' : `${remainingDownloads()} remaining`}
            </p>
          </div>

          {/* Member Since */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-4">Member Since</h3>
            <p className="text-2xl font-bold">
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <p className="mt-2 text-gray-400 text-sm">{user.email}</p>
          </div>
        </div>

        {/* Upgrade Section (for free users) */}
        {profile.subscription_tier === 'free' && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 border border-blue-700 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">🚀 Upgrade for More Downloads</h3>
                <p className="text-gray-300">
                  Get unlimited downloads, AI analysis, and priority support.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpgrade('starter')}
                  disabled={isUpgrading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
                >
                  Starter $19/mo
                </button>
                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={isUpgrading}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
                >
                  Pro $49/mo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/download"
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition"
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-medium">Download Data</h3>
            <p className="text-gray-400 text-sm">Excel, CSV, JSON</p>
          </Link>
          <Link
            href="/chat"
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition"
          >
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="font-medium">AI Chat</h3>
            <p className="text-gray-400 text-sm">Ask anything</p>
          </Link>
          <Link
            href="/compare"
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition"
          >
            <div className="text-3xl mb-2">⚖️</div>
            <h3 className="font-medium">Compare</h3>
            <p className="text-gray-400 text-sm">Side by side</p>
          </Link>
          <Link
            href="/templates"
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition"
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-medium">Templates</h3>
            <p className="text-gray-400 text-sm">Pre-built reports</p>
          </Link>
        </div>

        {/* Recent Downloads */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="font-medium">Recent Downloads</h3>
          </div>
          <div className="p-6">
            {downloads.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No downloads yet. <Link href="/download" className="text-blue-400">Start downloading →</Link>
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Format</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.slice(0, 10).map((download) => (
                    <tr key={download.id} className="border-t border-gray-700">
                      <td className="py-3">{download.category}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-gray-700 rounded text-sm">
                          {download.format.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">
                        {new Date(download.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
