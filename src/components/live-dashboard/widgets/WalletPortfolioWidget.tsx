'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors } from '@/lib/live-dashboard/theme';
import { Wallet, Copy, ExternalLink } from 'lucide-react';

/* ---------- chain config ---------- */
const CHAIN_EXPLORERS: Record<string, { label: string; explorer: string; native: string }> = {
  'eth-mainnet':     { label: 'Ethereum',  explorer: 'https://etherscan.io',                native: 'ETH' },
  'polygon-mainnet': { label: 'Polygon',   explorer: 'https://polygonscan.com',             native: 'MATIC' },
  'arb-mainnet':     { label: 'Arbitrum',  explorer: 'https://arbiscan.io',                 native: 'ETH' },
  'base-mainnet':    { label: 'Base',      explorer: 'https://basescan.org',                native: 'ETH' },
  'opt-mainnet':     { label: 'Optimism',  explorer: 'https://optimistic.etherscan.io',     native: 'ETH' },
};

/* ---------- helpers ---------- */

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatEth(n: number): string {
  if (n === 0) return '0';
  if (n < 0.0001) return n.toExponential(2);
  if (n < 1) return n.toFixed(6);
  return n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function truncateHex(hex: string): string {
  if (hex.length <= 14) return hex;
  return `${hex.slice(0, 10)}...${hex.slice(-4)}`;
}

/* ---------- component ---------- */

export function WalletPortfolioWidget() {
  const { data, alchemyKey, walletAddress, alchemyChain, siteTheme, colorTheme } =
    useLiveDashboardStore((s) => ({
      data: s.data,
      alchemyKey: s.alchemyKey,
      walletAddress: s.walletAddress,
      alchemyChain: s.alchemyChain,
      siteTheme: s.siteTheme,
      colorTheme: s.customization.colorTheme,
    }));

  const chainInfo = CHAIN_EXPLORERS[alchemyChain] || CHAIN_EXPLORERS['eth-mainnet'];

  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);
  const balances = data.walletBalances;

  const tokenList = useMemo(() => {
    if (!balances?.tokens) return [];
    return [...balances.tokens].slice(0, 50);
  }, [balances]);

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
  if (!balances) {
    return (
      <div className="space-y-4 py-2">
        {/* ETH balance skeleton */}
        <div className="space-y-2">
          <div className={`h-3 w-32 rounded ${st.subtleBg} animate-pulse`} />
          <div className={`h-8 w-48 rounded ${st.subtleBg} animate-pulse`} />
        </div>
        {/* Token rows skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className={`h-3 w-40 rounded ${st.subtleBg} animate-pulse`} />
            <div className={`h-3 w-20 rounded ${st.subtleBg} animate-pulse`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ---- Wallet address header ---- */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${themeColors.primary}15` }}
        >
          <Wallet className="w-3.5 h-3.5" style={{ color: themeColors.primary }} />
        </div>
        <div className="min-w-0 flex items-center gap-1.5">
          <span className={`text-xs font-mono font-medium ${st.textSecondary}`}>
            {truncateAddress(balances.address)}
          </span>
          <button
            onClick={() => navigator.clipboard?.writeText(balances.address)}
            className={`p-0.5 rounded hover:${st.subtleBg} transition-colors`}
            title="Copy address"
          >
            <Copy className={`w-3 h-3 ${st.textDim}`} />
          </button>
          <a
            href={`${chainInfo.explorer}/address/${balances.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-0.5 rounded hover:${st.subtleBg} transition-colors`}
            title={`View on ${chainInfo.label} explorer`}
          >
            <ExternalLink className={`w-3 h-3 ${st.textDim}`} />
          </a>
        </div>
      </div>

      {/* ---- ETH balance prominent display ---- */}
      <div className={`rounded-xl p-4 ${st.cardClasses}`}>
        <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${st.textDim}`}>
          {chainInfo.native} Balance
          <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full ${st.subtleBg} ${st.textDim} font-normal normal-case tracking-normal`}>{chainInfo.label}</span>
        </p>
        <p
          className="text-2xl font-bold tabular-nums tracking-tight"
          style={{ color: themeColors.primary }}
        >
          {formatEth(balances.ethBalance)} {chainInfo.native}
        </p>
      </div>

      {/* ---- Token balances ---- */}
      {tokenList.length > 0 && (
        <div>
          <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${st.textDim}`}>
            Token Balances ({tokenList.length})
          </p>

          <div className="space-y-1">
            {tokenList.map((token, idx) => (
              <div
                key={`${token.contractAddress}-${idx}`}
                className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:${st.subtleBg}`}
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={`${chainInfo.explorer}/token/${token.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-mono hover:underline ${st.textSecondary}`}
                    title={token.contractAddress}
                  >
                    {truncateHex(token.contractAddress)}
                  </a>
                </div>
                <span className={`text-xs font-mono tabular-nums ml-3 shrink-0 ${st.textMuted}`}>
                  {truncateHex(token.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- No tokens ---- */}
      {tokenList.length === 0 && (
        <p className={`text-xs text-center py-3 ${st.textDim}`}>
          No ERC-20 token balances found for this wallet.
        </p>
      )}
    </div>
  );
}
