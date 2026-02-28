/**
 * Event-to-Price Alignment
 * Static event database for key crypto events with vertical chart markers.
 */

export interface MarketEvent {
  date: number;       // Unix timestamp (ms)
  label: string;      // Short label for chart
  category: EventCategory;
  description: string; // Full description for tooltip
}

export type EventCategory = 'halving' | 'etf' | 'regulation' | 'macro' | 'crash' | 'upgrade' | 'custom';

export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  halving: '#f59e0b',    // amber
  etf: '#34d399',        // emerald
  regulation: '#ef4444', // red
  macro: '#60a5fa',      // blue
  crash: '#ef4444',      // red
  upgrade: '#a78bfa',    // purple
  custom: '#10b981',     // green
};

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  halving: 'Halving',
  etf: 'ETF',
  regulation: 'Regulation',
  macro: 'Macro',
  crash: 'Crash',
  upgrade: 'Upgrade',
  custom: 'Custom',
};

/**
 * Static database of major crypto events.
 * Dates stored as UTC midnight timestamps.
 */
export const CRYPTO_EVENTS: MarketEvent[] = [
  // BTC Halvings
  {
    date: Date.UTC(2012, 10, 28), // Nov 28, 2012
    label: 'BTC Halving #1',
    category: 'halving',
    description: 'First Bitcoin halving: block reward reduced from 50 to 25 BTC',
  },
  {
    date: Date.UTC(2016, 6, 9), // Jul 9, 2016
    label: 'BTC Halving #2',
    category: 'halving',
    description: 'Second Bitcoin halving: block reward reduced from 25 to 12.5 BTC',
  },
  {
    date: Date.UTC(2020, 4, 11), // May 11, 2020
    label: 'BTC Halving #3',
    category: 'halving',
    description: 'Third Bitcoin halving: block reward reduced from 12.5 to 6.25 BTC',
  },
  {
    date: Date.UTC(2024, 3, 19), // Apr 19, 2024
    label: 'BTC Halving #4',
    category: 'halving',
    description: 'Fourth Bitcoin halving: block reward reduced from 6.25 to 3.125 BTC',
  },

  // ETF Events
  {
    date: Date.UTC(2024, 0, 10), // Jan 10, 2024
    label: 'BTC Spot ETF',
    category: 'etf',
    description: 'SEC approves first US Bitcoin spot ETFs (BlackRock, Fidelity, etc.)',
  },
  {
    date: Date.UTC(2024, 4, 23), // May 23, 2024
    label: 'ETH Spot ETF',
    category: 'etf',
    description: 'SEC approves Ethereum spot ETF applications',
  },
  {
    date: Date.UTC(2021, 9, 19), // Oct 19, 2021
    label: 'BTC Futures ETF',
    category: 'etf',
    description: 'ProShares Bitcoin Strategy ETF (BITO) launches — first US BTC futures ETF',
  },

  // Major crashes/events
  {
    date: Date.UTC(2020, 2, 12), // Mar 12, 2020
    label: 'COVID Crash',
    category: 'crash',
    description: 'COVID-19 market crash: BTC drops ~50% in a single day',
  },
  {
    date: Date.UTC(2022, 4, 9), // May 9, 2022
    label: 'LUNA Collapse',
    category: 'crash',
    description: 'Terra/LUNA collapse: UST de-peg triggers $40B wipeout',
  },
  {
    date: Date.UTC(2022, 10, 11), // Nov 11, 2022
    label: 'FTX Collapse',
    category: 'crash',
    description: 'FTX exchange files for bankruptcy, BTC drops to ~$16K',
  },
  {
    date: Date.UTC(2021, 4, 19), // May 19, 2021
    label: 'China Ban',
    category: 'regulation',
    description: 'China bans financial institutions from crypto, BTC drops 30%',
  },

  // Macro events
  {
    date: Date.UTC(2022, 2, 16), // Mar 16, 2022
    label: 'Fed Hike Start',
    category: 'macro',
    description: 'Federal Reserve begins interest rate hiking cycle',
  },
  {
    date: Date.UTC(2024, 8, 18), // Sep 18, 2024
    label: 'Fed Rate Cut',
    category: 'macro',
    description: 'Federal Reserve cuts rates by 50bp, first cut since 2020',
  },
  {
    date: Date.UTC(2023, 2, 10), // Mar 10, 2023
    label: 'SVB Collapse',
    category: 'crash',
    description: 'Silicon Valley Bank collapses, USDC de-pegs briefly',
  },

  // Network upgrades
  {
    date: Date.UTC(2022, 8, 15), // Sep 15, 2022
    label: 'ETH Merge',
    category: 'upgrade',
    description: 'Ethereum transitions from Proof-of-Work to Proof-of-Stake (The Merge)',
  },
  {
    date: Date.UTC(2024, 2, 13), // Mar 13, 2024
    label: 'ETH Dencun',
    category: 'upgrade',
    description: 'Ethereum Dencun upgrade: EIP-4844 proto-danksharding reduces L2 fees',
  },
  {
    date: Date.UTC(2021, 10, 12), // Nov 12, 2021
    label: 'BTC Taproot',
    category: 'upgrade',
    description: 'Bitcoin Taproot upgrade activates (improved privacy + smart contracts)',
  },
];

/**
 * Filter events within a given timestamp range.
 */
export function getEventsInRange(
  startMs: number,
  endMs: number,
  categories?: EventCategory[],
  customEvents?: MarketEvent[],
): MarketEvent[] {
  const allEvents = customEvents ? [...CRYPTO_EVENTS, ...customEvents] : CRYPTO_EVENTS;
  return allEvents.filter((e) => {
    if (e.date < startMs || e.date > endMs) return false;
    if (categories && !categories.includes(e.category)) return false;
    return true;
  });
}

/**
 * Find the nearest timestamp index for an event date.
 */
export function findNearestIndex(timestamps: number[], targetMs: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < timestamps.length; i++) {
    const dist = Math.abs(timestamps[i] - targetMs);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  // Only return if within 3 days
  return bestDist < 3 * 86400_000 ? best : -1;
}
