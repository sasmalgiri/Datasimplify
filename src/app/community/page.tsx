'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageCircle, TrendingUp, Shield, Lightbulb, BarChart3,
  BookOpen, Users, ChevronRight, Plus, Loader2,
} from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useAuth } from '@/lib/auth';
import { FORUM_CATEGORIES } from '@/lib/forumCategories';
import type { ForumThread, ForumCategorySummary } from '@/lib/supabaseData';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { CreateThreadModal } from '@/components/forum/CreateThreadModal';

/* ------------------------------------------------------------------ */
/*  Icon + color maps                                                  */
/* ------------------------------------------------------------------ */

const iconMap: Record<string, React.ReactNode> = {
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
  Lightbulb: <Lightbulb className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  BookOpen: <BookOpen className="w-5 h-5" />,
  MessageCircle: <MessageCircle className="w-5 h-5" />,
};

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  emerald: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/30', badge: 'bg-emerald-400/20 text-emerald-300' },
  blue:    { bg: 'bg-blue-400/10',    text: 'text-blue-400',    border: 'border-blue-400/30',    badge: 'bg-blue-400/20 text-blue-300' },
  purple:  { bg: 'bg-purple-400/10',  text: 'text-purple-400',  border: 'border-purple-400/30',  badge: 'bg-purple-400/20 text-purple-300' },
  red:     { bg: 'bg-red-400/10',     text: 'text-red-400',     border: 'border-red-400/30',     badge: 'bg-red-400/20 text-red-300' },
  amber:   { bg: 'bg-amber-400/10',   text: 'text-amber-400',   border: 'border-amber-400/30',   badge: 'bg-amber-400/20 text-amber-300' },
  gray:    { bg: 'bg-gray-400/10',    text: 'text-gray-400',    border: 'border-gray-400/30',    badge: 'bg-gray-400/20 text-gray-300' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, ForumCategorySummary>>({});
  const [categoryThreads, setCategoryThreads] = useState<Record<string, ForumThread[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch category summaries on mount
  useEffect(() => {
    async function fetchSummaries() {
      try {
        const res = await fetch('/api/forum?action=category_summaries');
        const json = await res.json();
        if (json.success && json.data) {
          const map: Record<string, ForumCategorySummary> = {};
          for (const s of json.data) {
            map[s.category] = s;
          }
          setSummaries(map);
        }
      } catch {
        // silently fail — summaries will show 0
      } finally {
        setInitialLoading(false);
      }
    }
    fetchSummaries();
  }, []);

  // Lazy-load threads when category expands
  const loadCategoryThreads = useCallback(async (categoryId: string) => {
    if (categoryThreads[categoryId] || loadingCategories.has(categoryId)) return;

    setLoadingCategories((prev) => new Set(prev).add(categoryId));
    try {
      const res = await fetch(`/api/forum?action=threads&category=${categoryId}&limit=5`);
      const json = await res.json();
      if (json.success) {
        setCategoryThreads((prev) => ({ ...prev, [categoryId]: json.data || [] }));
      }
    } catch {
      // silently fail
    } finally {
      setLoadingCategories((prev) => {
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });
    }
  }, [categoryThreads, loadingCategories]);

  const handleExpand = (categoryId: string) => {
    const next = expandedTopic === categoryId ? null : categoryId;
    setExpandedTopic(next);
    if (next) {
      loadCategoryThreads(next);
      setTimeout(() => {
        document.getElementById(next)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const handleThreadCreated = (threadId: string) => {
    setShowCreateModal(false);
    router.push(`/community/thread/${threadId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Breadcrumb customTitle="Community" />
          <div className="flex items-center justify-between mt-4 mb-3">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-emerald-400" />
              <h1 className="text-3xl md:text-4xl font-bold">Community Forum</h1>
            </div>
            {user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-sm font-semibold transition text-white"
              >
                <Plus className="w-4 h-4" />
                New Thread
              </button>
            )}
          </div>
          <p className="text-gray-400 text-lg max-w-2xl">
            Join the CryptoReportKit community. Discuss market analysis, trading strategies, DeFi, security, and more with fellow crypto enthusiasts.
          </p>
          <div className="flex items-center gap-6 mt-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-400" /> Community</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-emerald-400" /> 6 forums</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-400" /> Active daily</span>
          </div>
        </div>
      </div>

      {/* Forum Topics */}
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {FORUM_CATEGORIES.map((cat) => {
            const c = colorMap[cat.color];
            const summary = summaries[cat.id];
            return (
              <button
                key={cat.id}
                onClick={() => handleExpand(cat.id)}
                className={`${c.bg} ${c.border} border rounded-lg p-3 text-center hover:brightness-125 transition-all`}
              >
                <div className={`${c.text} flex justify-center mb-1.5`}>
                  {iconMap[cat.iconName]}
                </div>
                <span className="text-xs font-medium text-gray-300">{cat.title.split(' &')[0].split(',')[0]}</span>
                {summary && (
                  <p className="text-[10px] text-gray-500 mt-1">{summary.thread_count} threads</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Topic Cards */}
        <div className="space-y-4">
          {FORUM_CATEGORIES.map((cat) => {
            const c = colorMap[cat.color];
            const isExpanded = expandedTopic === cat.id;
            const summary = summaries[cat.id];
            const threads = categoryThreads[cat.id];
            const isLoading = loadingCategories.has(cat.id);

            return (
              <div key={cat.id} id={cat.id} className="scroll-mt-20">
                {/* Topic Header */}
                <button
                  onClick={() => handleExpand(cat.id)}
                  className={`w-full bg-gray-800/60 border ${isExpanded ? c.border : 'border-gray-700/50'} rounded-xl p-5 hover:border-gray-600 transition-all text-left`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`${c.bg} ${c.text} p-2.5 rounded-lg`}>
                        {iconMap[cat.iconName]}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">{cat.title}</h2>
                        <p className="text-sm text-gray-400 mt-0.5">{cat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="hidden md:flex items-center gap-4">
                        <span>{summary?.thread_count || 0} threads</span>
                        <span>{summary?.reply_count || 0} replies</span>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </button>

                {/* Thread List */}
                {isExpanded && (
                  <div className="mt-1 bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                      </div>
                    ) : threads && threads.length > 0 ? (
                      <>
                        {threads.map((thread) => (
                          <ThreadCard key={thread.id} thread={thread} categoryColor={cat.color} />
                        ))}
                        {(summary?.thread_count || 0) > 5 && (
                          <div className="px-5 py-3 border-t border-gray-700/30 bg-gray-800/20">
                            <Link
                              href={`/community?category=${cat.id}`}
                              className={`text-xs ${c.text} font-medium flex items-center gap-1 hover:underline`}
                            >
                              View all {summary?.thread_count} threads
                            </Link>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="px-5 py-8 text-center">
                        <p className="text-gray-500 text-sm mb-3">No threads yet. Be the first to start a discussion!</p>
                        {user ? (
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="text-emerald-400 text-sm font-medium hover:underline"
                          >
                            Create Thread
                          </button>
                        ) : (
                          <Link href="/login" className="text-emerald-400 text-sm font-medium hover:underline">
                            Sign in to post
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Community Guidelines + CTA */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Community Guidelines</h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">1.</span>
                <span>Be respectful — no personal attacks or harassment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">2.</span>
                <span>No financial advice — share analysis, not guarantees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">3.</span>
                <span>No spam or self-promotion without context</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">4.</span>
                <span>Report scams and suspicious links immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">5.</span>
                <span>Use the correct forum for your topic</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-900 border border-emerald-400/20 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Join the Conversation</h3>
              <p className="text-sm text-gray-400 mb-6">
                Sign up for free to post threads, reply to discussions, and connect with the crypto community.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-sm font-semibold transition text-white"
                >
                  Start a Thread
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-sm font-semibold transition text-white"
                >
                  Get Started Free
                </Link>
              )}
              <Link
                href="/blog"
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition text-gray-300"
              >
                Read Our Blog
              </Link>
            </div>
          </div>
        </div>

        {/* Trending Topics */}
        <div className="mt-10 bg-gray-800/30 border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Trending Topics</h3>
          <div className="flex flex-wrap gap-2">
            {[
              'Bitcoin Price Analysis', 'Ethereum Merge', 'DeFi Yields', 'Crypto Tax 2026',
              'Fear & Greed Index', 'Altcoin Season', 'Smart Contract Security', 'RWA Tokenization',
              'AI Crypto Tokens', 'Stablecoin Regulation', 'Layer 2 Scaling', 'Portfolio Strategy',
              'Crypto Staking', 'NFT Market', 'Bitcoin ETF', 'Meme Coins', 'On-Chain Analytics',
              'Whale Tracking', 'Liquidation Heatmap', 'Confluence Trading',
            ].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-gray-700/50 border border-gray-600/30 rounded-full text-xs text-gray-300 hover:border-emerald-400/40 hover:text-emerald-300 cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Create Thread Modal */}
      <CreateThreadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        defaultCategory={expandedTopic || undefined}
        onCreated={handleThreadCreated}
      />

      {/* Loading overlay for initial fetch */}
      {initialLoading && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      )}
    </div>
  );
}
