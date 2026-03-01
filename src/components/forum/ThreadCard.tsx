'use client';

import Link from 'next/link';
import { MessageCircle, Eye, Pin } from 'lucide-react';
import type { ForumThread } from '@/lib/supabaseData';

interface ThreadCardProps {
  thread: ForumThread;
  categoryColor: string;
  showCategory?: boolean;
}

const colorBadgeMap: Record<string, string> = {
  emerald: 'bg-emerald-400/20 text-emerald-300',
  blue: 'bg-blue-400/20 text-blue-300',
  purple: 'bg-purple-400/20 text-purple-300',
  red: 'bg-red-400/20 text-red-300',
  amber: 'bg-amber-400/20 text-amber-300',
  gray: 'bg-gray-400/20 text-gray-300',
};

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

export function ThreadCard({ thread, categoryColor }: ThreadCardProps) {
  const badge = colorBadgeMap[categoryColor] || colorBadgeMap.gray;

  return (
    <Link
      href={`/community/thread/${thread.id}`}
      className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-700/30 transition-colors border-b border-gray-700/30 last:border-b-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        {thread.is_pinned && (
          <span className={`${badge} text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5`}>
            <Pin className="w-2.5 h-2.5" />
            Pinned
          </span>
        )}
        <div className="min-w-0">
          <span className={`text-sm ${thread.is_pinned ? 'font-semibold text-white' : 'text-gray-300'} line-clamp-1`}>
            {thread.title}
          </span>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
            <span>
              {thread.author?.avatar_emoji || '👤'} {thread.author?.display_name || 'Anonymous'}
            </span>
            {thread.author?.is_verified && (
              <span className="text-emerald-400">✓</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0 ml-4">
        <span className="hidden sm:flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          {thread.reply_count}
        </span>
        <span className="hidden md:flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {thread.view_count.toLocaleString()}
        </span>
        <span className="text-gray-600 w-14 text-right">{timeAgo(thread.last_activity_at)}</span>
      </div>
    </Link>
  );
}
