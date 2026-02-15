'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

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
  const [releases, setReleases] = useState<Release[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const freeReleases = useMemo(() => releases.filter((r) => !r.required_product_key), [releases]);

  const fetchReleases = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch('/api/downloads/releases', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        // Don't show "Auth session missing" as an error - it's expected for non-logged-in users
        if (data?.error?.includes('Auth session missing')) {
          setReleases([]);
          return;
        }
        setError(data?.error || 'Failed to load downloads');
        setReleases([]);
        return;
      }

      setReleases(data?.releases || []);
    } catch {
      setError('Failed to load downloads');
      setReleases([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    void fetchReleases();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <h1 className="text-3xl font-bold">Downloads</h1>
            <p className="text-gray-400 mt-2">
              Get your free Excel templates with live crypto data.
            </p>
          </div>
        </div>

        <div className="mt-10">
          {isFetching ? (
            <div className="text-gray-400">Loading downloads…</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : (
            <>
              {/* Main Download Options */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5">
                  <div className="text-lg font-semibold">Excel Data Templates</div>
                  <div className="text-gray-400 text-sm mt-1">
                    Templates ship with prefetched crypto data, ready to use.
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href="/download"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition"
                    >
                      Customize & Download
                    </Link>
                    <Link
                      href="/template-requirements"
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
                    >
                      Setup Guide
                    </Link>
                  </div>
                </div>

                <div className="bg-gray-800/40 border border-emerald-500/30 rounded-xl p-5">
                  <div className="text-lg font-semibold">Live Dashboards</div>
                  <div className="text-gray-400 text-sm mt-1">
                    20+ live web dashboards with real-time crypto data. Use your own API key (BYOK) for full access.
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href="/live-dashboards"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition text-white"
                    >
                      View Dashboards
                    </Link>
                  </div>
                </div>
              </div>

              {/* Free Downloads Section */}
              {freeReleases.length > 0 && (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
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
                </>
              )}

              {/* Upgrade Prompt */}
              <div className="p-5 bg-gradient-to-r from-emerald-900/20 to-gray-800/40 border border-emerald-500/20 rounded-xl">
                <h2 className="text-lg font-semibold mb-1">Want more?</h2>
                <p className="text-gray-400 text-sm mb-3">
                  Pro members get 300 downloads/month, all 47 dashboard widgets, advanced charts, and full history.
                </p>
                <Link
                  href="/pricing"
                  className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition"
                >
                  View Pro Plan — $19/mo
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
