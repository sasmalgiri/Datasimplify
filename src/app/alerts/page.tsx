'use client';

import { useState, useEffect, useCallback } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useAuth } from '@/lib/auth';
import { AuthGate } from '@/components/AuthGate';
import { SUPPORTED_COINS, getCoinGeckoId } from '@/lib/dataTypes';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface Alert {
  id: string;
  coin_id: string;
  alert_type: 'above' | 'below';
  threshold: number;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
}

function AlertsContent() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [coinId, setCoinId] = useState('bitcoin');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/alerts', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchAlerts();
  }, [user, fetchAlerts]);

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);

    const numThreshold = parseFloat(threshold);
    if (!numThreshold || numThreshold <= 0) {
      setError('Please enter a valid price threshold');
      setCreating(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ coin_id: coinId, alert_type: alertType, threshold: numThreshold }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create alert');
      }

      setSuccess(`Alert created: Notify when ${coinId} goes ${alertType} $${numThreshold.toLocaleString()}`);
      setThreshold('');
      fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
    } finally {
      setCreating(false);
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/alerts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {
      setError('Failed to delete alert');
    }
  };

  const activeAlerts = alerts.filter(a => a.is_active);
  const triggeredAlerts = alerts.filter(a => !a.is_active && a.triggered_at);

  if (!user) {
    return <AuthGate redirectPath="/alerts" featureName="Price Alerts"><></></AuthGate>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-emerald-500/10">
            <Bell className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Price Alerts</h1>
            <p className="text-gray-400">Get notified when coins hit your target price</p>
          </div>
        </div>

        {/* Status messages */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">&times;</button>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-300">&times;</button>
          </div>
        )}

        {/* Create Alert Form */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            Create New Alert
          </h2>

          <form onSubmit={createAlert} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="coin" className="block text-sm text-gray-400 mb-1">Coin</label>
              <select
                id="coin"
                value={coinId}
                onChange={(e) => setCoinId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                {SUPPORTED_COINS.slice(0, 50).map(c => (
                  <option key={c.symbol} value={getCoinGeckoId(c.symbol)}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm text-gray-400 mb-1">Condition</label>
              <select
                id="type"
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as 'above' | 'below')}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="above">Price goes above</option>
                <option value="below">Price goes below</option>
              </select>
            </div>

            <div>
              <label htmlFor="threshold" className="block text-sm text-gray-400 mb-1">Price (USD)</label>
              <input
                id="threshold"
                type="number"
                step="any"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="e.g. 100000"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating...' : 'Create Alert'}
              </button>
            </div>
          </form>
        </div>

        {/* Active Alerts */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            Active Alerts ({activeAlerts.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading alerts...
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="text-center py-8 bg-gray-800/50 rounded-xl border border-gray-700">
              <BellOff className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No active alerts. Create one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {alert.alert_type === 'above' ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <span className="font-medium text-white capitalize">{alert.coin_id}</span>
                      <span className="text-gray-400 mx-2">goes</span>
                      <span className={alert.alert_type === 'above' ? 'text-green-400' : 'text-red-400'}>
                        {alert.alert_type}
                      </span>
                      <span className="text-white font-semibold ml-2">
                        ${alert.threshold.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition"
                      title="Delete alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Triggered Alerts (History) */}
        {triggeredAlerts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-gray-400" />
              Triggered ({triggeredAlerts.length})
            </h2>
            <div className="space-y-2">
              {triggeredAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 opacity-60">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="font-medium text-white capitalize">{alert.coin_id}</span>
                      <span className="text-gray-400 mx-2">{alert.alert_type}</span>
                      <span className="text-white">${alert.threshold.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    Triggered {alert.triggered_at ? new Date(alert.triggered_at).toLocaleString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-400">How it works:</strong> Alerts are checked every 5 minutes against live CoinGecko prices.
            When triggered, you&apos;ll receive an email notification. Alerts are one-time — once triggered, they&apos;re automatically deactivated.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  return <AlertsContent />;
}
