'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Eye, Pin, Loader2, Send, Lock } from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { VoteButtons } from '@/components/forum/VoteButtons';
import { useAuth } from '@/lib/auth';
import { getCategoryById } from '@/lib/forumCategories';
import type { ForumThread, ForumReply } from '@/lib/supabaseData';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ThreadDetailPage() {
  const params = useParams<{ threadId: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Vote state
  const [threadVote, setThreadVote] = useState<'like' | 'dislike' | null>(null);
  const [replyVotes, setReplyVotes] = useState<Record<string, 'like' | 'dislike'>>({});

  // Reply form
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState('');

  const threadId = params.threadId;

  // Fetch thread + replies
  const fetchThread = useCallback(async () => {
    try {
      const res = await fetch(`/api/forum/${threadId}?repliesLimit=100`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Thread not found');
        return;
      }

      setThread(json.data.thread);
      setReplies(json.data.replies || []);
    } catch {
      setError('Failed to load thread');
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  // Fetch user's existing votes
  useEffect(() => {
    if (!user || !threadId) return;
    async function fetchVotes() {
      try {
        const res = await fetch(`/api/forum/${threadId}?action=votes&userId=${user!.id}`);
        const json = await res.json();
        if (json.data?.threadVote) setThreadVote(json.data.threadVote);
        if (json.data?.replyVotes) setReplyVotes(json.data.replyVotes);
      } catch {
        // silently fail
      }
    }
    fetchVotes();
  }, [user, threadId]);

  // Vote handler
  const handleVote = async (targetType: 'thread' | 'reply', targetId: string, voteType: 'like' | 'dislike') => {
    if (!user) return;

    // Optimistic update
    if (targetType === 'thread' && thread) {
      const currentVote = threadVote;
      if (currentVote === voteType) {
        setThreadVote(null);
        setThread({ ...thread, likes: thread.likes - (voteType === 'like' ? 1 : 0), dislikes: thread.dislikes - (voteType === 'dislike' ? 1 : 0) });
      } else {
        setThreadVote(voteType);
        setThread({
          ...thread,
          likes: thread.likes + (voteType === 'like' ? 1 : 0) - (currentVote === 'like' ? 1 : 0),
          dislikes: thread.dislikes + (voteType === 'dislike' ? 1 : 0) - (currentVote === 'dislike' ? 1 : 0),
        });
      }
    } else if (targetType === 'reply') {
      const currentVote = replyVotes[targetId] || null;
      setReplyVotes((prev) => {
        const next = { ...prev };
        if (currentVote === voteType) {
          delete next[targetId];
        } else {
          next[targetId] = voteType;
        }
        return next;
      });
      setReplies((prev) =>
        prev.map((r) => {
          if (r.id !== targetId) return r;
          return {
            ...r,
            likes: r.likes + (voteType === 'like' ? 1 : 0) - (currentVote === 'like' ? 1 : 0),
            dislikes: r.dislikes + (voteType === 'dislike' ? 1 : 0) - (currentVote === 'dislike' ? 1 : 0),
          };
        })
      );
    }

    // Fire API call
    await fetch('/api/forum/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'vote',
        ...(targetType === 'thread' ? { threadId: targetId } : { replyId: targetId }),
        voteType,
      }),
    });
  };

  // Pin handler
  const handlePin = async () => {
    if (!thread) return;
    const res = await fetch('/api/forum/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pin', threadId: thread.id, pin: !thread.is_pinned }),
    });
    const json = await res.json();
    if (json.success) {
      setThread({ ...thread, is_pinned: !thread.is_pinned });
    }
  };

  // Reply handler
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError('');

    if (!replyBody.trim()) {
      setReplyError('Reply cannot be empty');
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/forum/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', body: replyBody }),
      });
      const json = await res.json();

      if (!json.success) {
        setReplyError(json.error || 'Failed to post reply');
        return;
      }

      setReplyBody('');
      // Refetch to get the new reply with author info
      fetchThread();
    } catch {
      setReplyError('Network error');
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        <FreeNavbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        <FreeNavbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-400 text-lg mb-4">{error || 'Thread not found'}</p>
          <Link href="/community" className="text-emerald-400 hover:underline text-sm">
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  const category = getCategoryById(thread.category);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb customTitle={thread.title} />
          <Link
            href="/community"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-400 transition-colors mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {category?.title || 'Community'}
          </Link>
        </div>

        {/* Thread Card */}
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 mb-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{thread.author?.avatar_emoji || '👤'}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {thread.author?.display_name || 'Anonymous'}
                </span>
                {thread.author?.is_verified && (
                  <span className="text-emerald-400 text-xs">✓ Verified</span>
                )}
                {thread.is_pinned && (
                  <span className="px-1.5 py-0.5 bg-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase rounded flex items-center gap-0.5">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}
                {thread.is_locked && (
                  <span className="px-1.5 py-0.5 bg-red-400/20 text-red-300 text-[10px] font-bold uppercase rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">{timeAgo(thread.created_at)}</span>
            </div>
          </div>

          {/* Title + Body */}
          <h1 className="text-xl font-bold text-white mb-4">{thread.title}</h1>
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
            {thread.body}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
            <VoteButtons
              likes={thread.likes}
              dislikes={thread.dislikes}
              userVote={threadVote}
              onVote={(vt) => handleVote('thread', thread.id, vt)}
              disabled={!user}
              size="md"
            />
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {thread.reply_count}</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {thread.view_count.toLocaleString()}</span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handlePin}
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Pin className="w-3.5 h-3.5" />
                  {thread.is_pinned ? 'Unpin' : 'Pin'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Replies ({replies.length})
          </h2>

          {replies.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center">No replies yet. Be the first to respond!</p>
          ) : (
            <div className="space-y-3">
              {replies.map((reply) => (
                <div key={reply.id} className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{reply.author?.avatar_emoji || '👤'}</span>
                    <span className="text-sm font-medium text-white">
                      {reply.author?.display_name || 'Anonymous'}
                    </span>
                    {reply.author?.is_verified && (
                      <span className="text-emerald-400 text-xs">✓</span>
                    )}
                    <span className="text-xs text-gray-500">{timeAgo(reply.created_at)}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                    {reply.body}
                  </p>
                  <VoteButtons
                    likes={reply.likes}
                    dislikes={reply.dislikes}
                    userVote={replyVotes[reply.id] || null}
                    onVote={(vt) => handleVote('reply', reply.id, vt)}
                    disabled={!user}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Form */}
        {thread.is_locked ? (
          <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4 text-center">
            <Lock className="w-5 h-5 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">This thread is locked. No new replies can be added.</p>
          </div>
        ) : user ? (
          <form onSubmit={handleReply} className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">Reply</label>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Share your thoughts..."
              maxLength={5000}
              rows={4}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 resize-none mb-2"
            />
            {replyError && <p className="text-sm text-red-400 mb-2">{replyError}</p>}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">{replyBody.length}/5000</span>
              <button
                type="submit"
                disabled={submittingReply || !replyBody.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 rounded-lg text-sm font-semibold text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingReply ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm mb-3">Sign in to join the discussion</p>
            <Link
              href="/login"
              className="inline-block px-5 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-sm font-semibold text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
