'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useAuth } from '@/lib/auth';

type Release = {
  slug: string;
  title: string;
  description: string | null;
  required_product_key: string | null;
  version: string;
  is_latest: boolean;
  published_at: string;
  file_name: string;
  content_type: string;
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function DownloadsPage() {
  const { user, isLoading } = useAuth();

  const [releases, setReleases] = useState<Release[]>([]);
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [requiresLoginForPaid, setRequiresLoginForPaid] = useState(false);

  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<string | null>(null);

  const freeReleases = useMemo(() => releases.filter((r) => !r.required_product_key), [releases]);
  const paidReleases = useMemo(() => releases.filter((r) => !!r.required_product_key), [releases]);

  const fetchReleases = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch('/api/downloads/releases', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to load downloads');
        setReleases([]);
        setEntitlements([]);
        setRequiresLoginForPaid(false);
        return;
      }

      setReleases(data?.releases || []);
      setEntitlements(data?.entitlements || []);
      setRequiresLoginForPaid(!!data?.requiresLoginForPaid);
    } catch {
      setError('Failed to load downloads');
      setReleases([]);
      setEntitlements([]);
      setRequiresLoginForPaid(false);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    void fetchReleases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const claimPurchases = async () => {
    setIsClaiming(true);
    setClaimResult(null);
    try {
      const res = await fetch('/api/user/entitlements/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimResult(data?.error || 'Claim failed');
        return;
      }

      const claimed = Number(data?.claimed || 0);
      setClaimResult(claimed > 0 ? `Claimed ${claimed} purchase(s).` : 'No purchases found for your email.');
      await fetchReleases();
    } catch {
      setClaimResult('Claim failed');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <h1 className="text-3xl font-bold">Downloads</h1>
            <p className="text-gray-400 mt-2">
              Get your free templates and any purchases tied to your account.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && !user && (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700 transition font-medium"
                >
                  Create account
                </Link>
              </>
            )}

            {user && (
              <button
                type="button"
                onClick={claimPurchases}
                disabled={isClaiming}
                className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-60"
              >
                {isClaiming ? 'Claiming…' : 'Claim purchases'}
              </button>
            )}
          </div>
        </div>

        {claimResult && (
          <div className="mt-4 p-3 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-gray-200">
            {claimResult}
          </div>
        )}

        {user && entitlements.length > 0 && (
          <div className="mt-6 p-4 bg-gray-800/40 border border-gray-700 rounded-lg">
            <div className="text-sm font-semibold text-white mb-2">Your entitlements</div>
            <div className="flex flex-wrap gap-2">
              {entitlements.map((k) => (
                <span key={k} className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          {isFetching ? (
            <div className="text-gray-400">Loading downloads…</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Free downloads</h2>
                <button
                  type="button"
                  onClick={fetchReleases}
                  className="text-sm text-gray-300 hover:text-white"
                >
                  Refresh
                </button>
              </div>

              {freeReleases.length === 0 ? (
                <div className="text-gray-400">No free downloads published yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {freeReleases.map((r) => (
                    <div key={r.slug} className="bg-gray-800/40 border border-gray-700 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold">{r.title}</div>
                          {r.description && <div className="text-gray-400 text-sm mt-1">{r.description}</div>}
                          <div className="text-gray-500 text-xs mt-2">
                            v{r.version} • {formatDate(r.published_at)}
                          </div>
                        </div>
                        <a
                          href={`/api/downloads/${encodeURIComponent(r.slug)}`}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-10">
                <h2 className="text-xl font-semibold mb-2">Purchased downloads</h2>

                {!user && requiresLoginForPaid && (
                  <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5 text-gray-300 text-sm">
                    Sign in to see your paid downloads.
                  </div>
                )}

                {user && paidReleases.length === 0 && (
                  <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5 text-gray-300 text-sm">
                    No paid downloads found for your account yet. If you purchased using this email, click{' '}
                    <strong>Claim purchases</strong>.
                  </div>
                )}

                {user && paidReleases.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paidReleases.map((r) => (
                      <div key={r.slug} className="bg-gray-800/40 border border-emerald-500/20 rounded-xl p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-lg font-semibold">{r.title}</div>
                            {r.description && <div className="text-gray-400 text-sm mt-1">{r.description}</div>}
                            <div className="text-gray-500 text-xs mt-2">
                              v{r.version} • {formatDate(r.published_at)}
                              {r.required_product_key ? ` • requires ${r.required_product_key}` : ''}
                            </div>
                          </div>
                          <a
                            href={`/api/downloads/${encodeURIComponent(r.slug)}`}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-12 p-4 bg-gray-800/20 border border-gray-800 rounded-lg text-xs text-gray-400">
                Tip: Paid files are delivered via time-limited links. If your download fails, refresh this page and try again.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
