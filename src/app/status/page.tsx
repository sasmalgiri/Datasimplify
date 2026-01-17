'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'checking';
  lastCheck: Date | null;
  responseTime: number | null;
  message?: string;
}

const SERVICES = [
  { id: 'coingecko', name: 'CoinGecko API', endpoint: '/api/crypto?limit=1' },
  { id: 'binance', name: 'Binance API', endpoint: '/api/charts/candles?symbol=BTCUSDT&interval=1h&limit=1' },
  { id: 'sentiment', name: 'Fear & Greed Index', endpoint: '/api/sentiment' },
  { id: 'defi', name: 'DeFi Llama', endpoint: '/api/defi/llama?limit=1' },
];

function StatusIcon({ status }: { status: ServiceStatus['status'] }) {
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

function StatusBadge({ status }: { status: ServiceStatus['status'] }) {
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
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICES.map((s) => ({
      name: s.name,
      status: 'checking',
      lastCheck: null,
      responseTime: null,
    }))
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const checkServices = async () => {
    setIsRefreshing(true);

    const results = await Promise.all(
      SERVICES.map(async (service) => {
        const start = Date.now();
        try {
          const response = await fetch(service.endpoint, {
            method: 'GET',
            cache: 'no-store',
          });
          const responseTime = Date.now() - start;

          if (response.ok) {
            return {
              name: service.name,
              status: responseTime > 5000 ? 'degraded' : 'operational',
              lastCheck: new Date(),
              responseTime,
            } as ServiceStatus;
          } else {
            return {
              name: service.name,
              status: 'down',
              lastCheck: new Date(),
              responseTime: null,
              message: `HTTP ${response.status}`,
            } as ServiceStatus;
          }
        } catch {
          return {
            name: service.name,
            status: 'down',
            lastCheck: new Date(),
            responseTime: null,
            message: 'Connection failed',
          } as ServiceStatus;
        }
      })
    );

    setServices(results);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkServices();
    // Refresh every 60 seconds
    const interval = setInterval(checkServices, 60000);
    return () => clearInterval(interval);
  }, []);

  const overallStatus = services.every((s) => s.status === 'operational')
    ? 'operational'
    : services.some((s) => s.status === 'down')
      ? 'down'
      : services.some((s) => s.status === 'degraded')
        ? 'degraded'
        : 'checking';

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
          <p className="text-gray-600">Real-time status of CryptoReportKit services and APIs</p>
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
              onClick={checkServices}
              disabled={isRefreshing}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Data Services</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {services.map((service, index) => (
              <div key={index} className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon status={service.status} />
                  <div>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    {service.message && (
                      <p className="text-sm text-gray-500">{service.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {service.responseTime && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{service.responseTime}ms</span>
                    </div>
                  )}
                  <StatusBadge status={service.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CryptoSheets Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">About Template Data</h3>
          <p className="text-blue-800 text-sm mb-3">
            CryptoReportKit templates use CryptoSheets formulas to fetch data. Template data
            availability depends on your CryptoSheets account status.
          </p>
          <a
            href="https://cryptosheets.com/status"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Check CryptoSheets Status
            <ExternalLink className="w-4 h-4" />
          </a>
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
