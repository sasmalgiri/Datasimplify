'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin Dashboard - User Management
 *
 * Protected page for managing user subscriptions.
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

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (search) {
        params.set('search', search);
      }

      const res = await fetch(`/api/admin/users?${params}`);

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (res.status === 403) {
        setError('You do not have admin access.');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch users');
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

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

      // Refresh user list
      await fetchUsers(pagination.page);
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'pro':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'trialing':
        return 'bg-blue-500/20 text-blue-400';
      case 'past_due':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled':
      case 'paused':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Admin - User Management</h1>
          <p className="text-gray-400">
            Manage user subscriptions and plan overrides. Changes are logged for audit.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or name..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium"
            >
              Search
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Downloads
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-white">{user.email}</div>
                          {user.full_name && (
                            <div className="text-sm text-gray-400">{user.full_name}</div>
                          )}
                          <div className="text-xs text-gray-500 font-mono">{user.id.slice(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded border ${getTierBadgeColor(
                            user.subscription_tier
                          )}`}
                        >
                          {user.subscription_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(
                            user.subscription_status
                          )}`}
                        >
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
                        <button
                          onClick={() => setEditingUser(user)}
                          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                        >
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  Previous
                </button>
                <button
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

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <p className="text-sm text-gray-400 mb-4">{editingUser.email}</p>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    name="subscription_tier"
                    defaultValue={editingUser.subscription_tier}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Subscription Status
                  </label>
                  <select
                    name="subscription_status"
                    defaultValue={editingUser.subscription_status || 'active'}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="active">Active</option>
                    <option value="trialing">Trialing</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Downloads Limit
                  </label>
                  <input
                    type="number"
                    name="downloads_limit"
                    defaultValue={editingUser.downloads_limit}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Reason for Change
                  </label>
                  <input
                    type="text"
                    name="reason"
                    placeholder="e.g., Beta tester, Demo account, Support ticket #123"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 rounded-lg font-medium"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
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
