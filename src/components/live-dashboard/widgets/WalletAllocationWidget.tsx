'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';
import { Wallet } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

/* ---------- helpers ---------- */

function truncateAddress(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

/**
 * Attempt to parse a raw token balance string (may be hex or decimal).
 * Returns a finite number or 0.
 */
function parseTokenBalance(raw: string): number {
  if (!raw) return 0;
  // Hex string (0x...)
  if (raw.startsWith('0x')) {
    const n = parseInt(raw, 16);
    return isFinite(n) ? n : 0;
  }
  const n = parseFloat(raw);
  return isFinite(n) ? n : 0;
}

/* ---------- component ---------- */

export function WalletAllocationWidget() {
  const { data, alchemyKey, walletAddress, alchemyChain, siteTheme, colorTheme, chartHeight, showAnimations } =
    useLiveDashboardStore(useShallow((s) => ({
      data: s.data,
      alchemyKey: s.alchemyKey,
      walletAddress: s.walletAddress,
      alchemyChain: s.alchemyChain,
      siteTheme: s.siteTheme,
      colorTheme: s.customization.colorTheme,
      chartHeight: s.customization.chartHeight,
      showAnimations: s.customization.showAnimations,
    })));

  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);
  const balances = data.walletBalances;
  const isLight = siteTheme === 'light-blue';
  const nativeToken = alchemyChain === 'polygon-mainnet' ? 'MATIC' : 'ETH';

  const { pieData, totalSlices, ethPortion } = useMemo(() => {
    if (!balances) return { pieData: null, totalSlices: 0, ethPortion: 0 };

    const slices: { name: string; value: number; fill: string }[] = [];
    const palette = themeColors.palette;

    // Native token slice based on actual balance
    const ethVal = balances.ethBalance;
    if (ethVal > 0) {
      slices.push({
        name: nativeToken,
        value: ethVal,
        fill: palette[0],
      });
    }

    // Each token as a separate slice
    // Since we only have raw balances (not USD), we parse the raw value for proportion
    const tokens = balances.tokens || [];
    tokens.forEach((token, i) => {
      const rawVal = parseTokenBalance(token.balance);
      if (rawVal > 0) {
        slices.push({
          name: truncateAddress(token.contractAddress),
          value: rawVal,
          fill: palette[(i + 1) % palette.length],
        });
      }
    });

    // If the scale between ETH and token raw balances is wildly different
    // (e.g. ETH = 1.5 vs token = 1e18), normalize to show proportional count instead.
    // Heuristic: if max/min ratio > 1e12, fall back to a simple "1 unit per asset" view.
    if (slices.length > 1) {
      const vals = slices.map((s) => s.value);
      const max = Math.max(...vals);
      const min = Math.min(...vals.filter((v) => v > 0));
      if (min > 0 && max / min > 1e12) {
        // Normalize: each asset counts as 1 unit
        slices.forEach((s) => {
          s.value = 1;
        });
      }
    }

    const total = slices.reduce((acc, s) => acc + s.value, 0);
    const ethPortion = total > 0 && ethVal > 0
      ? (slices.find((s) => s.name === nativeToken)?.value ?? 0) / total * 100
      : 0;

    return { pieData: slices, totalSlices: slices.length, ethPortion };
  }, [balances, themeColors, nativeToken]);

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
      <div className="flex items-center justify-center py-12 animate-pulse">
        <div className={`h-32 w-32 rounded-full ${st.subtleBg}`} />
      </div>
    );
  }

  /* ---- No data to chart ---- */
  if (!pieData || pieData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className={`text-sm font-medium mb-1 ${st.textMuted}`}>
          No balances to display
        </p>
        <p className={`text-xs max-w-[240px] ${st.textDim}`}>
          This wallet has no {nativeToken} or token balances detected.
        </p>
      </div>
    );
  }

  const height = CHART_HEIGHT_MAP[chartHeight];
  const tooltipBg = isLight ? 'rgba(255,255,255,0.97)' : '#111827';
  const tooltipBorder = isLight ? '#bfdbfe' : '#374151';
  const tooltipText = isLight ? '#1e293b' : '#d1d5db';

  return (
    <div>
      {/* Summary line */}
      <div className="flex items-center justify-between mb-2">
        <p className={`text-[10px] uppercase tracking-wider font-semibold ${st.textDim}`}>
          {totalSlices} Asset{totalSlices !== 1 ? 's' : ''} Detected
        </p>
        {ethPortion > 0 && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: `${themeColors.primary}15`,
              color: themeColors.primary,
            }}
          >
            {nativeToken}: {ethPortion.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Pie chart */}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="72%"
            paddingAngle={2}
            dataKey="value"
            isAnimationActive={showAnimations}
            animationDuration={600}
            animationEasing="ease-out"
            stroke={isLight ? '#ffffff' : 'rgba(10,10,15,0.8)'}
            strokeWidth={2}
          >
            {pieData.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => {
              const v = value ?? 0;
              const total = pieData.reduce((acc, s) => acc + s.value, 0);
              const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
              return [`${pct}%`, name ?? ''];
            }}
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '8px',
              fontSize: '11px',
            }}
            itemStyle={{ color: tooltipText }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', color: tooltipText }}
            formatter={(value: string) => (
              <span className={st.textMuted} style={{ fontSize: '10px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Insight */}
      <p className={`text-[10px] text-center mt-1 italic ${st.textDim}`}>
        Allocation shown by proportion. Raw balances only (no USD conversion).
      </p>
    </div>
  );
}
