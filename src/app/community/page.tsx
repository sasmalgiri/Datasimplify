'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ChevronDown,
  Filter,
  Search,
  Plus,
  Share2,
  Bell,
  Crown,
  Medal,
  Zap,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Send,
  Heart,
  Bookmark,
  Flag,
  MoreHorizontal,
} from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';

// Types
interface UserPrediction {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRank: number;
  userAccuracy: number;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  targetPrice?: number;
  currentPrice: number;
  timeframe: '24h' | '7d' | '30d';
  confidence: number;
  reasoning: string;
  timestamp: string;
  expiresAt: string;
  likes: number;
  dislikes: number;
  comments: number;
  isVerified: boolean;
  outcome?: 'correct' | 'incorrect' | 'pending';
}

interface LeaderboardUser {
  rank: number;
  userId: string;
  userName: string;
  avatar: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  streak: number;
  points: number;
  badges: string[];
  isVerified: boolean;
  joinedAt: string;
  followers: number;
}

interface CommunityStats {
  totalPredictions: number;
  activePredictors: number;
  bullishPercent: number;
  bearishPercent: number;
  neutralPercent: number;
  avgAccuracy: number;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
}

// Mock data generators
const generateMockPredictions = (): UserPrediction[] => {
  const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 43250 },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 2280 },
    { id: 'solana', symbol: 'SOL', name: 'Solana', price: 98 },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.52 },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', price: 35 },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', price: 7.2 },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', price: 14.5 },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.082 },
  ];

  const users = [
    { id: '1', name: 'CryptoWhale', avatar: '🐋', rank: 1, accuracy: 78 },
    { id: '2', name: 'BTCMaxi', avatar: '₿', rank: 2, accuracy: 75 },
    { id: '3', name: 'DeFiDegen', avatar: '🦄', rank: 3, accuracy: 72 },
    { id: '4', name: 'AltSeason', avatar: '🚀', rank: 5, accuracy: 70 },
    { id: '5', name: 'ChartMaster', avatar: '📊', rank: 8, accuracy: 68 },
    { id: '6', name: 'HODLer4Life', avatar: '💎', rank: 12, accuracy: 65 },
    { id: '7', name: 'TradingBot', avatar: '🤖', rank: 15, accuracy: 63 },
    { id: '8', name: 'MoonShot', avatar: '🌙', rank: 20, accuracy: 60 },
  ];

  const predictions: ('BULLISH' | 'BEARISH' | 'NEUTRAL')[] = ['BULLISH', 'BEARISH', 'NEUTRAL'];
  const timeframes: ('24h' | '7d' | '30d')[] = ['24h', '7d', '30d'];
  const outcomes: ('correct' | 'incorrect' | 'pending')[] = ['correct', 'incorrect', 'pending'];

  const reasonings = [
    'Strong support level holding, expecting bounce',
    'Breaking out of accumulation zone with increasing volume',
    'RSI oversold, due for a reversal',
    'Whale accumulation detected on-chain',
    'Bearish divergence on 4H chart',
    'Funding rates extremely negative, squeeze incoming',
    'Major resistance ahead, expecting rejection',
    'Bullish engulfing on daily, trend reversal likely',
    'Network activity increasing, bullish signal',
    'Fear & Greed at extreme fear, historically a buy signal',
  ];

  return Array.from({ length: 20 }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const coin = coins[Math.floor(Math.random() * coins.length)];
    const prediction = predictions[Math.floor(Math.random() * predictions.length)];
    const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
    const hoursAgo = Math.floor(Math.random() * 48);

    const targetMultiplier = prediction === 'BULLISH'
      ? 1 + (Math.random() * 0.15)
      : prediction === 'BEARISH'
        ? 1 - (Math.random() * 0.15)
        : 1 + (Math.random() * 0.02 - 0.01);

    return {
      id: `pred-${i}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userRank: user.rank,
      userAccuracy: user.accuracy,
      coinId: coin.id,
      coinSymbol: coin.symbol,
      coinName: coin.name,
      prediction,
      targetPrice: Math.round(coin.price * targetMultiplier * 100) / 100,
      currentPrice: coin.price,
      timeframe,
      confidence: Math.floor(Math.random() * 30) + 60,
      reasoning: reasonings[Math.floor(Math.random() * reasonings.length)],
      timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + (timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720) * 60 * 60 * 1000).toISOString(),
      likes: Math.floor(Math.random() * 150),
      dislikes: Math.floor(Math.random() * 20),
      comments: Math.floor(Math.random() * 30),
      isVerified: user.rank <= 10,
      outcome: hoursAgo > 24 ? outcomes[Math.floor(Math.random() * 2)] : 'pending',
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateLeaderboard = (): LeaderboardUser[] => {
  const names = [
    'CryptoWhale', 'BTCMaxi', 'DeFiDegen', 'ChartMaster', 'AltSeason',
    'HODLer4Life', 'TradingBot', 'MoonShot', 'DiamondHands', 'WhaleCatcher',
    'BullRunner', 'BearHunter', 'SwingTrader', 'ScalpKing', 'PatternPro',
    'VolumeMaster', 'SupportHero', 'TrendFollower', 'BreakoutKing', 'DipBuyer',
  ];

  const avatars = ['🐋', '₿', '🦄', '📊', '🚀', '💎', '🤖', '🌙', '🎯', '⚡', '🔥', '👑', '🏆', '💰', '📈'];
  const badges = ['🏆 Top 10', '🔥 Hot Streak', '💎 Diamond', '🎯 Accurate', '⭐ Verified', '🐋 Whale'];

  return names.map((name, i) => ({
    rank: i + 1,
    userId: `user-${i}`,
    userName: name,
    avatar: avatars[i % avatars.length],
    totalPredictions: Math.floor(Math.random() * 200) + 50,
    correctPredictions: 0,
    accuracy: Math.max(50, 85 - i * 1.5 + Math.random() * 5),
    streak: Math.max(0, 15 - i + Math.floor(Math.random() * 5)),
    points: Math.floor((1000 - i * 40) * (1 + Math.random() * 0.2)),
    badges: badges.slice(0, Math.max(1, 4 - Math.floor(i / 5))),
    isVerified: i < 10,
    joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    followers: Math.floor(Math.random() * 5000) + 100,
  })).map(user => ({
    ...user,
    correctPredictions: Math.floor(user.totalPredictions * user.accuracy / 100),
  }));
};

const generateCommunityStats = (predictions: UserPrediction[]): CommunityStats => {
  const bullish = predictions.filter(p => p.prediction === 'BULLISH').length;
  const bearish = predictions.filter(p => p.prediction === 'BEARISH').length;
  const neutral = predictions.filter(p => p.prediction === 'NEUTRAL').length;
  const total = predictions.length;

  return {
    totalPredictions: 12847,
    activePredictors: 1523,
    bullishPercent: Math.round((bullish / total) * 100),
    bearishPercent: Math.round((bearish / total) * 100),
    neutralPercent: Math.round((neutral / total) * 100),
    avgAccuracy: 67,
  };
};

// Components
function PredictionCard({ prediction, onLike, onComment }: {
  prediction: UserPrediction;
  onLike: () => void;
  onComment: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

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
  const timeAgo = getTimeAgo(prediction.timestamp);

  return (
    <div className={`bg-gray-800 rounded-xl border ${style.border} p-4 hover:bg-gray-800/80 transition`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
            {prediction.userAvatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{prediction.userName}</span>
              {prediction.isVerified && (
                <CheckCircle className="w-4 h-4 text-blue-400" />
              )}
              <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-400">
                #{prediction.userRank}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{prediction.userAccuracy}% accuracy</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
        <button type="button" className="p-1 hover:bg-gray-700 rounded">
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
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{prediction.coinSymbol}</span>
          <span className="text-gray-500">{prediction.coinName}</span>
        </div>
        {prediction.targetPrice && (
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">Target:</span>
            <span className={style.text}>${prediction.targetPrice.toLocaleString()}</span>
            <span className="text-gray-600">
              ({prediction.prediction === 'BULLISH' ? '+' : ''}
              {((prediction.targetPrice - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      {/* Reasoning */}
      <p className="text-gray-300 text-sm mb-3">{prediction.reasoning}</p>

      {/* Timeframe & Outcome */}
      <div className="flex items-center gap-3 mb-4">
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
            onClick={() => { setLiked(!liked); onLike(); }}
            className={`flex items-center gap-1.5 text-sm ${liked ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{prediction.likes + (liked ? 1 : 0)}</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{prediction.dislikes}</span>
          </button>
          <button
            type="button"
            onClick={onComment}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{prediction.comments}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSaved(!saved)}
            className={`p-1.5 rounded ${saved ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button type="button" className="p-1.5 rounded text-gray-500 hover:text-gray-300">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaderboardCard({ user, rank }: { user: LeaderboardUser; rank: number }) {
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

  return (
    <div className={`flex items-center gap-4 p-3 rounded-lg border ${getRankStyle()} hover:bg-gray-800/50 transition`}>
      <div className="w-8 flex justify-center">
        {getRankIcon()}
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
        {user.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{user.userName}</span>
          {user.isVerified && <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{user.accuracy.toFixed(1)}% accuracy</span>
          <span>•</span>
          <span>{user.totalPredictions} predictions</span>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-emerald-400">
          <Zap className="w-4 h-4" />
          <span className="font-bold">{user.points.toLocaleString()}</span>
        </div>
        {user.streak > 0 && (
          <div className="flex items-center gap-1 text-xs text-orange-400">
            <Flame className="w-3 h-3" />
            <span>{user.streak} streak</span>
          </div>
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
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${stats.bullishPercent}%` }}
          />
          <div
            className="bg-yellow-500 transition-all duration-500"
            style={{ width: `${stats.neutralPercent}%` }}
          />
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${stats.bearishPercent}%` }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-gray-400">Bullish</span>
          <span className="text-emerald-400 font-bold">{stats.bullishPercent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-400">Neutral</span>
          <span className="text-yellow-400 font-bold">{stats.neutralPercent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-400">Bearish</span>
          <span className="text-red-400 font-bold">{stats.bearishPercent}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-700">
        <div>
          <p className="text-gray-500 text-sm">Total Predictions</p>
          <p className="text-xl font-bold text-white">{stats.totalPredictions.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Active Predictors</p>
          <p className="text-xl font-bold text-white">{stats.activePredictors.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function PredictionSubmitModal({ isOpen, onClose, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<UserPrediction>) => void;
}) {
  const [coin, setCoin] = useState('bitcoin');
  const [prediction, setPrediction] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('BULLISH');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [confidence, setConfidence] = useState(70);
  const [reasoning, setReasoning] = useState('');

  if (!isOpen) return null;

  const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Submit Prediction</h2>
          <p className="text-gray-400 text-sm mt-1">Share your analysis with the community</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Coin Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Coin</label>
            <select
              value={coin}
              onChange={(e) => setCoin(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confidence: {confidence}%
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Reasoning */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Analysis</label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Share your reasoning (technical analysis, on-chain data, news, etc.)"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-24 resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSubmit({ coinId: coin, prediction, timeframe, confidence, reasoning });
              onClose();
            }}
            className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium"
          >
            Submit Prediction
          </button>
        </div>
      </div>
    </div>
  );
}

function ContestCard({
  title,
  prize,
  participants,
  endsIn,
  type
}: {
  title: string;
  prize: string;
  participants: number;
  endsIn: string;
  type: 'weekly' | 'monthly' | 'special';
}) {
  const getTypeStyle = () => {
    switch (type) {
      case 'weekly': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'monthly': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'special': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-xl border p-4 ${getTypeStyle()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          <span className="text-xs uppercase font-bold">{type}</span>
        </div>
        <span className="text-xs px-2 py-1 bg-gray-700 rounded">{endsIn}</span>
      </div>
      <h4 className="text-white font-semibold mb-2">{title}</h4>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{participants} participants</span>
        <span className="font-bold">{prize}</span>
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
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'contests'>('feed');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterCoin, setFilterCoin] = useState('all');
  const [filterPrediction, setFilterPrediction] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const mockPredictions = generateMockPredictions();
      setPredictions(mockPredictions);
      setLeaderboard(generateLeaderboard());
      setStats(generateCommunityStats(mockPredictions));
      setLoading(false);
    }, 500);
  }, []);

  const filteredPredictions = predictions.filter(p => {
    const matchesCoin = filterCoin === 'all' || p.coinId === filterCoin;
    const matchesPrediction = filterPrediction === 'all' || p.prediction === filterPrediction;
    const matchesSearch = searchQuery === '' ||
      p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.coinName.toLowerCase().includes(searchQuery.toLowerCase());
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
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 rounded-xl hover:bg-emerald-600 transition font-semibold"
            >
              <Plus className="w-5 h-5" />
              Submit Prediction
            </button>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-sm">Total Predictions</p>
                <p className="text-2xl font-bold text-white">{stats.totalPredictions.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-sm">Active Predictors</p>
                <p className="text-2xl font-bold text-white">{stats.activePredictors.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-sm">Community Accuracy</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.avgAccuracy}%</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-sm">Bullish Sentiment</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.bullishPercent}%</p>
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
                    />
                  </div>
                  <select
                    value={filterCoin}
                    onChange={(e) => setFilterCoin(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
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
                ) : (
                  <div className="space-y-4">
                    {filteredPredictions.map(pred => (
                      <PredictionCard
                        key={pred.id}
                        prediction={pred}
                        onLike={() => {}}
                        onComment={() => {}}
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
                  </p>
                </div>
                {leaderboard.map((user, i) => (
                  <LeaderboardCard key={user.userId} user={user} rank={i + 1} />
                ))}
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

                <div className="grid gap-4">
                  <ContestCard
                    title="Weekly Prediction Challenge"
                    prize="$500 in BTC"
                    participants={234}
                    endsIn="3 days left"
                    type="weekly"
                  />
                  <ContestCard
                    title="December Accuracy King"
                    prize="$2,000 in ETH"
                    participants={892}
                    endsIn="12 days left"
                    type="monthly"
                  />
                  <ContestCard
                    title="Bitcoin Halving Prediction"
                    prize="1 BTC"
                    participants={1547}
                    endsIn="Special Event"
                    type="special"
                  />
                </div>

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
                  <div key={user.userId} className="flex items-center gap-3">
                    <span className={`w-6 text-center font-bold ${
                      i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-600'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{user.userName}</p>
                      <p className="text-gray-500 text-xs">{user.accuracy.toFixed(1)}% accuracy</p>
                    </div>
                    <button type="button" className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
              <Link
                href="#"
                onClick={() => setActiveTab('leaderboard')}
                className="block text-center text-emerald-400 text-sm mt-4 hover:underline"
              >
                View Full Leaderboard
              </Link>
            </div>

            {/* Trending Coins */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                Trending in Community
              </h3>
              <div className="space-y-3">
                {[
                  { symbol: 'BTC', name: 'Bitcoin', sentiment: 72, predictions: 156 },
                  { symbol: 'ETH', name: 'Ethereum', sentiment: 68, predictions: 124 },
                  { symbol: 'SOL', name: 'Solana', sentiment: 78, predictions: 98 },
                  { symbol: 'AVAX', name: 'Avalanche', sentiment: 65, predictions: 67 },
                  { symbol: 'LINK', name: 'Chainlink', sentiment: 71, predictions: 45 },
                ].map(coin => (
                  <div key={coin.symbol} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white w-12">{coin.symbol}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">{coin.predictions} predictions</span>
                        <span className={coin.sentiment >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                          {coin.sentiment}% bullish
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${coin.sentiment >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${coin.sentiment}%` }}
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
        onSubmit={(data) => {
          console.log('Submitted prediction:', data);
          // In real app, this would call an API
        }}
      />
    </div>
  );
}
