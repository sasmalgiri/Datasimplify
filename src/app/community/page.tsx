'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Progress bar segment component using refs to avoid inline style warnings
function ProgressSegment({ percentage, colorClass }: { percentage: number; colorClass: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.width = `${percentage}%`;
    }
  }, [percentage]);
  return <div ref={ref} className={`${colorClass} transition-all duration-500`} />;
}
import {
  Users,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Target,
  Award,
  Flame,
  Star,
  Search,
  Plus,
  Share2,
  Crown,
  Medal,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Bookmark,
  MoreHorizontal,
  RefreshCw,
  UserPlus,
  Eye,
} from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';

// Types matching Supabase schema
interface CommunityPrediction {
  id: string;
  user_id: string;
  coin_id: string;
  coin_symbol: string;
  coin_name: string;
  prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  target_price?: number;
  current_price?: number;
  timeframe: '24h' | '7d' | '30d';
  confidence: number;
  reasoning?: string;
  outcome: 'pending' | 'correct' | 'incorrect';
  likes: number;
  dislikes: number;
  comments_count: number;
  expires_at: string;
  created_at: string;
  user?: UserPredictionStats;
}

interface UserPredictionStats {
  id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy: number;
  current_streak: number;
  best_streak: number;
  points: number;
  rank: number;
  badges: string[];
  followers: number;
  following: number;
  is_verified: boolean;
  created_at: string;
}

interface CommunityStats {
  total_predictions: number;
  active_predictors: number;
  bullish_percent: number;
  bearish_percent: number;
  neutral_percent: number;
  avg_accuracy: number;
}

interface PredictionContest {
  id: string;
  title: string;
  description?: string;
  contest_type: 'weekly' | 'monthly' | 'special';
  prize: string;
  prize_amount?: number;
  min_predictions: number;
  starts_at: string;
  ends_at: string;
  status: 'upcoming' | 'active' | 'ended';
  participants_count: number;
}

interface TrendingCoin {
  coin_id: string;
  coin_symbol: string;
  coin_name: string;
  predictions_count: number;
  bullish_percent: number;
}

// API Fetching Functions
async function fetchCommunityData<T>(action: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const searchParams = new URLSearchParams({ action, ...params });
    const response = await fetch(`/api/community?${searchParams}`);
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    console.error(`Failed to fetch ${action}:`, result.error);
    return null;
  } catch (error) {
    console.error(`Error fetching ${action}:`, error);
    return null;
  }
}

async function submitPrediction(data: {
  userId: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  targetPrice?: number;
  currentPrice?: number;
  timeframe: '24h' | '7d' | '30d';
  confidence: number;
  reasoning?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_prediction', ...data })
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function votePrediction(predictionId: string, userId: string, voteType: 'like' | 'dislike'): Promise<boolean> {
  try {
    const response = await fetch('/api/community/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', predictionId, userId, voteType })
    });
    const result = await response.json();
    return result.success;
  } catch {
    return false;
  }
}

async function followUser(followerId: string, followingId: string): Promise<{ success: boolean; isFollowing: boolean }> {
  try {
    const response = await fetch('/api/community/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'follow', followerId, followingId })
    });
    return await response.json();
  } catch {
    return { success: false, isFollowing: false };
  }
}

