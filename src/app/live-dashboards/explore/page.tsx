'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { GLOW_CARD_CLASSES } from '@/lib/live-dashboard/theme';
import {
  Search,
  ArrowRight,
  Zap,
  Key,
  TrendingUp,
  BarChart3,
  Filter,
  ArrowLeft,
  ChevronDown,
  Loader2,
  Database,
  Globe,
  Shield,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Protocol {
  rank: number;
  name: string;
  slug: string;
  symbol: string;
  tvl: number;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  category: string;
  chains: string[];
  logo: string;
  mcap: number;
}

type SortKey = 'tvl' | 'name' | 'change_1d';
type CategoryFilter =
  | 'All'
  | 'Lending'
  | 'Dexes'
  | 'Yield'
  | 'Bridge'
  | 'CDP'
  | 'Liquid Staking'
  | 'Derivatives';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORIES: CategoryFilter[] = [
  'All',
  'Lending',
  'Dexes',
  'Yield',
  'Bridge',
  'CDP',
  'Liquid Staking',
  'Derivatives',
];

const PAGE_SIZE = 30;

const POPULAR_COINS = [
  { id: 'bitcoin', name: 'Bitcoin' },
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'solana', name: 'Solana' },
  { id: 'cardano', name: 'Cardano' },
  { id: 'polkadot', name: 'Polkadot' },
  { id: 'avalanche-2', name: 'Avalanche' },
  { id: 'chainlink', name: 'Chainlink' },
  { id: 'matic-network', name: 'Polygon' },
  { id: 'cosmos', name: 'Cosmos' },
  { id: 'uniswap', name: 'Uniswap' },
  { id: 'aave', name: 'Aave' },
  { id: 'litecoin', name: 'Litecoin' },
  { id: 'near', name: 'Near' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism' },
  { id: 'dogecoin', name: 'Dogecoin' },
  { id: 'shiba-inu', name: 'Shiba Inu' },
  { id: 'pepe', name: 'Pepe' },
  { id: 'sui', name: 'Sui' },
  { id: 'aptos', name: 'Aptos' },
];

const CATEGORY_LINKS = [
  { label: 'DeFi Overview', href: '/live-dashboards/defi-tracker', emoji: '\u{1f4ca}' },
  { label: 'DEX Analytics', href: '/live-dashboards/dex-analytics', emoji: '\u{1f504}' },
  { label: 'Stablecoins', href: '/live-dashboards/stablecoin-monitor', emoji: '\u{1f4b5}' },
  { label: 'Layer 2', href: '/live-dashboards/layer-2-scorecard', emoji: '\u{1f680}' },
  { label: 'NFT & Gaming', href: '/live-dashboards/nft-gaming', emoji: '\u{1f3ae}' },
  { label: 'Derivatives', href: '/live-dashboards/derivatives-overview', emoji: '\u{1f4c8}' },
  { label: 'Bitcoin', href: '/live-dashboards/bitcoin', emoji: '\u{20bf}' },
  { label: 'Ethereum', href: '/live-dashboards/ethereum', emoji: '\u{1f4a0}' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTvl(tvl: number): string {
  if (tvl >= 1e12) return `$${(tvl / 1e12).toFixed(1)}T`;
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(1)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(1)}M`;
  if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(1)}K`;
  return `$${tvl.toFixed(0)}`;
}

function formatChange(change: number | null): string {
  if (change == null) return '--';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

function changeColor(change: number | null): string {
  if (change == null) return 'text-gray-500';
  return change >= 0 ? 'text-emerald-400' : 'text-red-400';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ExplorePage() {
  // ── State ──
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [sortKey, setSortKey] = useState<SortKey>('tvl');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ── Debounce search (300ms) ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, categoryFilter, sortKey]);

  // ── Fetch protocols on mount ──
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/live-dashboard/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoints: ['defillama_protocols'] }),
        });

        if (!res.ok) throw new Error(`Failed to fetch protocols (${res.status})`);

        const data = await res.json();
        if (!cancelled) {
          setProtocols(data.defiProtocols || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load protocols');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Filtered & sorted protocols ──
  const filteredProtocols = useMemo(() => {
    let list = [...protocols];

    // Category filter
    if (categoryFilter !== 'All') {
      list = list.filter((p) => {
        const cat = (p.category || '').toLowerCase();
        const filter = categoryFilter.toLowerCase();
        return cat.includes(filter) || cat === filter;
      });
    }

    // Search filter
    if (debouncedSearch) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(debouncedSearch) ||
          p.symbol.toLowerCase().includes(debouncedSearch) ||
          p.slug.toLowerCase().includes(debouncedSearch),
      );
    }

    // Sort
    switch (sortKey) {
      case 'tvl':
        list.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'change_1d':
        list.sort((a, b) => (b.change_1d ?? -Infinity) - (a.change_1d ?? -Infinity));
        break;
    }

    return list;
  }, [protocols, categoryFilter, debouncedSearch, sortKey]);

  const visibleProtocols = filteredProtocols.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProtocols.length;

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <FreeNavbar />
      <Breadcrumb />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/live-dashboards"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-emerald-400 transition text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Live Dashboards
        </Link>

        {/* ───────────────────────────── Hero ───────────────────────────── */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/5 border border-emerald-400/10 text-emerald-400 text-sm mb-6">
            <Zap className="w-4 h-4" />
            Auto-Generated Analytics
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 tracking-tight">
            Explore{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              5,000+
            </span>{' '}
            Dashboards
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Auto-generated analytics for every DeFi protocol and cryptocurrency.
            No SQL required.
          </p>

          {/* Global search bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search protocols, coins, or categories..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/20 transition text-base"
            />
          </div>
        </section>

        {/* ──────────────────────────── Stats Bar ──────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: <Database className="w-5 h-5" />, label: '4,000+ Protocols', color: 'text-emerald-400' },
            { icon: <Globe className="w-5 h-5" />, label: '500+ Coins', color: 'text-blue-400' },
            { icon: <Shield className="w-5 h-5" />, label: '100% Free Protocol Data', color: 'text-purple-400' },
            { icon: <Zap className="w-5 h-5" />, label: 'No SQL Required', color: 'text-amber-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
            >
              <div className={`p-2 rounded-lg bg-white/[0.04] shrink-0 ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-white font-semibold text-sm">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* ────────────────────── Protocol Section ─────────────────────── */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-emerald-400 rounded-full" />
            <div>
              <h2 className="text-2xl font-bold text-white">DeFi Protocol Dashboards</h2>
              <p className="text-gray-500 text-sm mt-1">
                Free — No API key required. Powered by DeFi Llama.
              </p>
            </div>
          </div>

          {/* Toolbar: categories + sort */}
          <div className="mt-6 mb-6 flex flex-col md:flex-row md:items-center gap-4">
            {/* Category chips */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <Filter className="w-4 h-4 text-gray-600 shrink-0" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    categoryFilter === cat
                      ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                      : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-gray-600 text-xs">Sort:</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-white/[0.04] border border-white/[0.1] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-400/40 cursor-pointer"
              >
                <option value="tvl" className="bg-gray-900">
                  TVL (High to Low)
                </option>
                <option value="name" className="bg-gray-900">
                  Name (A-Z)
                </option>
                <option value="change_1d" className="bg-gray-900">
                  24h Change
                </option>
              </select>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mr-3" />
              <span className="text-gray-400">Loading protocols...</span>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <p className="text-red-400 mb-2">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-sm text-gray-400 hover:text-white underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredProtocols.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">
                No protocols found matching your search or filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setCategoryFilter('All');
                }}
                className="mt-3 text-sm text-emerald-400 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Protocol grid */}
          {!loading && !error && filteredProtocols.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleProtocols.map((protocol) => (
                  <Link
                    key={protocol.slug}
                    href={`/live-dashboards/protocol/${protocol.slug}`}
                    className={`group relative ${GLOW_CARD_CLASSES} p-5 flex flex-col`}
                  >
                    {/* FREE badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/15 text-emerald-400 border border-emerald-400/20 uppercase tracking-wider">
                        Free
                      </span>
                    </div>

                    {/* Protocol header */}
                    <div className="flex items-center gap-3 mb-3">
                      {protocol.logo ? (
                        <img
                          src={protocol.logo}
                          alt={protocol.name}
                          className="w-9 h-9 rounded-lg bg-white/[0.06]"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-gray-500 text-sm font-bold">
                          {protocol.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-semibold text-sm group-hover:text-emerald-400 transition truncate">
                          {protocol.name}
                        </h3>
                        {protocol.symbol && (
                          <span className="text-gray-600 text-xs uppercase">
                            {protocol.symbol}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* TVL + change */}
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider block mb-0.5">
                          TVL
                        </span>
                        <span className="text-white font-bold text-lg">
                          {formatTvl(protocol.tvl)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider block mb-0.5">
                          24h
                        </span>
                        <span
                          className={`font-semibold text-sm ${changeColor(protocol.change_1d)}`}
                        >
                          {formatChange(protocol.change_1d)}
                        </span>
                      </div>
                    </div>

                    {/* Category */}
                    {protocol.category && (
                      <span className="inline-block self-start px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-400 text-[10px] font-medium mb-3">
                        {protocol.category}
                      </span>
                    )}

                    {/* Chains */}
                    {protocol.chains && protocol.chains.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                        {protocol.chains.map((chain) => (
                          <span
                            key={chain}
                            className="px-2 py-0.5 rounded-md bg-white/[0.04] text-gray-500 text-[10px]"
                          >
                            {chain}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>

              {/* Show More button */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white text-sm font-medium transition"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Show More ({filteredProtocols.length - visibleCount} remaining)
                  </button>
                </div>
              )}

              {/* Count summary */}
              <p className="text-center text-gray-600 text-xs mt-4">
                Showing {visibleProtocols.length} of {filteredProtocols.length} protocols
              </p>
            </>
          )}
        </section>

        {/* ──────────────────── Coin Section ────────────────────────────── */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-400 rounded-full" />
            <div>
              <h2 className="text-2xl font-bold text-white">Cryptocurrency Dashboards</h2>
              <p className="text-gray-500 text-sm mt-1">
                Requires CoinGecko API key (free tier works)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {POPULAR_COINS.filter((coin) => {
              if (!debouncedSearch) return true;
              return (
                coin.name.toLowerCase().includes(debouncedSearch) ||
                coin.id.toLowerCase().includes(debouncedSearch)
              );
            }).map((coin) => (
              <Link
                key={coin.id}
                href={`/live-dashboards/coin/${coin.id}`}
                className={`group relative ${GLOW_CARD_CLASSES} p-4 flex flex-col items-center text-center`}
              >
                {/* API KEY badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/15 text-amber-400 border border-amber-400/20 uppercase tracking-wider">
                    API Key
                  </span>
                </div>

                <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center mb-3">
                  <Key className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold text-sm group-hover:text-blue-400 transition">
                  {coin.name}
                </h3>
                <span className="text-gray-600 text-[10px] mt-1">
                  {coin.id}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ──────────────── Category Quick Links ───────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-purple-400 rounded-full" />
            <div>
              <h2 className="text-2xl font-bold text-white">Quick Launch</h2>
              <p className="text-gray-500 text-sm mt-1">
                Pre-built dashboards for popular categories
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORY_LINKS.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`group ${GLOW_CARD_CLASSES} p-5 flex items-center gap-3`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-sm group-hover:text-emerald-400 transition truncate">
                    {cat.label}
                  </h3>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* ──────────────────────── Footer ──────────────────────────────── */}
        <div className="text-center py-10 border-t border-white/[0.04]">
          <div className="flex items-center justify-center gap-1.5 text-gray-600 text-[10px] mb-4">
            <Shield className="w-3 h-3" />
            Protocol data from DeFi Llama (free). Coin data requires a CoinGecko API key.
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Want these dashboards in Excel? Download our professionally styled data templates.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/live-dashboards"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/20 text-emerald-400 text-sm font-medium transition"
            >
              <BarChart3 className="w-4 h-4" />
              All Dashboards
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white text-sm font-medium transition"
            >
              <TrendingUp className="w-4 h-4" />
              Excel Templates
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
