/**
 * CoinGecko API Call Budget Management
 *
 * Analyst plan: 500k calls/month = ~16,666/day = ~694/hour
 *
 * Budget allocation:
 * - Top 200 coins prices (batched): ~1,440 calls/day (every 60s)
 * - Top 200 coins OHLCV (daily): ~200 calls/day
 * - Metadata refresh (hourly): ~5,000 calls/day
 * - Historical backfill (rare): ~500 calls/day
 * - Buffer for errors/retries: ~2,000 calls/day
 * Total: ~9,140 calls/day (~274k/month)
 *
 * This leaves ~226k calls/month buffer for growth.
 */

// Analyst plan limits
export const ANALYST_PLAN = {
  monthlyCredits: 500_000,
  dailyBudget: 16_666,
  hourlyBudget: 694,
  ratePerMinute: 500,
};

// Budget allocation by category
export const BUDGET_ALLOCATION = {
  prices: {
    callsPerDay: 1440,
    description: 'Top 200 coins prices, refreshed every 60s',
  },
  ohlcv: {
    callsPerDay: 200,
    description: 'OHLCV data for top coins',
  },
  metadata: {
    callsPerDay: 5000,
    description: 'Coin metadata, refreshed hourly',
  },
  historical: {
    callsPerDay: 500,
    description: 'Historical data backfills',
  },
  buffer: {
    callsPerDay: 2000,
    description: 'Buffer for retries and errors',
  },
};

// Calculate totals
const totalDailyAllocated = Object.values(BUDGET_ALLOCATION).reduce(
  (sum, cat) => sum + cat.callsPerDay,
  0
);

export const BUDGET_SUMMARY = {
  dailyAllocated: totalDailyAllocated,
  dailyRemaining: ANALYST_PLAN.dailyBudget - totalDailyAllocated,
  monthlyEstimate: totalDailyAllocated * 30,
  monthlyRemaining: ANALYST_PLAN.monthlyCredits - totalDailyAllocated * 30,
  utilizationPercent: (totalDailyAllocated / ANALYST_PLAN.dailyBudget) * 100,
};

// In-memory budget tracking
interface BudgetTracker {
  date: string; // YYYY-MM-DD
  calls: Record<string, number>;
  totalCalls: number;
}

let currentBudget: BudgetTracker = {
  date: new Date().toISOString().split('T')[0],
  calls: {},
  totalCalls: 0,
};

/**
 * Get current date string
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Reset budget tracker if it's a new day
 */
function checkAndResetDaily(): void {
  const today = getCurrentDate();
  if (currentBudget.date !== today) {
    // Log previous day's usage before reset
    console.log(
      `[CoinGecko Budget] Day ${currentBudget.date} ended with ${currentBudget.totalCalls} calls`
    );

    currentBudget = {
      date: today,
      calls: {},
      totalCalls: 0,
    };
  }
}

/**
 * Track an API call
 */
export function trackCall(category: string): void {
  checkAndResetDaily();

  currentBudget.calls[category] = (currentBudget.calls[category] || 0) + 1;
  currentBudget.totalCalls++;

  // Warn if approaching limits
  const utilizationPercent = (currentBudget.totalCalls / ANALYST_PLAN.dailyBudget) * 100;
  if (utilizationPercent > 80) {
    console.warn(
      `[CoinGecko Budget] Warning: ${utilizationPercent.toFixed(1)}% of daily budget used`
    );
  }
}

/**
 * Check if we can make a call for a given category
 */
export function canMakeCall(category: string): boolean {
  checkAndResetDaily();

  // Check daily total
  if (currentBudget.totalCalls >= ANALYST_PLAN.dailyBudget) {
    console.error('[CoinGecko Budget] Daily budget exhausted');
    return false;
  }

  // Check category allocation
  const allocation = BUDGET_ALLOCATION[category as keyof typeof BUDGET_ALLOCATION];
  if (allocation) {
    const categoryUsed = currentBudget.calls[category] || 0;
    if (categoryUsed >= allocation.callsPerDay) {
      console.warn(`[CoinGecko Budget] Category "${category}" budget exhausted`);
      return false;
    }
  }

  return true;
}

/**
 * Get current budget status
 */
export function getBudgetStatus(): {
  date: string;
  totalUsed: number;
  totalBudget: number;
  remainingToday: number;
  utilizationPercent: number;
  byCategory: Record<string, { used: number; allocated: number; remaining: number }>;
} {
  checkAndResetDaily();

  const byCategory: Record<string, { used: number; allocated: number; remaining: number }> = {};

  for (const [key, allocation] of Object.entries(BUDGET_ALLOCATION)) {
    const used = currentBudget.calls[key] || 0;
    byCategory[key] = {
      used,
      allocated: allocation.callsPerDay,
      remaining: allocation.callsPerDay - used,
    };
  }

  return {
    date: currentBudget.date,
    totalUsed: currentBudget.totalCalls,
    totalBudget: ANALYST_PLAN.dailyBudget,
    remainingToday: ANALYST_PLAN.dailyBudget - currentBudget.totalCalls,
    utilizationPercent: (currentBudget.totalCalls / ANALYST_PLAN.dailyBudget) * 100,
    byCategory,
  };
}

/**
 * Get monthly projection based on current usage
 */
export function getMonthlyProjection(): {
  currentDayUsage: number;
  projectedMonthlyUsage: number;
  monthlyBudget: number;
  onTrack: boolean;
  message: string;
} {
  checkAndResetDaily();

  const projectedMonthly = currentBudget.totalCalls * 30;
  const onTrack = projectedMonthly <= ANALYST_PLAN.monthlyCredits;

  let message: string;
  if (projectedMonthly < ANALYST_PLAN.monthlyCredits * 0.5) {
    message = 'Well under budget - room to add more features';
  } else if (projectedMonthly < ANALYST_PLAN.monthlyCredits * 0.8) {
    message = 'Healthy usage - within comfortable margins';
  } else if (projectedMonthly < ANALYST_PLAN.monthlyCredits) {
    message = 'Approaching budget - monitor closely';
  } else {
    message = 'Over budget projection - reduce API calls or upgrade plan';
  }

  return {
    currentDayUsage: currentBudget.totalCalls,
    projectedMonthlyUsage: projectedMonthly,
    monthlyBudget: ANALYST_PLAN.monthlyCredits,
    onTrack,
    message,
  };
}

/**
 * Log budget summary (for debugging/monitoring)
 */
export function logBudgetSummary(): void {
  const status = getBudgetStatus();
  const projection = getMonthlyProjection();

  console.log('=== CoinGecko Budget Summary ===');
  console.log(`Date: ${status.date}`);
  console.log(`Daily: ${status.totalUsed}/${status.totalBudget} (${status.utilizationPercent.toFixed(1)}%)`);
  console.log(`Projected Monthly: ${projection.projectedMonthlyUsage}/${projection.monthlyBudget}`);
  console.log(`Status: ${projection.message}`);
  console.log('By Category:');
  for (const [cat, data] of Object.entries(status.byCategory)) {
    console.log(`  ${cat}: ${data.used}/${data.allocated}`);
  }
  console.log('================================');
}