// Components
function PredictionCard({ prediction, onVote, currentUserId }: {
  prediction: CommunityPrediction;
  onVote: (id: string, type: 'like' | 'dislike') => void;
  currentUserId?: string;
}) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localLikes, setLocalLikes] = useState(prediction.likes);
  const [localDislikes, setLocalDislikes] = useState(prediction.dislikes);

  const getPredictionStyle = () => {
    switch (prediction.prediction) {
      case 'BULLISH':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' };
      case 'BEARISH':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' };
      default:
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' };
    }
  };

  const style = getPredictionStyle();
  const timeAgo = getTimeAgo(prediction.created_at);
  const user = prediction.user;

  const handleLike = async () => {
    if (!currentUserId) return;

    if (liked) {
      setLiked(false);
      setLocalLikes(prev => prev - 1);
    } else {
      setLiked(true);
      setLocalLikes(prev => prev + 1);
      if (disliked) {
        setDisliked(false);
        setLocalDislikes(prev => prev - 1);
      }
    }
    onVote(prediction.id, 'like');
  };

  const handleDislike = async () => {
    if (!currentUserId) return;

    if (disliked) {
      setDisliked(false);
      setLocalDislikes(prev => prev - 1);
    } else {
      setDisliked(true);
      setLocalDislikes(prev => prev + 1);
      if (liked) {
        setLiked(false);
        setLocalLikes(prev => prev - 1);
      }
    }
    onVote(prediction.id, 'dislike');
  };

  return (
    <div className={`bg-gray-800 rounded-xl border ${style.border} p-4 hover:bg-gray-800/80 transition`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
            {user?.avatar_emoji || '🎯'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{user?.display_name || 'Anonymous'}</span>
              {user?.is_verified && (
                <CheckCircle className="w-4 h-4 text-blue-400" />
              )}
              {user?.rank && user.rank <= 100 && (
                <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-400">
                  #{user.rank}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{user?.accuracy?.toFixed(1) || 0}% accuracy</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
        <button type="button" className="p-1 hover:bg-gray-700 rounded" title="More options" aria-label="More options">
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Prediction Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${style.bg} ${style.text} mb-3`}>
        {prediction.prediction === 'BULLISH' ? (
          <TrendingUp className="w-4 h-4" />
        ) : prediction.prediction === 'BEARISH' ? (
          <TrendingDown className="w-4 h-4" />
        ) : (
          <Minus className="w-4 h-4" />
        )}
        <span className="font-semibold">{prediction.prediction}</span>
        <span className="text-sm opacity-75">{prediction.confidence}% confident</span>
      </div>

      {/* Coin & Target */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{prediction.coin_symbol}</span>
          <span className="text-gray-500">{prediction.coin_name}</span>
        </div>
        {prediction.target_price && prediction.current_price && (
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">Target:</span>
            <span className={style.text}>${prediction.target_price.toLocaleString()}</span>
            <span className="text-gray-600">
              ({prediction.prediction === 'BULLISH' ? '+' : ''}
              {((prediction.target_price - prediction.current_price) / prediction.current_price * 100).toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      {/* Reasoning */}
      {prediction.reasoning && (
        <p className="text-gray-300 text-sm mb-3">{prediction.reasoning}</p>
      )}

      {/* Timeframe & Outcome */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-700 rounded text-gray-400">
          <Clock className="w-3 h-3" />
          {prediction.timeframe}
        </span>
        {prediction.outcome === 'correct' && (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/20 rounded text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            Correct
          </span>
        )}
        {prediction.outcome === 'incorrect' && (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-500/20 rounded text-red-400">
            <XCircle className="w-3 h-3" />
            Incorrect
          </span>
        )}
        {prediction.outcome === 'pending' && (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-500/20 rounded text-yellow-400">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm ${liked ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
            title="Like this prediction"
            aria-label={`Like this prediction, ${localLikes} likes`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{localLikes}</span>
          </button>
          <button
            type="button"
            onClick={handleDislike}
            className={`flex items-center gap-1.5 text-sm ${disliked ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'}`}
            title="Dislike this prediction"
            aria-label={`Dislike this prediction, ${localDislikes} dislikes`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{localDislikes}</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300"
            title="View comments"
            aria-label={`View comments, ${prediction.comments_count} comments`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{prediction.comments_count}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSaved(!saved)}
            className={`p-1.5 rounded ${saved ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
            title={saved ? 'Remove bookmark' : 'Bookmark prediction'}
            aria-label={saved ? 'Remove bookmark' : 'Bookmark prediction'}
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button type="button" className="p-1.5 rounded text-gray-500 hover:text-gray-300" title="Share prediction" aria-label="Share prediction">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaderboardCard({ user, rank, onFollow, currentUserId }: {
  user: UserPredictionStats;
  rank: number;
  onFollow: (userId: string) => void;
  currentUserId?: string;
}) {
  const [isFollowing, setIsFollowing] = useState(false);

  const getRankStyle = () => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (rank === 2) return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
    if (rank === 3) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-gray-700/50 text-gray-400 border-gray-600';
  };

  const getRankIcon = () => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return <span className="text-gray-500 font-mono">#{rank}</span>;
  };

  const handleFollow = async () => {
    if (!currentUserId || currentUserId === user.user_id) return;
    setIsFollowing(!isFollowing);
    onFollow(user.user_id);
  };

  return (
    <div className={`flex items-center gap-4 p-3 rounded-lg border ${getRankStyle()} hover:bg-gray-800/50 transition`}>
      <div className="w-8 flex justify-center">
        {getRankIcon()}
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
        {user.avatar_emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{user.display_name}</span>
          {user.is_verified && <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{user.accuracy?.toFixed(1) || 0}% accuracy</span>
          <span>•</span>
          <span>{user.total_predictions} predictions</span>
          <span>•</span>
          <span>{user.followers || 0} followers</span>
        </div>
      </div>
      <div className="text-right flex items-center gap-3">
        <div>
          <div className="flex items-center gap-1 text-emerald-400">
            <Zap className="w-4 h-4" />
            <span className="font-bold">{(user.points || 0).toLocaleString()}</span>
          </div>
          {user.current_streak > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-400">
              <Flame className="w-3 h-3" />
              <span>{user.current_streak} streak</span>
            </div>
          )}
        </div>
        {currentUserId && currentUserId !== user.user_id && (
          <button
            type="button"
            onClick={handleFollow}
            className={`p-2 rounded-lg transition ${
              isFollowing
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
            title={isFollowing ? `Unfollow ${user.display_name}` : `Follow ${user.display_name}`}
            aria-label={isFollowing ? `Unfollow ${user.display_name}` : `Follow ${user.display_name}`}
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function CommunityMeter({ stats }: { stats: CommunityStats }) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-emerald-400" />
        Community Sentiment
      </h3>

      {/* Sentiment Bar */}
      <div className="mb-4">
        <div className="flex h-4 rounded-full overflow-hidden">
          <ProgressSegment percentage={stats.bullish_percent} colorClass="bg-emerald-500" />
          <ProgressSegment percentage={stats.neutral_percent} colorClass="bg-yellow-500" />
          <ProgressSegment percentage={stats.bearish_percent} colorClass="bg-red-500" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-gray-400">Bullish</span>
          <span className="text-emerald-400 font-bold">{stats.bullish_percent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-400">Neutral</span>
          <span className="text-yellow-400 font-bold">{stats.neutral_percent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-400">Bearish</span>
          <span className="text-red-400 font-bold">{stats.bearish_percent}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-700">
        <div>
          <p className="text-gray-500 text-sm">Total Predictions</p>
          <p className="text-xl font-bold text-white">{stats.total_predictions.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Active Predictors</p>
          <p className="text-xl font-bold text-white">{stats.active_predictors.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function PredictionSubmitModal({ isOpen, onClose, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    coinId: string;
    coinSymbol: string;
    coinName: string;
    prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    timeframe: '24h' | '7d' | '30d';
    confidence: number;
    reasoning: string;
  }) => void;
}) {
  const [coin, setCoin] = useState('bitcoin');
  const [prediction, setPrediction] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('BULLISH');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [confidence, setConfidence] = useState(70);
  const [reasoning, setReasoning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
  ];

  const selectedCoin = coins.find(c => c.id === coin) || coins[0];

  const handleSubmit = async () => {
    if (!reasoning.trim()) return;
    setSubmitting(true);
    onSubmit({
      coinId: selectedCoin.id,
      coinSymbol: selectedCoin.symbol,
      coinName: selectedCoin.name,
      prediction,
      timeframe,
      confidence,
      reasoning
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-800">
          <h2 className="text-xl font-bold text-white">Submit Prediction</h2>
          <p className="text-gray-400 text-sm mt-1">Share your analysis with the community</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Coin Selection */}
          <div>
            <label htmlFor="coin-select" className="block text-sm font-medium text-gray-300 mb-2">Select Coin</label>
            <select
              id="coin-select"
              value={coin}
              onChange={(e) => setCoin(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              aria-label="Select cryptocurrency"
            >
              {coins.map(c => (
                <option key={c.id} value={c.id}>{c.symbol} - {c.name}</option>
              ))}
            </select>
          </div>

          {/* Prediction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Prediction</label>
            <div className="grid grid-cols-3 gap-2">
              {(['BULLISH', 'BEARISH', 'NEUTRAL'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrediction(p)}
                  className={`py-2 px-4 rounded-lg border transition ${
                    prediction === p
                      ? p === 'BULLISH'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : p === 'BEARISH'
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                      : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {p === 'BULLISH' && <TrendingUp className="w-4 h-4 inline mr-1" />}
                  {p === 'BEARISH' && <TrendingDown className="w-4 h-4 inline mr-1" />}
                  {p === 'NEUTRAL' && <Minus className="w-4 h-4 inline mr-1" />}
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
            <div className="grid grid-cols-3 gap-2">
              {(['24h', '7d', '30d'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeframe(t)}
                  className={`py-2 px-4 rounded-lg border transition ${
                    timeframe === t
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Confidence */}
          <div>
            <label htmlFor="confidence-slider" className="block text-sm font-medium text-gray-300 mb-2">
              Confidence: {confidence}%
            </label>
            <input
              id="confidence-slider"
              type="range"
              min="50"
              max="100"
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
              aria-label={`Confidence level: ${confidence}%`}
              title={`Confidence level: ${confidence}%`}
            />
          </div>

          {/* Reasoning */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Analysis <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Share your reasoning (technical analysis, on-chain data, news, etc.)"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-24 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{reasoning.length}/500 characters</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex gap-3 sticky bottom-0 bg-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reasoning.trim() || submitting}
            className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Prediction'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContestCard({ contest }: { contest: PredictionContest }) {
  const getTypeStyle = () => {
    switch (contest.contest_type) {
      case 'weekly': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'monthly': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'special': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getTimeRemaining = () => {
    const end = new Date(contest.ends_at);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} days left`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hours left`;
  };

  return (
    <div className={`bg-gray-800 rounded-xl border p-4 ${getTypeStyle()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          <span className="text-xs uppercase font-bold">{contest.contest_type}</span>
        </div>
        <span className="text-xs px-2 py-1 bg-gray-700 rounded">{getTimeRemaining()}</span>
      </div>
      <h4 className="text-white font-semibold mb-2">{contest.title}</h4>
      {contest.description && (
        <p className="text-gray-400 text-sm mb-2">{contest.description}</p>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{contest.participants_count} participants</span>
        <span className="font-bold">{contest.prize}</span>
      </div>
    </div>
  );
}

// Helper functions
function getTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Main Page
export default function CommunityPage() {
  const [predictions, setPredictions] = useState<CommunityPrediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserPredictionStats[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [contests, setContests] = useState<PredictionContest[]>([]);
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'contests'>('feed');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterCoin, setFilterCoin] = useState('all');
  const [filterPrediction, setFilterPrediction] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock user ID for demo - in production this would come from auth
  const currentUserId = 'demo-user-123';

  const fetchAllData = useCallback(async () => {
    setLoading(true);

    const [predictionsData, leaderboardData, statsData, contestsData, trendingData] = await Promise.all([
      fetchCommunityData<CommunityPrediction[]>('predictions', { limit: '30' }),
      fetchCommunityData<UserPredictionStats[]>('leaderboard', { limit: '20' }),
      fetchCommunityData<CommunityStats>('stats'),
      fetchCommunityData<PredictionContest[]>('contests'),
      fetchCommunityData<TrendingCoin[]>('trending', { limit: '5' }),
    ]);

    if (predictionsData) setPredictions(predictionsData);
    if (leaderboardData) setLeaderboard(leaderboardData);
    if (statsData) setStats(statsData);
    if (contestsData) setContests(contestsData);
    if (trendingData) setTrending(trendingData);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleVote = async (predictionId: string, voteType: 'like' | 'dislike') => {
    await votePrediction(predictionId, currentUserId, voteType);
  };

  const handleFollow = async (userId: string) => {
    await followUser(currentUserId, userId);
  };

  const handleSubmitPrediction = async (data: {
    coinId: string;
    coinSymbol: string;
    coinName: string;
    prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    timeframe: '24h' | '7d' | '30d';
    confidence: number;
    reasoning: string;
  }) => {
    const result = await submitPrediction({
      userId: currentUserId,
      ...data
    });

    if (result.success) {
      // Refresh predictions
      const newPredictions = await fetchCommunityData<CommunityPrediction[]>('predictions', { limit: '30' });
      if (newPredictions) setPredictions(newPredictions);
    }
  };

  const filteredPredictions = predictions.filter(p => {
    const matchesCoin = filterCoin === 'all' || p.coin_id === filterCoin;
    const matchesPrediction = filterPrediction === 'all' || p.prediction === filterPrediction;
    const matchesSearch = searchQuery === '' ||
      (p.user?.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.coin_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCoin && matchesPrediction && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-900/30 via-gray-900 to-purple-900/30 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Users className="w-10 h-10 text-emerald-400" />
                Community Predictions
              </h1>
              <p className="text-gray-400 text-lg">
                Share predictions, compete with traders, and track your accuracy
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchAllData}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 rounded-xl hover:bg-emerald-600 transition font-semibold"
              >
                <Plus className="w-5 h-5" />
                Submit Prediction
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-sm">Total Predictions</p>
                <p className="text-2xl font-bold text-white">{stats.total_predictions.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-sm">Active Predictors</p>
                <p className="text-2xl font-bold text-white">{stats.active_predictors.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-sm">Community Accuracy</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.avg_accuracy}%</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-sm">Bullish Sentiment</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.bullish_percent}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
          {[
            { id: 'feed', label: 'Prediction Feed', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
            { id: 'contests', label: 'Contests', icon: <Award className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeTab === 'feed' && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search predictions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white"
                      aria-label="Search predictions"
                      title="Search predictions"
                    />
                  </div>
                  <select
                    value={filterCoin}
                    onChange={(e) => setFilterCoin(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    aria-label="Filter by coin"
                    title="Filter by coin"
                  >
                    <option value="all">All Coins</option>
                    <option value="bitcoin">Bitcoin</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="solana">Solana</option>
                  </select>
                  <select
                    value={filterPrediction}
                    onChange={(e) => setFilterPrediction(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    aria-label="Filter by prediction type"
                    title="Filter by prediction type"
                  >
                    <option value="all">All Signals</option>
                    <option value="BULLISH">Bullish</option>
                    <option value="BEARISH">Bearish</option>
                    <option value="NEUTRAL">Neutral</option>
                  </select>
                </div>

                {/* Predictions Feed */}
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4" />
                        <div className="h-3 bg-gray-700 rounded w-full mb-2" />
                        <div className="h-3 bg-gray-700 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : filteredPredictions.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-12 text-center">
                    <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No predictions found</h3>
                    <p className="text-gray-400 mb-4">Be the first to share your analysis!</p>
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="px-6 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition"
                    >
                      Submit Prediction
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPredictions.map(pred => (
                      <PredictionCard
                        key={pred.id}
                        prediction={pred}
                        onVote={handleVote}
                        currentUserId={currentUserId}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">How Rankings Work</h3>
                  <p className="text-gray-400 text-sm">
                    Points are earned based on prediction accuracy, confidence level, and streaks.
                    Higher accuracy predictions with higher confidence earn more points.
                    Follow top predictors to learn from the best!
                  </p>
                </div>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : (
                  leaderboard.map((user, i) => (
                    <LeaderboardCard
                      key={user.user_id}
                      user={user}
                      rank={i + 1}
                      onFollow={handleFollow}
                      currentUserId={currentUserId}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'contests' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl border border-yellow-500/30 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Active Contests</h3>
                      <p className="text-gray-400">Compete for prizes and glory</p>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4" />
                        <div className="h-3 bg-gray-700 rounded w-full" />
                      </div>
                    ))}
                  </div>
                ) : contests.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-12 text-center">
                    <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No active contests</h3>
                    <p className="text-gray-400">Check back soon for new competitions!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {contests.map(contest => (
                      <ContestCard key={contest.id} contest={contest} />
                    ))}
                  </div>
                )}

                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h4 className="font-semibold text-white mb-4">Contest Rules</h4>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      Submit predictions during the contest period
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      Minimum 5 predictions required to qualify
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      Winners determined by accuracy and points
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      Prizes distributed within 48 hours of contest end
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Sentiment */}
            {stats && <CommunityMeter stats={stats} />}

            {/* Top Predictors */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Top Predictors
              </h3>
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((user, i) => (
                  <div key={user.user_id} className="flex items-center gap-3">
                    <span className={`w-6 text-center font-bold ${
                      i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-600'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      {user.avatar_emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{user.display_name}</p>
                      <p className="text-gray-500 text-xs">{user.accuracy?.toFixed(1) || 0}% accuracy</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFollow(user.user_id)}
                      className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition"
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('leaderboard')}
                className="block w-full text-center text-emerald-400 text-sm mt-4 hover:underline"
              >
                View Full Leaderboard
              </button>
            </div>

            {/* Trending Coins */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                Trending in Community
              </h3>
              <div className="space-y-3">
                {(trending.length > 0 ? trending : [
                  { coin_symbol: 'BTC', coin_name: 'Bitcoin', bullish_percent: 72, predictions_count: 156 },
                  { coin_symbol: 'ETH', coin_name: 'Ethereum', bullish_percent: 68, predictions_count: 124 },
                  { coin_symbol: 'SOL', coin_name: 'Solana', bullish_percent: 78, predictions_count: 98 },
                ]).map(coin => (
                  <div key={coin.coin_symbol} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white w-12">{coin.coin_symbol}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">{coin.predictions_count} predictions</span>
                        <span className={coin.bullish_percent >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                          {coin.bullish_percent}% bullish
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <ProgressSegment
                          percentage={coin.bullish_percent}
                          colorClass={`h-full ${coin.bullish_percent >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      <PredictionSubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleSubmitPrediction}
      />
    </div>
  );
}
