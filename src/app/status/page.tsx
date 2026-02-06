'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

interface ServiceStatus {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  message?: string;
  lastCheck: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: ServiceStatus[];
  scheduled_exports?: {
    last_run: string | null;
    next_run: string | null;
    active_count: number;
  };
}

function StatusIcon({ status }: { status: 'operational' | 'degraded' | 'down' | 'checking' }) {
  switch (status) {
    case 'operational':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'degraded':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case 'down':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'checking':
      return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
  }
}

function StatusBadge({ status }: { status: 'operational' | 'degraded' | 'down' | 'checking' }) {
  const colors = {
    operational: 'bg-green-100 text-green-800 border-green-200',
    degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    down: 'bg-red-100 text-red-800 border-red-200',
    checking: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const labels = {
    operational: 'Operational',
    degraded: 'Degraded',
    down: 'Down',
    checking: 'Checking...',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/health', {
        cache: 'no-store',
      });

      if (!response.ok && response.status !== 503) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: HealthResponse = await response.json();
      setHealth(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    // Refresh every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const overallStatus = isLoading
    ? 'checking'
    : health?.status === 'healthy'
      ? 'operational'
      : health?.status === 'degraded'
        ? 'degraded'
        : 'down';

  const overallMessages = {
    operational: 'All systems operational',
    degraded: 'Some services experiencing issues',
    down: 'Service disruption detected',
    checking: 'Checking system status...',
  };

  const overallColors = {
    operational: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
    checking: 'bg-gray-400',
  };

  const formatRelativeTime = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FreeNavbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Status</h1>
          <p className="text-gray-600">
            Real-time status of CryptoReportKit services
            {health?.version && (
              <span className="text-gray-400 ml-2">v{health.version}</span>
            )}
          </p>
        </div>

        {/* Overall Status Banner */}
        <div
          className={`${overallColors[overallStatus]} rounded-xl p-6 text-white mb-8 transition-colors`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {overallStatus === 'checking' ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : overallStatus === 'operational' ? (
                <CheckCircle className="w-8 h-8" />
              ) : overallStatus === 'degraded' ? (
                <AlertCircle className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
              <div>
                <h2 className="text-xl font-semibold">{overallMessages[overallStatus]}</h2>
                {lastRefresh && (
                  <p className="text-sm opacity-80">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={checkHealth}
              disabled={isLoading}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
            <p className="font-medium">Failed to check status</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Services List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Core Services</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {isLoading && !health ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Checking services...
              </div>
            ) : health?.services ? (
              health.services.map((service, index) => (
                <div key={index} className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={service.status} />
                    <div>
                      <p className="font-medium text-gray-900">{service.service}</p>
                      {service.message && (
                        <p className="text-sm text-gray-500">{service.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {service.latency && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{service.latency}ms</span>
                      </div>
                    )}
                    <StatusBadge status={service.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                No service data available
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Exports Status */}
        {health?.scheduled_exports && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Scheduled Exports</h3>
            </div>
            <div className="px-4 py-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {health.scheduled_exports.active_count}
                  </p>
                  <p className="text-sm text-gray-500">Active Schedules</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatRelativeTime(health.scheduled_exports.last_run)}
                  </p>
                  <p className="text-sm text-gray-500">Last Run</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {health.scheduled_exports.next_run
                      ? new Date(health.scheduled_exports.next_run).toLocaleString()
                      : 'None scheduled'}
                  </p>
                  <p className="text-sm text-gray-500">Next Run</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CRK Add-in Info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-2">
                CryptoReportKit Add-in
              </h3>
              <p className="text-emerald-800 text-sm mb-3">
                CRK templates use BYOK (Bring Your Own Key) architecture.
                Your CoinGecko API key stays in your Excel file - we never see or store your keys.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/byok"
                  className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                >
                  BYOK Setup Guide
                </Link>
                <Link
                  href="/pricing"
                  className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                >
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="bg-gray-100 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 text-sm mb-4">
            If you are experiencing issues, please contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:support@cryptoreportkit.com"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              support@cryptoreportkit.com
            </a>
            <span className="hidden sm:inline text-gray-400">|</span>
            <Link href="/faq" className="text-emerald-600 hover:text-emerald-700 font-medium">
              View FAQ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
