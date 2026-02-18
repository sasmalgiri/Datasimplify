'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, GitFork, Eye, ArrowLeft, Loader2, LayoutGrid } from 'lucide-react';

// ─── Types ───
interface CommunityDashboard {
  id: string;
  author_name: string;
  author_avatar: string;
  dashboard_name: string;
  icon: string;
  description: string;
  widget_config: any;
  grid_columns: number;
  tags: string[];
  fork_count: number;
  view_count: number;
  created_at: string;
}

// ─── Constants ───
const ALL_TAGS = ['DeFi', 'Bitcoin', 'Portfolio', 'Trading', 'Whale', 'Meme', 'NFT', 'Analytics'] as const;
type TagFilter = (typeof ALL_TAGS)[number];

const SORT_OPTIONS = [
  { key: 'popular', label: 'Popular' },
  { key: 'recent', label: 'Recent' },
  { key: 'most_forked', label: 'Most Forked' },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]['key'];

const PAGE_SIZE = 12;

// ─── Helpers ───
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ─── Dashboard Card ───
function DashboardCard({
  dashboard,
  onFork,
  onView,
  isForkingId,
}: {
  dashboard: CommunityDashboard;
  onFork: (d: CommunityDashboard) => void;
  onView: (d: CommunityDashboard) => void;
  isForkingId: string | null;
}) {
  const isForking = isForkingId === dashboard.id;

  return (
    <div className="group bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl hover:border-emerald-400/20 hover:shadow-[0_0_30px_rgba(52,211,153,0.06)] transition-all duration-300 flex flex-col overflow-hidden">
      {/* Card header */}
      <div className="p-5 pb-0">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-3xl shrink-0">{dashboard.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate group-hover:text-emerald-400 transition">
              {dashboard.dashboard_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {dashboard.author_avatar ? (
                <img
                  src={dashboard.author_avatar}
                  alt={dashboard.author_name}
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center text-[8px] text-emerald-400 font-bold">
                  {dashboard.author_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-gray-500 truncate">{dashboard.author_name}</span>
              <span className="text-[10px] text-gray-700">&middot;</span>
              <span className="text-[10px] text-gray-600">{timeAgo(dashboard.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {dashboard.description}
        </p>

        {/* Tags */}
        {dashboard.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dashboard.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] border border-white/[0.06] text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="mt-auto border-t border-white/[0.04] px-5 py-3.5 flex items-center justify-between">
        {/* Stats */}
        <div className="flex items-center gap-4 text-[11px] text-gray-600">
          <span className="flex items-center gap-1">
            <GitFork className="w-3 h-3" />
            {formatCount(dashboard.fork_count)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatCount(dashboard.view_count)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFork(dashboard)}
            disabled={isForking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:bg-emerald-400/10 hover:border-emerald-400/25 hover:text-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isForking ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <GitFork className="w-3 h-3" />
            )}
            Fork
          </button>
          <button
            onClick={() => onView(dashboard)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/30 transition"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ───
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-24">
      <LayoutGrid className="w-12 h-12 mx-auto mb-4 text-gray-700" />
      <h3 className="text-xl font-bold text-white mb-2">
        {hasFilters ? 'No dashboards match your filters' : 'No community dashboards yet'}
      </h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
        {hasFilters
          ? 'Try adjusting your search terms or removing some tag filters.'
          : 'Be the first to share your custom dashboard with the community!'}
      </p>
    </div>
  );
}

// ─── Main Page ───
export default function CommunityDashboardsPage() {
  const router = useRouter();

  // Filter / sort / pagination state
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagFilter[]>([]);
  const [sort, setSort] = useState<SortKey>('popular');
  const [page, setPage] = useState(1);

  // Data state
  const [dashboards, setDashboards] = useState<CommunityDashboard[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forkingId, setForkingId] = useState<string | null>(null);

  // ─── Fetch dashboards ───
  const fetchDashboards = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params = new URLSearchParams();
        if (search.trim()) params.set('search', search.trim());
        if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
        params.set('sort', sort);
        params.set('page', String(pageNum));
        params.set('limit', String(PAGE_SIZE));

        const res = await fetch(`/api/live-dashboard/community?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch dashboards (${res.status})`);
        }

        const data = await res.json();
        const items: CommunityDashboard[] = data.dashboards ?? data.data ?? [];
        const total: number = data.total ?? data.totalCount ?? items.length;

        if (append) {
          setDashboards((prev) => [...prev, ...items]);
        } else {
          setDashboards(items);
        }
        setTotalCount(total);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, selectedTags, sort]
  );

  // Re-fetch when filters change (reset to page 1)
  useEffect(() => {
    setPage(1);
    fetchDashboards(1, false);
  }, [fetchDashboards]);

  // ─── Tag toggle ───
  const toggleTag = (tag: TagFilter) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // ─── Load more ───
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDashboards(nextPage, true);
  };

  const hasMore = dashboards.length < totalCount;

  // ─── Fork handler ───
  const handleFork = async (dashboard: CommunityDashboard) => {
    setForkingId(dashboard.id);
    try {
      // Increment fork count on server
      await fetch('/api/live-dashboard/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dashboard.id, action: 'fork' }),
      });

      // Save config to localStorage for builder
      localStorage.setItem(
        'crk-custom-builder',
        JSON.stringify({
          widgets: dashboard.widget_config,
          gridColumns: dashboard.grid_columns,
          forkedFrom: dashboard.id,
        })
      );

      router.push('/live-dashboards/custom/builder');
    } catch {
      // Still navigate even if the PATCH fails — the fork data is saved locally
      localStorage.setItem(
        'crk-custom-builder',
        JSON.stringify({
          widgets: dashboard.widget_config,
          gridColumns: dashboard.grid_columns,
          forkedFrom: dashboard.id,
        })
      );
      router.push('/live-dashboards/custom/builder');
    } finally {
      setForkingId(null);
    }
  };

  // ─── View handler ───
  const handleView = (dashboard: CommunityDashboard) => {
    router.push(`/live-dashboards/custom/${dashboard.id}`);
  };

  const hasFilters = search.trim().length > 0 || selectedTags.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ─── Back link ─── */}
        <Link
          href="/live-dashboards"
          className="inline-flex items-center gap-1.5 text-gray-600 hover:text-white text-sm mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          All Dashboards
        </Link>

        {/* ─── Hero Section ─── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/5 border border-emerald-400/10 text-emerald-400 text-sm mb-6">
            <LayoutGrid className="w-4 h-4" />
            Community Gallery
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Community{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Dashboards
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Discover and fork dashboards built by the community. Find the perfect layout for your workflow,
            or share your own creations.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dashboards by name, description, or author..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 focus:border-emerald-400/30 transition"
            />
          </div>
        </div>

        {/* ─── Tag Filter Chips ─── */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {ALL_TAGS.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  isActive
                    ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                    : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
                }`}
              >
                {tag}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600 hover:text-gray-400 transition"
            >
              Clear all
            </button>
          )}
        </div>

        {/* ─── Sort Tabs ─── */}
        <div className="flex items-center justify-center gap-1 mb-10">
          <div className="inline-flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setSort(option.key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  sort === option.key
                    ? 'bg-emerald-400/15 text-emerald-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Error State ─── */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
            <button
              onClick={() => fetchDashboards(1, false)}
              className="ml-3 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ─── Loading Skeleton ─── */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 animate-pulse"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.06]" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/[0.06] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-white/[0.04] rounded w-full mb-2" />
                <div className="h-3 bg-white/[0.04] rounded w-2/3 mb-4" />
                <div className="flex gap-1.5 mb-4">
                  <div className="h-5 bg-white/[0.04] rounded-full w-12" />
                  <div className="h-5 bg-white/[0.04] rounded-full w-16" />
                </div>
                <div className="border-t border-white/[0.04] pt-3 flex justify-between">
                  <div className="h-4 bg-white/[0.04] rounded w-20" />
                  <div className="h-7 bg-white/[0.04] rounded-lg w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Dashboard Grid ─── */}
        {!loading && dashboards.length > 0 && (
          <>
            {/* Result count */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-600">
                Showing {dashboards.length} of {totalCount} dashboard{totalCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dashboards.map((dashboard) => (
                <DashboardCard
                  key={dashboard.id}
                  dashboard={dashboard}
                  onFork={handleFork}
                  onView={handleView}
                  isForkingId={forkingId}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:bg-white/[0.08] hover:text-white font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Dashboards'
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── Empty State ─── */}
        {!loading && dashboards.length === 0 && !error && (
          <EmptyState hasFilters={hasFilters} />
        )}

        {/* ─── Footer ─── */}
        <div className="text-center pt-16 pb-8 border-t border-white/[0.04] mt-16">
          <p className="text-gray-600 text-xs">
            Community dashboards are shared by users. Use them as starting points for your own builds.
          </p>
        </div>
      </main>
    </div>
  );
}
