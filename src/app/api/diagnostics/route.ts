import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Protect diagnostics endpoint (avoid exposing internal state publicly)
const SYNC_SECRET_KEY = (process.env.SYNC_SECRET_KEY || '').trim();
const DEV_FALLBACK_SECRET = 'dev-secret-change-in-production';

function getExpectedSecret(): string | null {
  if (SYNC_SECRET_KEY) return SYNC_SECRET_KEY;
  if (process.env.NODE_ENV !== 'production') return DEV_FALLBACK_SECRET;
  return null;
}

function getProvidedSecret(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  const authHeader = request.headers.get('Authorization');
  const headerSecret = authHeader?.replace(/^Bearer\s+/i, '') || null;
  return headerSecret || querySecret;
}

function assertAuthorized(request: Request): NextResponse | null {
  const expected = getExpectedSecret();
  if (!expected) {
    return NextResponse.json(
      { error: 'Diagnostics API not configured. Set SYNC_SECRET_KEY.' },
      { status: 503 }
    );
  }

  const provided = getProvidedSecret(request);
  if (!provided || provided !== expected) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide valid secret key via ?secret= or Authorization header.' },
      { status: 401 }
    );
  }

  return null;
}

// Diagnostic endpoint to check database state and pipeline health
export async function GET(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  const diagnostics: {
    supabase: { configured: boolean; connected: boolean; error?: string };
    tables: Record<string, { exists: boolean; rowCount: number; lastUpdated?: string }>;
    pipeline: { ready: boolean; issues: string[] };
    groq: { configured: boolean };
  } = {
    supabase: { configured: isSupabaseConfigured, connected: false },
    tables: {},
    pipeline: { ready: false, issues: [] },
    groq: { configured: !!process.env.GROQ_API_KEY },
  };

  // Check Supabase connection
  if (!isSupabaseConfigured || !supabase) {
    diagnostics.supabase.error = 'Supabase not configured';
    diagnostics.pipeline.issues.push('Supabase not configured');
    return NextResponse.json(diagnostics);
  }

  // Tables to check
  const tablesToCheck = [
    'market_data',
    'fear_greed_history',
    'whale_transactions',
    'derivatives_cache',
    'macro_data_cache',
    'prediction_cache',
    'defi_protocols',
    'coin_sentiment',
  ];

  // Check each table
  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        diagnostics.tables[table] = { exists: false, rowCount: 0 };
        diagnostics.pipeline.issues.push(`Table '${table}' error: ${error.message}`);
      } else {
        // Get last updated time if available
        let lastUpdated: string | undefined;
        if (data && data.length > 0) {
          const record = data[0];
          lastUpdated = record.updated_at || record.timestamp || record.fetched_at || record.recorded_at;
        }

        diagnostics.tables[table] = {
          exists: true,
          rowCount: count || 0,
          lastUpdated,
        };

        if ((count || 0) === 0) {
          diagnostics.pipeline.issues.push(`Table '${table}' is empty`);
        }
      }
    } catch {
      diagnostics.tables[table] = { exists: false, rowCount: 0 };
      diagnostics.pipeline.issues.push(`Table '${table}' check failed`);
    }
  }

  // Determine connection status
  diagnostics.supabase.connected = Object.values(diagnostics.tables).some(t => t.exists);

  // Check if pipeline is ready
  const criticalTables = ['market_data', 'fear_greed_history'];
  const criticalTablesReady = criticalTables.every(
    t => diagnostics.tables[t]?.exists && diagnostics.tables[t]?.rowCount > 0
  );

  diagnostics.pipeline.ready = criticalTablesReady && diagnostics.groq.configured;

  if (!diagnostics.groq.configured) {
    diagnostics.pipeline.issues.push('GROQ_API_KEY not configured');
  }

  return NextResponse.json(diagnostics);
}

// POST - Trigger initial data population
export async function POST(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { action } = await request.json();

  if (action === 'populate') {
    const results: Record<string, { success: boolean; message: string }> = {};

    // Trigger each API to populate cache
    const endpoints = [
      { name: 'crypto', url: '/api/crypto?limit=50' },
      { name: 'sentiment', url: '/api/sentiment' },
      { name: 'derivatives', url: '/api/derivatives' },
      { name: 'macro', url: '/api/macro' },
      { name: 'whales', url: '/api/whales?type=dashboard' },
    ];

    // Get base URL from request
    const baseUrl = new URL(request.url).origin;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint.url}`);
        const data = await response.json();
        results[endpoint.name] = {
          success: response.ok,
          message: response.ok ? `Fetched and cached` : data.error || 'Failed',
        };
      } catch (err) {
        results[endpoint.name] = {
          success: false,
          message: err instanceof Error ? err.message : 'Failed',
        };
      }
    }

    return NextResponse.json({
      action: 'populate',
      results,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ error: 'Invalid action. Use action: "populate"' }, { status: 400 });
}
