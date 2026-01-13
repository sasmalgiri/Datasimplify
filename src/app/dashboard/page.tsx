'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

// Progress bar component using ref to avoid inline style warnings
function ProgressBarRef({ percentage, className }: { percentage: number; className: string }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--progress-width', `${percentage}%`);
    }
  }, [percentage]);

  return <div ref={barRef} className={`${className} progress-bar`} />;
}

interface DownloadHistory {
  id: string;
  category: string;
  format: string;
  created_at: string;
}

interface DeletionPreview {
  email: string;
  dataToBeDeleted: Record<string, string | number>;
  warning: string;
}

export default function DashboardPage() {
  const { user, profile, isLoading, signOut, remainingDownloads } = useAuth();
  const [downloads, setDownloads] = useState<DownloadHistory[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null);
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

  // Fetch deletion preview when modal opens
  const fetchDeletionPreview = useCallback(async () => {
    try {
      const res = await fetch('/api/user/delete');
      const data = await res.json();
      if (!data.error) {
        setDeletionPreview(data);
      }
    } catch (error) {
      console.error('Failed to fetch deletion preview:', error);
    }
  }, []);

  useEffect(() => {
    if (showDeleteModal) {
      fetchDeletionPreview();
    }
  }, [showDeleteModal, fetchDeletionPreview]);

  // Handle data export
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/user/export');
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datasimplify-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE_MY_ACCOUNT') {
      alert('Please type DELETE_MY_ACCOUNT to confirm deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmDelete: 'DELETE_MY_ACCOUNT',
          confirmEmail: user?.email,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Your account has been deleted. You will be redirected to the home page.');
        router.push('/');
      } else {
        alert(data.error || 'Failed to delete account. Please contact support.');
      }
    } catch (error) {
      console.error('Deletion error:', error);
      alert('Failed to delete account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900">Loading...</div>
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              DataSimplify
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/charts" className="text-gray-600 hover:text-gray-900">
                Charts
              </Link>
              <Link href="/download" className="text-gray-600 hover:text-gray-900">
                Downloads
              </Link>
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900"
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
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm">Current Plan</h3>
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
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
              >
                Manage billing →
              </button>
            )}
          </div>

          {/* Downloads */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-gray-600 text-sm mb-4">Downloads This Month</h3>
            <p className="text-2xl font-bold">
              {profile.downloads_this_month} / {profile.downloads_limit === 999999 ? '∞' : profile.downloads_limit}
            </p>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <ProgressBarRef
                percentage={Math.min(100, (profile.downloads_this_month / profile.downloads_limit) * 100)}
                className="bg-blue-500 rounded-full h-2"
              />
            </div>
            <p className="mt-2 text-gray-600 text-sm">
              {remainingDownloads() === 999999 ? 'Unlimited' : `${remainingDownloads()} remaining`}
            </p>
          </div>

          {/* Member Since */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-gray-600 text-sm mb-4">Member Since</h3>
            <p className="text-2xl font-bold">
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <p className="mt-2 text-gray-600 text-sm">{user.email}</p>
          </div>
        </div>

        {/* Upgrade Section (for free users) */}
        {profile.subscription_tier === 'free' && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">🚀 Upgrade for More Downloads</h3>
                <p className="text-gray-600">
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
            className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-500 transition shadow-sm"
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-medium">Download Data</h3>
            <p className="text-gray-600 text-sm">Excel, CSV, JSON</p>
          </Link>
          <Link
            href="/compare"
            className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-500 transition shadow-sm"
          >
            <div className="text-3xl mb-2">⚖️</div>
            <h3 className="font-medium">Compare</h3>
            <p className="text-gray-600 text-sm">Side by side</p>
          </Link>
          <Link
            href="/templates"
            className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-500 transition shadow-sm"
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-medium">Templates</h3>
            <p className="text-gray-600 text-sm">Pre-built reports</p>
          </Link>
        </div>

        {/* Recent Downloads */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium">Recent Downloads</h3>
          </div>
          <div className="p-6">
            {downloads.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No downloads yet. <Link href="/download" className="text-blue-600">Start downloading →</Link>
              </p>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr className="text-left text-gray-600 text-sm">
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Format</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.slice(0, 10).map((download) => (
                    <tr key={download.id} className="border-t border-gray-200">
                      <td className="py-3">{download.category}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {download.format.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">
                        {new Date(download.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Privacy & Data Settings */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div
            className="px-6 py-4 border-b border-gray-200 cursor-pointer flex items-center justify-between"
            onClick={() => setShowSettings(!showSettings)}
          >
            <h3 className="font-medium flex items-center gap-2">
              <span>🔒</span> Privacy & Data Settings
            </h3>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${showSettings ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {showSettings && (
            <div className="p-6 space-y-6">
              {/* Data Export */}
              <div className="flex items-start justify-between pb-6 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-900">Export Your Data</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Download a copy of all your personal data (GDPR/CCPA compliant).
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {isExporting ? 'Exporting...' : 'Download My Data'}
                </button>
              </div>

              {/* Cookie Preferences */}
              <div className="flex items-start justify-between pb-6 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-900">Cookie Preferences</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Manage your cookie consent settings.
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('cookie-consent');
                    window.location.reload();
                  }}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Reset Cookies
                </button>
              </div>

              {/* Delete Account */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-red-600">Delete Account</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Account</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                This action is <span className="font-semibold text-red-600">permanent and irreversible</span>.
                All your data will be deleted including:
              </p>

              {deletionPreview ? (
                <ul className="text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg p-3">
                  {Object.entries(deletionPreview.dataToBeDeleted).map(([key, value]) => (
                    <li key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-medium">{value}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">Loading preview...</div>
              )}

              <p className="text-sm text-gray-600 mt-4">
                To confirm, type <span className="font-mono bg-gray-100 px-1 rounded">DELETE_MY_ACCOUNT</span> below:
              </p>

              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE_MY_ACCOUNT"
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE_MY_ACCOUNT' || isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
