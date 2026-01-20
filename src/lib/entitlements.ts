/**
 * Entitlement Enforcement Utility
 *
 * Centralized subscription/plan gating for all API endpoints.
 * Checks user's subscription tier and enforces limits.
 *
 * Usage:
 *   const entitlement = await checkEntitlement(supabase, user.id);
 *   if (!entitlement.allowed) {
 *     return NextResponse.json({ error: entitlement.error, code: entitlement.code }, { status: entitlement.status });
 *   }
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type SubscriptionTier = 'free' | 'pro' | 'premium';
export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | null;

export interface UserEntitlement {
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  downloadsLimit: number;
  downloadsUsed: number;
  scheduledExportsLimit: number;
  maxCoinsPerRequest: number;
  maxOhlcvDays: number;
  canAccessPremiumFeatures: boolean;
  canDownload: boolean;
  canScheduleExports: boolean;
  canUsePacks: boolean;
  canUseFormulas: boolean;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  entitlement?: UserEntitlement;
  error?: string;
  code?: string;
  status?: number;
}

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS = {
  free: {
    downloads: 5,
    scheduledExports: 0,
    maxCoinsPerRequest: 10,
    maxOhlcvDays: 7,
    canAccessPremiumFeatures: false,
    canScheduleExports: false,
  },
  pro: {
    downloads: 100,
    scheduledExports: 5,
    maxCoinsPerRequest: 100,
    maxOhlcvDays: 365,
    canAccessPremiumFeatures: true,
    canScheduleExports: true,
  },
  premium: {
    downloads: 999999, // Unlimited
    scheduledExports: 25,
    maxCoinsPerRequest: 500,
    maxOhlcvDays: 730, // 2 years
    canAccessPremiumFeatures: true,
    canScheduleExports: true,
  },
};

/**
 * Check if subscription status allows access
 */
function isStatusActive(status: SubscriptionStatus): boolean {
  // Active and trialing allow full access
  // Cancelled users keep access until period end (handled by webhook setting tier to free)
  // Past due gets grace period (we allow access but should prompt to update payment)
  return status === 'active' || status === 'trialing' || status === null;
}

/**
 * Get user's entitlement from database
 */
export async function getUserEntitlement(
  supabase: SupabaseClient,
  userId: string
): Promise<UserEntitlement | null> {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select(
      'subscription_tier, subscription_status, downloads_limit, downloads_this_month'
    )
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return null;
  }

  const tier = (profile.subscription_tier || 'free') as SubscriptionTier;
  const status = profile.subscription_status as SubscriptionStatus;
  const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free;

  const isActive = isStatusActive(status);

  return {
    userId,
    tier,
    status,
    downloadsLimit: profile.downloads_limit || limits.downloads,
    downloadsUsed: profile.downloads_this_month || 0,
    scheduledExportsLimit: limits.scheduledExports,
    maxCoinsPerRequest: limits.maxCoinsPerRequest,
    maxOhlcvDays: limits.maxOhlcvDays,
    canAccessPremiumFeatures: isActive && limits.canAccessPremiumFeatures,
    canDownload:
      isActive &&
      (profile.downloads_this_month || 0) <
        (profile.downloads_limit || limits.downloads),
    canScheduleExports: isActive && limits.canScheduleExports,
    canUsePacks: true, // All tiers can use packs (with limits)
    canUseFormulas: true, // All tiers can use formulas (with limits)
  };
}

/**
 * Check entitlement for API access
 * Returns allowed: true if user can proceed, with entitlement details
 * Returns allowed: false with error details if blocked
 */
