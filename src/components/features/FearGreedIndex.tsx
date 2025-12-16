'use client';

import { useState, useEffect } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

interface FearGreedData {
  value: number;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

export function FearGreedIndex({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<FearGreedData[]>([]);

  useEffect(() => {
    // Fetch Fear & Greed data
    async function fetchData() {
      try {
        const res = await fetch('https://api.alternative.me/fng/?limit=30');
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setData(json.data[0]);
          setHistory(json.data);
        }
      } catch (error) {
        console.error('Error fetching Fear & Greed:', error);
        // Use mock data
        setData({
          value: 72,
          value_classification: 'Greed',
          timestamp: Date.now().toString(),
          time_until_update: '12 hours'
        });
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const value = data?.value || 50;
  
  // Get emoji and color based on value
  const getEmoji = (val: number) => {
    if (val <= 20) return { emoji: '😨', label: 'Extreme Fear', color: 'text-red-600' };
    if (val <= 40) return { emoji: '😟', label: 'Fear', color: 'text-orange-500' };
    if (val <= 60) return { emoji: '😐', label: 'Neutral', color: 'text-gray-600' };
    if (val <= 80) return { emoji: '😊', label: 'Greed', color: 'text-green-500' };
    return { emoji: '🤑', label: 'Extreme Greed', color: 'text-green-600' };
  };

  const mood = getEmoji(value);

  // Calculate needle position
  const needleRotation = (value / 100) * 180 - 90;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            😱 Fear & Greed Index
            <InfoButton explanation="This index measures the overall sentiment in the crypto market. It combines volatility, market momentum, social media, surveys, and more to determine if investors are fearful or greedy." />
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            How the market is feeling right now
          </p>
        </div>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 What is This?">
          This measures how people <strong>feel</strong> about crypto right now. 
          When everyone is <strong>fearful</strong>, prices might be low (good time to buy?). 
          When everyone is <strong>greedy</strong>, prices might be too high (be careful!).
        </BeginnerTip>
      )}

      {/* Gauge */}
      <div className="relative w-full max-w-sm mx-auto aspect-[2/1] mb-4">
        {/* Background arc */}
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Gradient arc background */}
          <defs>
            <linearGradient id="fearGreedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>
          
          {/* Arc */}
          <path
            d="M 10 95 A 85 85 0 0 1 190 95"
            fill="none"
            stroke="url(#fearGreedGradient)"
            strokeWidth="15"
            strokeLinecap="round"
          />
          
          {/* Needle */}
          <g transform={`rotate(${needleRotation}, 100, 95)`}>
            <line
              x1="100"
              y1="95"
              x2="100"
              y2="25"
              stroke="#1f2937"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="95" r="8" fill="#1f2937" />
          </g>
          
          {/* Labels */}
          <text x="10" y="98" fontSize="8" fill="#6b7280" textAnchor="start">0</text>
          <text x="55" y="35" fontSize="8" fill="#6b7280" textAnchor="middle">25</text>
          <text x="100" y="20" fontSize="8" fill="#6b7280" textAnchor="middle">50</text>
          <text x="145" y="35" fontSize="8" fill="#6b7280" textAnchor="middle">75</text>
          <text x="190" y="98" fontSize="8" fill="#6b7280" textAnchor="end">100</text>
        </svg>

        {/* Center value */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
          <span className="text-4xl">{mood.emoji}</span>
        </div>
      </div>

      {/* Current Value */}
      <div className="text-center mb-6">
        <p className={`text-5xl font-bold ${mood.color}`}>{value}</p>
        <p className={`text-xl font-semibold ${mood.color}`}>{mood.label}</p>
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between text-xs text-gray-500 mb-6 px-4">
        <span>😨 Extreme Fear</span>
        <span>😟 Fear</span>
        <span>😐 Neutral</span>
        <span>😊 Greed</span>
        <span>🤑 Extreme Greed</span>
      </div>

      {/* What It Means */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          💡 What does this mean for you?
        </h3>
        {value <= 30 ? (
          <div className="space-y-2 text-sm">
            <p className="text-red-700">
              <strong>Extreme Fear:</strong> People are very scared about crypto right now.
            </p>
            <p className="text-gray-700">
              📜 <em>&quot;Be greedy when others are fearful&quot;</em> - Warren Buffett
            </p>
            <p className="text-gray-600">
              This could be a good time to buy, as prices might be lower than usual. 
              But always do your own research!
            </p>
          </div>
        ) : value <= 50 ? (
          <div className="space-y-2 text-sm">
            <p className="text-orange-700">
              <strong>Cautious:</strong> The market is uncertain. People are nervous.
            </p>
            <p className="text-gray-600">
              Consider waiting for clearer signals before making big moves.
            </p>
          </div>
        ) : value <= 70 ? (
          <div className="space-y-2 text-sm">
            <p className="text-green-700">
              <strong>Optimistic:</strong> People are feeling good about crypto.
            </p>
            <p className="text-gray-600">
              The market is healthy, but don&apos;t let FOMO (fear of missing out) make you overpay.
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-green-700">
              <strong>Extreme Greed:</strong> Everyone is very excited about crypto!
            </p>
            <p className="text-gray-700">
              📜 <em>&quot;Be fearful when others are greedy&quot;</em> - Warren Buffett
            </p>
            <p className="text-gray-600">
              ⚠️ Prices might be too high. Consider taking some profits or waiting before buying more.
            </p>
          </div>
        )}
      </div>

      {/* Historical Chart */}
      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">📈 Last 30 Days</h3>
          <div className="flex items-end gap-1 h-20">
            {history.slice().reverse().map((item, index) => {
              const height = (parseInt(item.value.toString()) / 100) * 100;
              const bg = parseInt(item.value.toString()) <= 40 
                ? 'bg-red-400' 
                : parseInt(item.value.toString()) <= 60 
                ? 'bg-yellow-400' 
                : 'bg-green-400';
              return (
                <div
                  key={index}
                  className={`flex-1 ${bg} rounded-t transition-all hover:opacity-80`}
                  style={{ height: `${height}%` }}
                  title={`${item.value} - ${getEmoji(parseInt(item.value.toString())).label}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FearGreedIndex;
