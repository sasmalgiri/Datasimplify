'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  ArrowLeft,
  ChevronUp,
  Clock,
  Hammer,
  CheckCircle,
  Sparkles,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';

interface FeatureRequest {
  id: string;
  reportType: string;
  coins: string[];
  timeframe: string;
  purpose: string;
  details: string | null;
  votesCount: number;
  status: 'pending' | 'planned' | 'building' | 'shipped';
  createdAt: string;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Under Review',
    icon: Clock,
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
  },
  planned: {
    label: 'Planned',
    icon: Sparkles,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  building: {
    label: 'In Progress',
    icon: Hammer,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  shipped: {
    label: 'Shipped',
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  watchlist: 'Watchlist Report',
  screener: 'Coin Screener',
  correlation: 'Correlation Matrix',
  portfolio: 'Portfolio Tracker',
  technical: 'Technical Indicators',
  comparison: 'Coin Comparison',
  market_overview: 'Market Overview',
  other: 'Custom Template',
};

// Sample changelog entries (in production, fetch from API)
const CHANGELOG = [
  {
    date: '2025-01-17',
    title: 'Report Kits Launch',
    description: '6 pre-built Report Kits now available for download.',
    type: 'feature',
  },
  {
    date: '2025-01-15',
    title: 'Status Page',
    description: 'New system status page for API health monitoring.',
    type: 'feature',
  },
  {
    date: '2025-01-10',
    title: '2000+ Coins Support',
    description: 'Expanded market data to support over 2000 cryptocurrencies.',
    type: 'improvement',
  },
];

export default function RoadmapPage() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'changelog'>('requests');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/template-request');
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (requestId: string) => {
    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, votesCount: r.votesCount + 1 } : r
      )
    );

    try {
      const response = await fetch('/api/template-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        // Revert on error
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, votesCount: r.votesCount - 1 } : r
          )
        );
      }
    } catch {
      // Revert on error
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, votesCount: r.votesCount - 1 } : r
        )
      );
    }
  };

  const filteredRequests = statusFilter
    ? requests.filter((r) => r.status === statusFilter)
    : requests;

  const statusCounts = requests.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <FreeNavbar />
      <Breadcrumb />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Product Roadmap</h1>
          <p className="text-gray-400">
            See what we&apos;re building and vote on feature requests. Popular requests get
            prioritized!
          </p>
        </div>

        {/* CTA */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Have a template idea?
              </h2>
              <p className="text-gray-400 text-sm">
                Request a new Excel Report Kit and help shape what we build next.
              </p>
            </div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Request Template
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === 'requests'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Feature Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === 'changelog'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Changelog
          </button>
        </div>

        {activeTab === 'requests' && (
          <>
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setStatusFilter(null)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  statusFilter === null
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                All ({requests.length})
              </button>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
                    statusFilter === status
                      ? `${config.bg} ${config.color} border ${config.border}`
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <config.icon className="w-3.5 h-3.5" />
                  {config.label} ({statusCounts[status] || 0})
                </button>
              ))}
            </div>

            {/* Requests List */}
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No feature requests yet.</p>
                <p className="text-gray-500 text-sm">
                  Be the first to request a template!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  const statusConfig = STATUS_CONFIG[request.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={request.id}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex gap-4">
                        {/* Vote Button */}
                        <button
                          onClick={() => handleVote(request.id)}
                          className="flex flex-col items-center gap-1 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <ChevronUp className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm font-medium text-white">
                            {request.votesCount}
                          </span>
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-medium text-white">
                              {REPORT_TYPE_LABELS[request.reportType] ||
                                request.reportType}
                            </h3>
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>

                          {request.coins.length > 0 && (
                            <p className="text-sm text-gray-400 mb-1">
                              Coins: {request.coins.join(', ')}
                            </p>
                          )}

                          {request.details && (
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {request.details}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{request.timeframe} timeframe</span>
                            <span>|</span>
                            <span>
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'changelog' && (
          <div className="space-y-4">
            {CHANGELOG.map((entry, index) => (
              <div
                key={index}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-white">{entry.title}</h3>
                  <span className="text-xs text-gray-500">{entry.date}</span>
                </div>
                <p className="text-sm text-gray-400">{entry.description}</p>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${
                    entry.type === 'feature'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}
                >
                  {entry.type === 'feature' ? 'New Feature' : 'Improvement'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-500">
            <Link href="/templates" className="hover:text-white transition-colors">
              Report Kits
            </Link>
            <span>|</span>
            <Link href="/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <span>|</span>
            <a
              href="mailto:feedback@cryptoreportkit.com"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Send Feedback
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
