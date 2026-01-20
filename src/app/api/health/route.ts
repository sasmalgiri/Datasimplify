/**
 * Health Check API
 *
 * Returns the health status of CryptoReportKit services.
 * Used by status page and external monitoring.
 *
 * GET /api/health - Full health check
 * GET /api/health?quick=true - Quick health check (just API status)
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isEncryptionConfigured } from '@/lib/encryption';

interface HealthCheckResult {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  message?: string;
  lastCheck: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: HealthCheckResult[];
  scheduled_exports?: {
    last_run: string | null;
    next_run: string | null;
    active_count: number;
  };
}

// Check Supabase connection
async function checkSupabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  const service = 'Database (Supabase)';

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return {
        service,
        status: 'down',
        message: 'Missing configuration',
        lastCheck: new Date().toISOString(),
      };
    }

    const supabase = createClient(url, key);
    const { error } = await supabase.from('user_profiles').select('id').limit(1);

    const latency = Date.now() - start;

    if (error) {
      return {
        service,
        status: 'down',
        latency,
        message: error.message,
        lastCheck: new Date().toISOString(),
      };
    }

    return {
      service,
      status: latency > 2000 ? 'degraded' : 'operational',
      latency,
      lastCheck: new Date().toISOString(),
    };
  } catch (err) {
    return {
      service,
      status: 'down',
      message: err instanceof Error ? err.message : 'Unknown error',
      lastCheck: new Date().toISOString(),
    };
  }
}

// Check CoinGecko API (free tier)
async function checkCoinGecko(): Promise<HealthCheckResult> {
  const start = Date.now();
  const service = 'CoinGecko API';

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/ping', {
      headers: { Accept: 'application/json' },
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        service,
        status: response.status === 429 ? 'degraded' : 'down',
        latency,
        message: `HTTP ${response.status}`,
        lastCheck: new Date().toISOString(),
      };
    }

    return {
      service,
      status: latency > 3000 ? 'degraded' : 'operational',
      latency,
      lastCheck: new Date().toISOString(),
    };
  } catch (err) {
    return {
      service,
      status: 'down',
      message: err instanceof Error ? err.message : 'Connection failed',
      lastCheck: new Date().toISOString(),
    };
  }
}

// Check encryption configuration
function checkEncryption(): HealthCheckResult {
  const service = 'Encryption Service';

  const isConfigured = isEncryptionConfigured();

  return {
    service,
    status: isConfigured ? 'operational' : 'down',
    message: isConfigured ? undefined : 'ENCRYPTION_MASTER_KEY not configured',
    lastCheck: new Date().toISOString(),
  };
}

// Check scheduled exports status
async function checkScheduledExports(): Promise<{
  result: HealthCheckResult;
  details: { last_run: string | null; next_run: string | null; active_count: number };
}> {
  const service = 'Scheduled Exports';

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return {
        result: {
          service,
          status: 'down',
          message: 'Database not configured',
          lastCheck: new Date().toISOString(),
        },
        details: { last_run: null, next_run: null, active_count: 0 },
      };
    }

    const supabase = createClient(url, key);

    // Get last run time and active count
    const { data: schedules, error } = await supabase
      .from('scheduled_exports')
      .select('last_run_at, next_run_at, is_active')
      .eq('is_active', true)
      .order('last_run_at', { ascending: false })
      .limit(100);

    if (error) {
      return {
        result: {
          service,
          status: 'down',
          message: error.message,
          lastCheck: new Date().toISOString(),
        },
        details: { last_run: null, next_run: null, active_count: 0 },
      };
    }

    const activeCount = schedules?.length || 0;
    const lastRun = schedules?.[0]?.last_run_at || null;

    // Find next scheduled run
    const now = new Date();
    const nextSchedule = schedules
      ?.filter((s) => s.next_run_at && new Date(s.next_run_at) > now)
      .sort((a, b) => new Date(a.next_run_at).getTime() - new Date(b.next_run_at).getTime())[0];

    const nextRun = nextSchedule?.next_run_at || null;

    // Check if cron is working (last run within expected window)
    let status: 'operational' | 'degraded' | 'down' = 'operational';
    let message: string | undefined;

    if (activeCount > 0 && lastRun) {
      const lastRunDate = new Date(lastRun);
      const hoursSinceLastRun = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60);

      // If there are active schedules but no run in 25 hours, something might be wrong
      if (hoursSinceLastRun > 25) {
        status = 'degraded';
        message = 'No recent runs detected';
      }
    }

    return {
      result: {
        service,
        status,
        message,
        lastCheck: new Date().toISOString(),
      },
      details: {
        last_run: lastRun,
        next_run: nextRun,
        active_count: activeCount,
      },
    };
  } catch (err) {
    return {
      result: {
        service,
        status: 'down',
        message: err instanceof Error ? err.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      },
      details: { last_run: null, next_run: null, active_count: 0 },
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const quick = searchParams.get('quick') === 'true';

  const timestamp = new Date().toISOString();
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

  // Quick health check - just return API status
  if (quick) {
    return NextResponse.json({
      status: 'healthy',
      timestamp,
      version,
    });
  }

  // Full health check
  const [supabaseResult, coinGeckoResult, scheduledExportsResult] = await Promise.all([
    checkSupabase(),
    checkCoinGecko(),
    checkScheduledExports(),
  ]);

  const encryptionResult = checkEncryption();

  const services: HealthCheckResult[] = [
    supabaseResult,
    coinGeckoResult,
    encryptionResult,
    scheduledExportsResult.result,
  ];

  // Calculate overall status
  const hasDown = services.some((s) => s.status === 'down');
  const hasDegraded = services.some((s) => s.status === 'degraded');
  const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = hasDown
    ? 'unhealthy'
    : hasDegraded
      ? 'degraded'
      : 'healthy';

  const response: HealthResponse = {
    status: overallStatus,
    timestamp,
    version,
    services,
    scheduled_exports: scheduledExportsResult.details,
  };

  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, { status: httpStatus });
}
