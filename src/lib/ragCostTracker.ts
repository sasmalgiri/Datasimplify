// ============================================
// RAG COST & TOKEN TRACKING
// Track usage for billing and rate limiting
// ============================================

import { supabase, isSupabaseConfigured } from './supabase';

// Token costs per 1M tokens (approximate)
const TOKEN_COSTS: Record<string, Record<string, { input: number; output: number }>> = {
  'groq': {
    'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 }, // Free tier, but tracking for limits
    'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
    'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
  },
  'openai': {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  },
};

// In-memory usage tracking (persisted to DB periodically)
interface UserUsage {
  tokensUsed: number;
  queriesCount: number;
  estimatedCostUsd: number;
  lastQueryTime: number;
  providers: Record<string, number>;
}

const usageCache = new Map<string, UserUsage>();

// Rate limits
const RATE_LIMITS = {
  free: { tokensPerDay: 50000, queriesPerMinute: 10 },
  starter: { tokensPerDay: 200000, queriesPerMinute: 30 },
  pro: { tokensPerDay: 1000000, queriesPerMinute: 60 },
  business: { tokensPerDay: 5000000, queriesPerMinute: 120 },
};

type PlanType = keyof typeof RATE_LIMITS;

/**
 * Track token usage for a user
 */
export function trackUsage(
  userId: string,
  tokensUsed: number,
  provider: string,
  model: string
): void {
  const usage = usageCache.get(userId) || {
    tokensUsed: 0,
    queriesCount: 0,
    estimatedCostUsd: 0,
    lastQueryTime: 0,
    providers: {},
  };

  // Update token count
  usage.tokensUsed += tokensUsed;
  usage.queriesCount++;
  usage.lastQueryTime = Date.now();

  // Track by provider
  usage.providers[provider] = (usage.providers[provider] || 0) + tokensUsed;

  // Estimate cost
  const providerCosts = TOKEN_COSTS[provider as keyof typeof TOKEN_COSTS];
  if (providerCosts) {
    const modelCosts = providerCosts[model as keyof typeof providerCosts];
    if (modelCosts) {
      // Assume 50/50 input/output split
      const avgCostPerToken = ((modelCosts.input + modelCosts.output) / 2) / 1000000;
      usage.estimatedCostUsd += tokensUsed * avgCostPerToken;
    }
  }

  usageCache.set(userId, usage);
}

/**
 * Get user's current usage
 */
export function getUsage(userId: string): UserUsage {
  return usageCache.get(userId) || {
    tokensUsed: 0,
    queriesCount: 0,
    estimatedCostUsd: 0,
    lastQueryTime: 0,
    providers: {},
  };
}

/**
 * Check if user is within rate limits
 */
export function checkRateLimit(
  userId: string,
  plan: PlanType = 'free'
): { allowed: boolean; reason?: string; resetIn?: number } {
  const usage = getUsage(userId);
  const limits = RATE_LIMITS[plan];

  // Check daily token limit
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const msInDay = Date.now() - dayStart.getTime();

  // Simple daily reset check
  if (usage.tokensUsed >= limits.tokensPerDay) {
    const msUntilReset = 24 * 60 * 60 * 1000 - msInDay;
    return {
      allowed: false,
      reason: `Daily token limit reached (${limits.tokensPerDay.toLocaleString()} tokens)`,
      resetIn: msUntilReset,
    };
  }

  // Check queries per minute (simple sliding window)
  const oneMinuteAgo = Date.now() - 60000;
  if (usage.lastQueryTime > oneMinuteAgo) {
    // Count recent queries (simplified - would need more tracking for accurate rate limiting)
    // For now, just allow
  }

  return { allowed: true };
}

/**
 * Get usage summary for a user
 */
export function getUsageSummary(userId: string, plan: PlanType = 'free'): {
  tokensUsed: number;
  tokensRemaining: number;
  queriesCount: number;
  estimatedCostUsd: string;
  usagePercent: number;
  providers: Record<string, number>;
} {
  const usage = getUsage(userId);
  const limits = RATE_LIMITS[plan];

  return {
    tokensUsed: usage.tokensUsed,
    tokensRemaining: Math.max(0, limits.tokensPerDay - usage.tokensUsed),
    queriesCount: usage.queriesCount,
    estimatedCostUsd: usage.estimatedCostUsd.toFixed(4),
    usagePercent: Math.min(100, Math.round((usage.tokensUsed / limits.tokensPerDay) * 100)),
    providers: usage.providers,
  };
}

/**
 * Reset daily usage (call at midnight)
 */
export function resetDailyUsage(): void {
  usageCache.clear();
}

/**
 * Persist usage to database (call periodically)
 */
export async function persistUsageToDb(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const today = new Date().toISOString().split('T')[0];

  for (const [userId, usage] of usageCache.entries()) {
    try {
      // Upsert daily usage
      await supabase.from('user_daily_usage').upsert({
        user_id: userId,
        date: today,
        tokens_used: usage.tokensUsed,
        queries_count: usage.queriesCount,
        estimated_cost_usd: usage.estimatedCostUsd,
        providers: usage.providers,
      }, {
        onConflict: 'user_id,date',
      });
    } catch (error) {
      console.error('Failed to persist usage for user:', userId, error);
    }
  }
}

/**
 * Get aggregate usage stats (for admin)
 */
export function getAggregateStats(): {
  totalTokens: number;
  totalQueries: number;
  totalCostUsd: string;
  activeUsers: number;
  byProvider: Record<string, number>;
} {
  let totalTokens = 0;
  let totalQueries = 0;
  let totalCostUsd = 0;
  const byProvider: Record<string, number> = {};

  for (const usage of usageCache.values()) {
    totalTokens += usage.tokensUsed;
    totalQueries += usage.queriesCount;
    totalCostUsd += usage.estimatedCostUsd;

    for (const [provider, tokens] of Object.entries(usage.providers)) {
      byProvider[provider] = (byProvider[provider] || 0) + tokens;
    }
  }

  return {
    totalTokens,
    totalQueries,
    totalCostUsd: totalCostUsd.toFixed(4),
    activeUsers: usageCache.size,
    byProvider,
  };
}
