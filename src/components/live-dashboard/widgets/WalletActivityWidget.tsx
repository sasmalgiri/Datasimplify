'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors } from '@/lib/live-dashboard/theme';
import { ArrowDownLeft, ArrowUpRight, Wallet, ExternalLink } from 'lucide-react';

/* ---------- chain config ---------- */
const CHAIN_EXPLORERS: Record<string, { label: string; explorer: string }> = {
  'eth-mainnet':     { label: 'Ethereum',  explorer: 'https://etherscan.io' },
  'polygon-mainnet': { label: 'Polygon',   explorer: 'https://polygonscan.com' },
  'arb-mainnet':     { label: 'Arbitrum',  explorer: 'https://arbiscan.io' },
  'base-mainnet':    { label: 'Base',      explorer: 'https://basescan.org' },
  'opt-mainnet':     { label: 'Optimism',  explorer: 'https://optimistic.etherscan.io' },
};

/* ---------- helpers ---------- */

function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 12) return addr || '—';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function truncateHash(hash: string): string {
  if (!hash || hash.length <= 14) return hash || '—';
  return `${hash.slice(0, 10)}...${hash.slice(-4)}`;
}

function formatValue(n: number): string {
  if (n === 0) return '0';
  if (n < 0.0001) return n.toExponential(2);
  if (n < 1) return n.toFixed(6);
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function blockNumToApprox(blockNum: string): string {
  // Display the hex block number in decimal for context
  const dec = parseInt(blockNum, 16);
  if (isNaN(dec)) return blockNum;
  return `#${dec.toLocaleString()}`;
}

/* ---------- component ---------- */

export function WalletActivityWidget() {
  const { data, alchemyKey, walletAddress, alchemyChain, siteTheme, colorTheme } =
    useLiveDashboardStore((s) => ({
      data: s.data,
      alchemyKey: s.alchemyKey,
      walletAddress: s.walletAddress,
      alchemyChain: s.alchemyChain,
      siteTheme: s.siteTheme,
      colorTheme: s.customization.colorTheme,
    }));

  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);
  const chainInfo = CHAIN_EXPLORERS[alchemyChain] || CHAIN_EXPLORERS['eth-mainnet'];
  const transfers = data.walletTransfers;

  // Sort transfers newest first (highest blockNum = newest)
  const sortedTransfers = useMemo(() => {
    if (!transfers?.transfers) return [];
    return [...transfers.transfers].sort((a, b) => {
      const aBlock = parseInt(a.blockNum, 16) || 0;
      const bBlock = parseInt(b.blockNum, 16) || 0;
      return bBlock - aBlock;
    });
  }, [transfers]);

  /* ---- No keys configured ---- */
  if (!alchemyKey || !walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${themeColors.primary}10` }}
        >
          <Wallet className="w-6 h-6" style={{ color: themeColors.primary, opacity: 0.6 }} />
        </div>
        <p className={`text-sm font-medium mb-1 ${st.textMuted}`}>
          Wallet not connected
        </p>
        <p className={`text-xs max-w-[280px] ${st.textDim}`}>
          Connect your Alchemy API key and wallet address to view on-chain data.
        </p>
      </div>
    );
  }

  /* ---- Loading skeleton ---- */
  if (!transfers) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${st.subtleBg} animate-pulse shrink-0`} />
            <div className="flex-1 space-y-1.5">
              <div className={`h-3 w-32 rounded ${st.subtleBg} animate-pulse`} />
              <div className={`h-2.5 w-48 rounded ${st.subtleBg} animate-pulse`} />
            </div>
            <div className={`h-3 w-16 rounded ${st.subtleBg} animate-pulse shrink-0`} />
          </div>
        ))}
      </div>
    );
  }

  /* ---- Empty transfers ---- */
  if (sortedTransfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className={`text-sm font-medium mb-1 ${st.textMuted}`}>
          No transfers found
        </p>
        <p className={`text-xs max-w-[240px] ${st.textDim}`}>
          No recent transfer activity detected for this wallet address.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${st.textDim}`}>
        Recent Transfers ({sortedTransfers.length})
      </p>

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
        {sortedTransfers.map((tx, idx) => {
          const isIn = tx.direction === 'in';

          return (
            <div
              key={`${tx.hash}-${idx}`}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:${st.subtleBg} ${st.cardClasses}`}
            >
              {/* Direction icon */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: isIn ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
                }}
              >
                {isIn ? (
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-red-400" />
                )}
              </div>

              {/* Transfer details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold ${st.textPrimary}`}>
                    {tx.asset || 'Unknown'}
                  </span>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: isIn ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
                      color: isIn ? '#34d399' : '#ef4444',
                    }}
                  >
                    {isIn ? 'IN' : 'OUT'}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${st.subtleBg} ${st.textDim}`}>
                    {tx.category}
                  </span>
                </div>

                {/* From / To */}
                <div className={`text-[11px] ${st.textDim} space-y-0.5`}>
                  <div className="flex items-center gap-1">
                    <span className="w-8 shrink-0 font-medium">From</span>
                    <span className="font-mono">{truncateAddress(tx.from)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-8 shrink-0 font-medium">To</span>
                    <span className="font-mono">{truncateAddress(tx.to)}</span>
                  </div>
                </div>

                {/* Block + Tx hash */}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] ${st.textFaint}`}>
                    {blockNumToApprox(tx.blockNum)}
                  </span>
                  <a
                    href={`${chainInfo.explorer}/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-0.5 text-[9px] font-mono hover:underline ${st.textDim}`}
                    title={tx.hash}
                  >
                    {truncateHash(tx.hash)}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* Value */}
              <div className="text-right shrink-0 mt-0.5">
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: isIn ? '#34d399' : '#ef4444' }}
                >
                  {isIn ? '+' : '-'}{formatValue(tx.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
