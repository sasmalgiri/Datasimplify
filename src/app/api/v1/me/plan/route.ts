/**
 * User Plan & Status API
 *
 * Returns the current user's subscription plan, connected providers,
 * and usage limits
 *
 * GET /api/v1/me/plan
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Plan limits configuration
const PLAN_LIMITS = {
  free: {
    dailyApiCalls: 100,
    scheduledExports: 0,
    maxCoinsPerRequest: 25,
    maxReportRecipes: 3,
    features: ['basic_templates', 'manual_refresh'],
  },
  pro: {
    dailyApiCalls: 5000,
    scheduledExports: 5,
    maxCoinsPerRequest: 100,
    maxReportRecipes: 25,
    features: [
      'basic_templates',
      'advanced_templates',
      'manual_refresh',
      'scheduled_exports',
      'priority_support',
    ],
  },
  premium: {
    dailyApiCalls: 50000,
    scheduledExports: 25,
    maxCoinsPerRequest: 500,
    maxReportRecipes: 100,
    features: [
      'basic_templates',
      'advanced_templates',
      'premium_templates',
      'manual_refresh',
      'scheduled_exports',
      'api_access',
      'white_label',
      'priority_support',
      'dedicated_support',
    ],
  },
} as const;

type PlanType = keyof typeof PLAN_LIMITS;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile with plan info
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, downloads_count, created_at')
    .eq('id', user.id)
    .single();

  const plan = (profile?.plan || 'free') as PlanType;

  // Get connected providers
  const { data: keys } = await supabase
    .from('provider_keys')
    .select('provider, is_valid, updated_at')
    .eq('user_id', user.id);

  const connectedProviders =
    keys?.reduce(
      (acc, k) => {
        acc[k.provider] = {
          connected: true,
          isValid: k.is_valid,
          updatedAt: k.updated_at,
        };
        return acc;
      },
      {} as Record<
        string,
        { connected: boolean; isValid: boolean; updatedAt: string }
      >
    ) || {};

  // Get today's API usage count
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: todayApiCalls } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('event_type', ['api_price', 'api_ohlcv', 'api_info'])
    .gte('created_at', today.toISOString());

  // Get scheduled exports count
  const { count: scheduledExportsCount } = await supabase
    .from('scheduled_exports')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true);

  // Get saved recipes count
  const { count: recipesCount } = await supabase
    .from('report_recipes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const limits = PLAN_LIMITS[plan];

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      createdAt: profile?.created_at,
    },
    subscription: {
      plan,
      displayName: getPlanDisplayName(plan),
      limits,
      features: limits.features,
    },
    usage: {
      downloadsCount: profile?.downloads_count || 0,
      todayApiCalls: todayApiCalls || 0,
      scheduledExports: scheduledExportsCount || 0,
      savedRecipes: recipesCount || 0,
    },
    quotas: {
      apiCalls: {
        used: todayApiCalls || 0,
        limit: limits.dailyApiCalls,
        remaining: Math.max(0, limits.dailyApiCalls - (todayApiCalls || 0)),
        resetAt: getNextMidnight().toISOString(),
      },
      scheduledExports: {
        used: scheduledExportsCount || 0,
        limit: limits.scheduledExports,
        remaining: Math.max(
          0,
          limits.scheduledExports - (scheduledExportsCount || 0)
        ),
      },
      recipes: {
        used: recipesCount || 0,
        limit: limits.maxReportRecipes,
        remaining: Math.max(
          0,
          limits.maxReportRecipes - (recipesCount || 0)
        ),
      },
    },
    connectedProviders,
    providers: {
      coingecko: {
        name: 'CoinGecko',
        description: 'Price, market cap, OHLCV data',
        signupUrl: 'https://www.coingecko.com/en/api/pricing',
        connected: !!connectedProviders['coingecko']?.connected,
        isValid: connectedProviders['coingecko']?.isValid ?? false,
      },
      coinmarketcap: {
        name: 'CoinMarketCap',
        description: 'Alternative market data source',
        signupUrl: 'https://coinmarketcap.com/api/',
        connected: !!connectedProviders['coinmarketcap']?.connected,
        isValid: connectedProviders['coinmarketcap']?.isValid ?? false,
      },
      messari: {
        name: 'Messari',
        description: 'Research-grade crypto data',
        signupUrl: 'https://messari.io/api',
        connected: !!connectedProviders['messari']?.connected,
        isValid: connectedProviders['messari']?.isValid ?? false,
      },
    },
  });
}

function getPlanDisplayName(plan: PlanType): string {
  const names: Record<PlanType, string> = {
    free: 'Free',
    pro: 'Pro',
    premium: 'Premium',
  };
  return names[plan];
}

function getNextMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}
