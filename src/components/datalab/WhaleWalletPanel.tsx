'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { isFeatureAvailable } from '@/lib/datalab/modeConfig';

interface WhaleTransaction {
  id: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  valueUsd: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  label: string;
}

interface WhaleWalletPanelProps {
  show: boolean;
  onClose: () => void;
}

/** Generate simulated whale data for fallback */
function generateSimulatedWhaleData(): WhaleTransaction[] {
  const now = Date.now();
  const types: ('buy' | 'sell' | 'transfer')[] = ['buy', 'sell', 'transfer', 'buy', 'sell'];
  return Array.from({ length: 8 }, (_, i) => {
    const type = types[i % types.length];
    const amount = Math.round(50 + Math.random() * 500);
    const price = 85000 + Math.random() * 10000;
    return {
      id: `sim-${i}`,
      timestamp: now - i * 3600000 * (2 + Math.random() * 10),
      type,
      amount,
      valueUsd: amount * price,
      signal: type === 'buy' ? 'bullish' : type === 'sell' ? 'bearish' : 'neutral',
      label: `${type} ${amount} BTC ($${((amount * price) / 1e6).toFixed(1)}M)`,
    };
  });
}

const SIGNAL_COLORS = {
  bullish: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/20' },
  bearish: { bg: 'bg-red-400/10', text: 'text-red-400', border: 'border-red-400/20' },
  neutral: { bg: 'bg-gray-400/10', text: 'text-gray-400', border: 'border-gray-400/20' },
};

const SIGNAL_ICON = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
};

export function WhaleWalletPanel({ show, onClose }: WhaleWalletPanelProps) {
  const dataLabMode = useDataLabStore((s) => s.dataLabMode);
  const coin = useDataLabStore((s) => s.coin);

  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWhaleData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/whales?type=dashboard');
      if (!res.ok) throw new Error('Failed to fetch whale data');
      const data = await res.json();
      const txs: WhaleTransaction[] = (data.data?.recentWhaleTransactions ?? [])
        .slice(0, 15)
        .map((tx: Record<string, unknown>, i: number) => ({
          id: (tx.hash as string) || `whale-${i}`,
          timestamp: new Date(tx.timestamp as string).getTime(),
          type: tx.type as 'buy' | 'sell' | 'transfer',
          amount: (tx.amount_btc as number) ?? 0,
          valueUsd: (tx.amount_usd as number) ?? 0,
          signal: tx.type === 'buy' ? 'bullish' : tx.type === 'sell' ? 'bearish' : 'neutral',
          label: `${tx.type} ${((tx.amount_btc as number) ?? 0).toFixed(2)} BTC ($${(((tx.amount_usd as number) ?? 0) / 1e6).toFixed(1)}M)`,
        }));
      setTransactions(txs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error fetching whale data');
      setTransactions(generateSimulatedWhaleData());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    if (transactions.length === 0 && !loading) {
      fetchWhaleData();
    }
  }, [show, fetchWhaleData, transactions.length, loading]);

  // All hooks above — conditional returns below
  if (!isFeatureAvailable(dataLabMode, 'whaleWalletTracking')) return null;
  if (!show) return null;

  return (
    <div className="border-t border-white/[0.04] bg-white/[0.01] max-w-[1800px] mx-auto">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white flex items-center gap-2">
            <span className="text-[14px]">&#128011;</span>
            Whale Wallet Tracking
            <span className="text-[10px] text-gray-500 font-normal ml-2">
              {coin.toUpperCase()} &middot; {transactions.length} transactions
            </span>
          </h4>
          <div className="flex items-center gap-2">
            <button type="button" title="Refresh" onClick={fetchWhaleData}
              disabled={loading}
              className="text-gray-500 hover:text-white disabled:opacity-30">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" title="Close whale panel" onClick={onClose}
              className="text-gray-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-[10px] text-amber-400/70 mb-2">
            Using simulated data &mdash; whale API unavailable
          </p>
        )}

        {transactions.length === 0 && !loading ? (
          <p className="text-[11px] text-gray-600 text-center py-3">
            No whale transactions detected.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {transactions.map((tx) => {
              const colors = SIGNAL_COLORS[tx.signal];
              const Icon = SIGNAL_ICON[tx.signal];
              return (
                <div
                  key={tx.id}
                  className={`flex-shrink-0 ${colors.bg} border ${colors.border} rounded-lg px-3 py-2 min-w-[200px] max-w-[240px]`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3 h-3 ${colors.text}`} />
                    <span className={`text-[10px] font-medium uppercase ${colors.text}`}>{tx.type}</span>
                    <span className="text-[9px] text-gray-500 ml-auto">
                      {tx.timestamp > 0 ? new Date(tx.timestamp).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 truncate">{tx.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    ${tx.valueUsd >= 1e6 ? `${(tx.valueUsd / 1e6).toFixed(1)}M` : tx.valueUsd.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
