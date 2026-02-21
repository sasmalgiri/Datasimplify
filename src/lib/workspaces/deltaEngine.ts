/**
 * Delta Engine — Computes "What Changed?" between snapshots
 *
 * Pure functions, no side effects. Runs client-side.
 * Uses positions_json from snapshots for per-asset breakdown.
 */

import { formatDistanceToNow } from 'date-fns';
import type { SnapshotWithDiff, PositionSnapshot } from './types';
import type { MarketCoin } from '@/lib/live-dashboard/store';

export interface DeltaDriver {
  symbol: string;
  coinId: string;
  priceChange: number;
  pricePctChange: number;
  contribution: number;
  direction: 'up' | 'down' | 'flat';
}

export interface DeltaSummary {
  valueChange: number | null;
  valuePctChange: number | null;
  return7dChange: number | null;
  return30dChange: number | null;
  assetCountChange: number;
  drivers: DeltaDriver[];
  addedCoins: string[];
  removedCoins: string[];
  currentTimestamp: string;
  previousTimestamp: string;
  timeElapsed: string;
}

/**
 * Compute delta between two snapshots.
 * If currentMarkets is provided, uses live prices for per-asset breakdown.
 * Otherwise falls back to positions_json stored in snapshots.
 */
export function computeDelta(
  current: SnapshotWithDiff,
  previous: SnapshotWithDiff,
  currentMarkets?: MarketCoin[] | null,
): DeltaSummary {
  const valueChange =
    current.kpi_value != null && previous.kpi_value != null
      ? current.kpi_value - previous.kpi_value
      : null;

  const valuePctChange =
    valueChange != null && previous.kpi_value != null && previous.kpi_value !== 0
      ? Number(((valueChange / previous.kpi_value) * 100).toFixed(2))
      : null;

  const return7dChange =
    current.kpi_return_7d != null && previous.kpi_return_7d != null
      ? Number((current.kpi_return_7d - previous.kpi_return_7d).toFixed(2))
      : null;

  const return30dChange =
    current.kpi_return_30d != null && previous.kpi_return_30d != null
      ? Number((current.kpi_return_30d - previous.kpi_return_30d).toFixed(2))
      : null;

  const assetCountChange = current.asset_count - previous.asset_count;

  // Per-asset driver analysis
  const drivers: DeltaDriver[] = [];
  const addedCoins: string[] = [];
  const removedCoins: string[] = [];

  const prevPositions = previous.positions_json ?? [];
  const currPositions = current.positions_json ?? [];

  if (prevPositions.length > 0 && (currPositions.length > 0 || currentMarkets)) {
    const prevMap = new Map<string, PositionSnapshot>();
    for (const p of prevPositions) {
      prevMap.set(p.coinId, p);
    }

    // Use current positions or live market data
    const currentAssets: PositionSnapshot[] =
      currPositions.length > 0
        ? currPositions
        : (currentMarkets ?? []).map((m) => ({
            symbol: m.symbol.toUpperCase(),
            coinId: m.id,
            price: m.current_price,
            change24h: m.price_change_percentage_24h || 0,
            marketCap: m.market_cap || 0,
          }));

    const currMap = new Map<string, PositionSnapshot>();
    for (const c of currentAssets) {
      currMap.set(c.coinId, c);
    }

    // Find changes and new coins
    for (const curr of currentAssets) {
      const prev = prevMap.get(curr.coinId);
      if (!prev) {
        addedCoins.push(curr.symbol);
        continue;
      }

      const priceChange = curr.price - prev.price;
      const pricePctChange =
        prev.price !== 0 ? Number(((priceChange / prev.price) * 100).toFixed(2)) : 0;
      const mcapChange = curr.marketCap - prev.marketCap;

      drivers.push({
        symbol: curr.symbol,
        coinId: curr.coinId,
        priceChange,
        pricePctChange,
        contribution: mcapChange,
        direction: pricePctChange > 0.01 ? 'up' : pricePctChange < -0.01 ? 'down' : 'flat',
      });
    }

    // Find removed coins
    for (const prev of prevPositions) {
      if (!currMap.has(prev.coinId)) {
        removedCoins.push(prev.symbol);
      }
    }

    // Sort drivers by absolute contribution (biggest impact first)
    drivers.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  }

  return {
    valueChange,
    valuePctChange,
    return7dChange,
    return30dChange,
    assetCountChange,
    drivers,
    addedCoins,
    removedCoins,
    currentTimestamp: current.created_at,
    previousTimestamp: previous.created_at,
    timeElapsed: formatTimeElapsed(previous.created_at),
  };
}

export function formatTimeElapsed(from: string): string {
  try {
    return formatDistanceToNow(new Date(from), { addSuffix: true });
  } catch {
    return 'unknown';
  }
}

/**
 * Format a number compactly: $1.2B, $45.3K, etc.
 */
export function formatCompactValue(value: number | null): string {
  if (value == null) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

/**
 * Format a percentage change: +5.2%, -1.1%, etc.
 */
export function formatPctChange(value: number | null): string {
  if (value == null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
