/**
 * Client Usage Sync Endpoint
 *
 * Receives batched usage reports from the Excel add-in's client-side
 * tracking and persists them for quota enforcement.
 *
 * POST /api/v1/usage/report
 * Body: { date: string, clientCount: number, source: string }
 */

import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthUser(request);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getSupabaseClient(request);
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  let body: { date?: string; clientCount?: number; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { date, clientCount, source } = body;

  if (!date || typeof clientCount !== 'number') {
    return NextResponse.json(
      { error: 'date (string) and clientCount (number) are required' },
      { status: 400 }
    );
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
  }

  try {
    // Upsert daily usage - take the max of existing and reported count
    const { data: existing } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('event_type', ['api_price', 'api_ohlcv', 'api_info', 'api_addin_call'])
      .gte('created_at', `${date}T00:00:00.000Z`)
      .lt('created_at', `${date}T23:59:59.999Z`);

    const serverCount = existing ?? 0;

    // If client reports more than server knows, log the delta as bulk events
    if (clientCount > (serverCount as number)) {
      const delta = clientCount - (serverCount as number);
      // Insert a single summary event for the delta
      await supabase.from('usage_events').insert({
        user_id: user.id,
        event_type: 'api_addin_call',
        metadata: {
          source: source || 'excel_addin',
          batch_count: delta,
          client_total: clientCount,
          reported_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ ok: true, serverCount, clientCount });
  } catch (err) {
    console.error('Usage report error:', err);
    return NextResponse.json({ error: 'Failed to record usage' }, { status: 500 });
  }
}
