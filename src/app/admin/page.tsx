'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin Dashboard - User Management + Analytics
 *
 * Tabbed admin panel with:
 * - Overview: KPI cards + quick stats
 * - Users: Full user management table
 * - Analytics: API usage, signups, top endpoints
 * - Security: Security events, severity breakdown
 */

interface User {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string;
  subscription_status: string | null;
  downloads_limit: number;
  downloads_this_month: number;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AnalyticsData {
  kpis: {
    totalUsers: number;
    proUsers: number;
    newUsers: number;
    newUsersToday: number;
    apiCalls: number;
    apiCallsToday: number;
    downloads: number;
    conversionRate: string;
  };
  topEndpoints: { endpoint: string; count: number }[];
  dailyApiCalls: { date: string; count: number }[];
  dailySignups: { date: string; count: number }[];
  topUsers: { user_id: string; email: string; calls: number }[];
  security: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  feedback: {
    total: number;
    helpful: number;
    unhelpful: number;
    score: string;
  };
  range: string;
}

type Tab = 'overview' | 'users' | 'analytics' | 'security';

// ─── KPI Card ───────────────────────────────────────────────
function KpiCard({ label, value, sub, color = 'emerald' }: {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'emerald' | 'blue' | 'yellow' | 'red' | 'purple';
}) {
  const colors = {
    emerald: 'border-emerald-500/30 bg-emerald-500/10',
    blue: 'border-blue-500/30 bg-blue-500/10',
    yellow: 'border-yellow-500/30 bg-yellow-500/10',
    red: 'border-red-500/30 bg-red-500/10',
    purple: 'border-purple-500/30 bg-purple-500/10',
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Mini Bar Chart (CSS-only) ──────────────────────────────
function MiniBarChart({ data, label }: {
  data: { date: string; count: number }[];
  label: string;
}) {
  if (!data.length) return <p className="text-gray-500 text-sm">No data yet</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div>
      <p className="text-sm text-gray-400 mb-3">{label}</p>
      <div className="flex items-end gap-1 h-32">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center group relative">
            <div
              className="w-full bg-emerald-500/70 rounded-t hover:bg-emerald-400 transition-colors min-h-[2px]"
              style={{ height: `${(d.count / max) * 100}%` }}
            />
            <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              {d.date}: {d.count.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-gray-600">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [analyticsRange, setAnalyticsRange] = useState('7d');

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ─── Fetch Users ──────────────────────────────────────────
  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '50' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (res.status === 403) { setError('You do not have admin access.'); return; }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || 'Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [search, router]);

  // ─── Fetch Analytics ──────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${analyticsRange}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      // Silently fail — overview still shows user data
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsRange]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchUsers(1); };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);
    setError(null);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const updates = {
        user_id: editingUser.id,
        subscription_tier: formData.get('subscription_tier'),
        subscription_status: formData.get('subscription_status'),
        downloads_limit: parseInt(formData.get('downloads_limit') as string, 10),
        reason: formData.get('reason'),
      };
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }
      await fetchUsers(pagination.page);
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'pro': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'trialing': return 'bg-blue-500/20 text-blue-400';
      case 'past_due': return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled': case 'paused': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  // ─── Access Denied ────────────────────────────────────────
  if (error === 'You do not have admin access.') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-400">You do not have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const kpis = analytics?.kpis;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">CryptoReportKit — Manage users, view analytics, monitor security</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="analytics-range" className="sr-only">Analytics date range</label>
            <select
              id="analytics-range"
              value={analyticsRange}
              onChange={(e) => setAnalyticsRange(e.target.value)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              type="button"
              onClick={() => { fetchUsers(); fetchAnalytics(); }}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-800/50 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && error !== 'You do not have admin access.' && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* ═══════════════════════ OVERVIEW TAB ═══════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            {analyticsLoading && !analytics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : kpis ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Total Users" value={kpis.totalUsers.toLocaleString()} color="blue" />
                <KpiCard label="Pro Users" value={kpis.proUsers.toLocaleString()} sub={`${kpis.conversionRate}% conversion`} color="emerald" />
                <KpiCard label="New Users" value={kpis.newUsers.toLocaleString()} sub={`${kpis.newUsersToday} today`} color="purple" />
                <KpiCard label="API Calls" value={kpis.apiCalls.toLocaleString()} sub={`${kpis.apiCallsToday.toLocaleString()} today`} color="blue" />
                <KpiCard label="Downloads" value={kpis.downloads.toLocaleString()} sub={`Last ${analytics?.range}`} color="yellow" />
                <KpiCard label="Security Events" value={analytics?.security.total.toLocaleString() || '0'} sub={`${analytics?.security.bySeverity?.high || 0} high severity`} color="red" />
                <KpiCard label="Feedback Score" value={`${analytics?.feedback.score || 0}%`} sub={`${analytics?.feedback.total || 0} responses`} color="emerald" />
                <KpiCard
                  label="Avg API Calls/Day"
                  value={analytics?.dailyApiCalls.length
                    ? Math.round(kpis.apiCalls / analytics.dailyApiCalls.length).toLocaleString()
                    : '0'}
                  color="purple"
                />
              </div>
            ) : null}