export async function checkEntitlement(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    requirePremium?: boolean;
    requireScheduledExports?: boolean;
    requireDownload?: boolean;
    coinsRequested?: number;
    ohlcvDaysRequested?: number;
  }
): Promise<EntitlementCheckResult> {
  const entitlement = await getUserEntitlement(supabase, userId);

  if (!entitlement) {
    return {
      allowed: false,
      error: 'User profile not found',
      code: 'PROFILE_NOT_FOUND',
      status: 404,
    };
  }

  // Check subscription status
  if (
    entitlement.status === 'paused' ||
    entitlement.status === 'cancelled'
  ) {
    // Paused/cancelled users are downgraded to free
    // If they're trying premium features, block
    if (options?.requirePremium) {
      return {
        allowed: false,
        entitlement,
        error:
          'Your subscription is inactive. Please renew to access this feature.',
        code: 'SUBSCRIPTION_INACTIVE',
        status: 403,
      };
    }
  }

  // Check if past due (grace period - warn but allow)
  // The webhook will eventually downgrade if payment isn't resolved

  // Check premium feature requirement
  if (options?.requirePremium && !entitlement.canAccessPremiumFeatures) {
    return {
      allowed: false,
      entitlement,
      error: 'This feature requires a Pro or Premium subscription.',
      code: 'SUBSCRIPTION_REQUIRED',
      status: 402,
    };
  }

  // Check scheduled exports requirement
  if (options?.requireScheduledExports && !entitlement.canScheduleExports) {
    return {
      allowed: false,
      entitlement,
      error:
        'Scheduled exports require a Pro or Premium subscription.',
      code: 'SUBSCRIPTION_REQUIRED',
      status: 402,
    };
  }

  // Check download limit
  if (options?.requireDownload && !entitlement.canDownload) {
    return {
      allowed: false,
      entitlement,
      error: `You've reached your monthly download limit (${entitlement.downloadsLimit}). Upgrade for more downloads.`,
      code: 'DOWNLOAD_LIMIT_REACHED',
      status: 402,
    };
  }

  // Check coins limit
  if (
    options?.coinsRequested &&
    options.coinsRequested > entitlement.maxCoinsPerRequest
  ) {
    return {
      allowed: false,
      entitlement,
      error: `Your plan allows up to ${entitlement.maxCoinsPerRequest} coins per request. Upgrade for more.`,
      code: 'COINS_LIMIT_EXCEEDED',
      status: 402,
    };
  }

  // Check OHLCV days limit
  if (
    options?.ohlcvDaysRequested &&
    options.ohlcvDaysRequested > entitlement.maxOhlcvDays
  ) {
    return {
      allowed: false,
      entitlement,
      error: `Your plan allows up to ${entitlement.maxOhlcvDays} days of historical data. Upgrade for more.`,
      code: 'OHLCV_DAYS_LIMIT_EXCEEDED',
      status: 402,
    };
  }

  return {
    allowed: true,
    entitlement,
  };
}

/**
 * Increment download count for user
 */
export async function incrementDownloadCount(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    // Try to use RPC for atomic increment
    const { error: rpcError } = await supabase.rpc('increment_downloads', { user_id: userId });

    if (rpcError) {
      // Fallback: fetch and update
      const { data } = await supabase
        .from('user_profiles')
        .select('downloads_this_month')
        .eq('id', userId)
        .single();

      if (data) {
        await supabase
          .from('user_profiles')
          .update({ downloads_this_month: (data.downloads_this_month || 0) + 1 })
          .eq('id', userId);
      }
    }
  } catch {
    // Silently fail - download tracking is non-critical
    console.error('Failed to increment download count');
  }
}

/**
 * Apply plan limits to request parameters
 * Returns sanitized values within user's limits
 */
export function applyPlanLimits(
  entitlement: UserEntitlement,
  params: {
    coins?: string[];
    ohlcvDays?: number;
  }
): {
  coins: string[];
  ohlcvDays: number;
  wasLimited: boolean;
} {
  let wasLimited = false;

  // Limit coins
  let coins = params.coins || [];
  if (coins.length > entitlement.maxCoinsPerRequest) {
    coins = coins.slice(0, entitlement.maxCoinsPerRequest);
    wasLimited = true;
  }

  // Limit OHLCV days
  let ohlcvDays = params.ohlcvDays || 30;
  if (ohlcvDays > entitlement.maxOhlcvDays) {
    ohlcvDays = entitlement.maxOhlcvDays;
    wasLimited = true;
  }

  return { coins, ohlcvDays, wasLimited };
}

/**
 * Error response helper for entitlement failures
 */
export function createEntitlementErrorResponse(result: EntitlementCheckResult) {
  return {
    error: result.error,
    code: result.code,
    upgrade_url: '/pricing',
    current_tier: result.entitlement?.tier,
  };
}
