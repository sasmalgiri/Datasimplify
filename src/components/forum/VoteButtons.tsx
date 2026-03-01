'use client';

import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface VoteButtonsProps {
  likes: number;
  dislikes: number;
  userVote?: 'like' | 'dislike' | null;
  onVote: (voteType: 'like' | 'dislike') => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function VoteButtons({ likes, dislikes, userVote, onVote, disabled, size = 'sm' }: VoteButtonsProps) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onVote('like')}
        disabled={disabled}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${textSize} ${
          userVote === 'like'
            ? 'bg-emerald-400/20 text-emerald-400'
            : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={disabled ? 'Sign in to vote' : 'Like'}
      >
        <ThumbsUp className={iconSize} />
        <span>{likes}</span>
      </button>
      <button
        onClick={() => onVote('dislike')}
        disabled={disabled}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${textSize} ${
          userVote === 'dislike'
            ? 'bg-red-400/20 text-red-400'
            : 'text-gray-500 hover:text-red-400 hover:bg-red-400/10'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={disabled ? 'Sign in to vote' : 'Dislike'}
      >
        <ThumbsDown className={iconSize} />
        <span>{dislikes}</span>
      </button>
    </div>
  );
}