            {/* Charts Row */}
            {analytics && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <MiniBarChart data={analytics.dailyApiCalls} label="API Calls per Day" />
                </div>
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <MiniBarChart data={analytics.dailySignups} label="Signups per Day" />
                </div>
              </div>
            )}

            {/* Top Endpoints + Top Users */}
            {analytics && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Endpoints */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <p className="text-sm text-gray-400 mb-3">Top Endpoints</p>
                  <div className="space-y-2">
                    {analytics.topEndpoints.slice(0, 8).map((ep) => {
                      const pct = analytics.topEndpoints[0]?.count
                        ? (ep.count / analytics.topEndpoints[0].count) * 100
                        : 0;
                      return (
                        <div key={ep.endpoint} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-300 font-mono">{ep.endpoint}</span>
                              <span className="text-gray-500">{ep.count.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Users */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <p className="text-sm text-gray-400 mb-3">Top Users by API Usage</p>
                  <div className="space-y-2">
                    {analytics.topUsers.length === 0 ? (
                      <p className="text-gray-500 text-sm">No user activity yet</p>
                    ) : (
                      analytics.topUsers.slice(0, 8).map((u, i) => (
                        <div key={u.user_id} className="flex items-center gap-3 py-1">
                          <span className="text-gray-500 text-xs w-5">{i + 1}.</span>
                          <span className="text-gray-300 text-sm flex-1 truncate">{u.email}</span>
                          <span className="text-emerald-400 text-sm font-mono">{u.calls.toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════ USERS TAB ═══════════════════════ */}
        {activeTab === 'users' && (
          <div>
            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <label htmlFor="user-search" className="sr-only">Search users</label>
              <div className="flex gap-2">
                <input
                  id="user-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email or name..."
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium">
                  Search
                </button>
              </div>
            </form>

            {/* Users Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Downloads</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {isLoading ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-white">{user.email}</div>
                              {user.full_name && <div className="text-sm text-gray-400">{user.full_name}</div>}
                              <div className="text-xs text-gray-500 font-mono">{user.id.slice(0, 8)}...</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getTierBadge(user.subscription_tier)}`}>
                              {user.subscription_tier}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(user.subscription_status)}`}>
                              {user.subscription_status || 'none'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <span className="text-white">{user.downloads_this_month}</span>
                              <span className="text-gray-500"> / {user.downloads_limit}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setEditingUser(user)} className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fetchUsers(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => fetchUsers(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════ ANALYTICS TAB ═══════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading && !analytics ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-gray-800 rounded-lg animate-pulse" />)}
              </div>
            ) : analytics ? (
              <>
                {/* API Calls Chart */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <MiniBarChart data={analytics.dailyApiCalls} label={`API Calls — Last ${analytics.range}`} />
                </div>

                {/* Signups Chart */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <MiniBarChart data={analytics.dailySignups} label={`User Signups — Last ${analytics.range}`} />
                </div>

                {/* Detailed Endpoint Table */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-gray-300">All Endpoints</p>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Endpoint</th>
                        <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">Calls</th>
                        <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {analytics.topEndpoints.map((ep) => {
                        const totalCalls = analytics.topEndpoints.reduce((s, e) => s + e.count, 0);
                        return (
                          <tr key={ep.endpoint} className="hover:bg-gray-700/50">
                            <td className="px-4 py-2 text-sm font-mono text-gray-300">{ep.endpoint}</td>
                            <td className="px-4 py-2 text-sm text-right text-white">{ep.count.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-400">
                              {totalCalls ? ((ep.count / totalCalls) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Top Users Detailed Table */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-gray-300">Most Active Users</p>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">#</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Email</th>
                        <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">API Calls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {analytics.topUsers.length === 0 ? (
                        <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-500">No user activity</td></tr>
                      ) : (
                        analytics.topUsers.map((u, i) => (
                          <tr key={u.user_id} className="hover:bg-gray-700/50">
                            <td className="px-4 py-2 text-sm text-gray-500">{i + 1}</td>
                            <td className="px-4 py-2 text-sm text-gray-300">{u.email}</td>
                            <td className="px-4 py-2 text-sm text-right text-emerald-400 font-mono">{u.calls.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Feedback */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <p className="text-sm text-gray-400 mb-3">User Feedback</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{analytics.feedback.total}</p>
                      <p className="text-xs text-gray-500">Total Responses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{analytics.feedback.helpful}</p>
                      <p className="text-xs text-gray-500">Helpful</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{analytics.feedback.unhelpful}</p>
                      <p className="text-xs text-gray-500">Not Helpful</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Failed to load analytics.</p>
            )}
          </div>
        )}

        {/* ═══════════════════════ SECURITY TAB ═══════════════════════ */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {analyticsLoading && !analytics ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-800 rounded-lg animate-pulse" />)}
              </div>
            ) : analytics ? (
              <>
                {/* Severity Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(['low', 'medium', 'high', 'critical'] as const).map((sev) => {
                    const count = analytics.security.bySeverity[sev] || 0;
                    const color = sev === 'critical' ? 'red' : sev === 'high' ? 'red' : sev === 'medium' ? 'yellow' : 'blue';
                    return (
                      <KpiCard
                        key={sev}
                        label={`${sev.charAt(0).toUpperCase() + sev.slice(1)} Severity`}
                        value={count}
                        color={color as 'red' | 'yellow' | 'blue'}
                      />
                    );
                  })}
                </div>

                {/* Events by Type */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-gray-300">Security Events by Type</p>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Event Type</th>
                        <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {Object.entries(analytics.security.byType)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <tr key={type} className="hover:bg-gray-700/50">
                            <td className="px-4 py-2 text-sm font-mono text-gray-300">{type}</td>
                            <td className="px-4 py-2 text-sm text-right text-white">{count.toLocaleString()}</td>
                          </tr>
                        ))}
                      {Object.keys(analytics.security.byType).length === 0 && (
                        <tr><td colSpan={2} className="px-4 py-4 text-center text-gray-500">No security events</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Info box */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-sm text-gray-400">
                  <p className="font-medium text-gray-300 mb-1">About Security Events</p>
                  <p>Events are logged from registration attempts, download rate limiting, bot detection, and CAPTCHA verification. High-severity events indicate potential abuse (IP blocks, repeated failures). Vercel Analytics (page views, web vitals) are available on your <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Vercel Dashboard</a>.</p>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Failed to load security data.</p>
            )}
          </div>
        )}

        {/* ═══════════════════════ EDIT MODAL ═══════════════════════ */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <p className="text-sm text-gray-400 mb-4">{editingUser.email}</p>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label htmlFor="subscription_tier" className="block text-sm font-medium text-gray-300 mb-1">Subscription Tier</label>
                  <select id="subscription_tier" name="subscription_tier" defaultValue={editingUser.subscription_tier} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="subscription_status" className="block text-sm font-medium text-gray-300 mb-1">Subscription Status</label>
                  <select id="subscription_status" name="subscription_status" defaultValue={editingUser.subscription_status || 'active'} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <option value="active">Active</option>
                    <option value="trialing">Trialing</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="downloads_limit" className="block text-sm font-medium text-gray-300 mb-1">Downloads Limit</label>
                  <input id="downloads_limit" type="number" name="downloads_limit" defaultValue={editingUser.downloads_limit} min="0" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                </div>
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-1">Reason for Change</label>
                  <input id="reason" type="text" name="reason" placeholder="e.g., Beta tester, Demo account, Support ticket #123" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={isSaving} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 rounded-lg font-medium">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
