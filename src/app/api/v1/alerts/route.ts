/**
 * Price Alerts Endpoint
 *
 * GET /api/v1/alerts - List user's active alerts
 * POST /api/v1/alerts - Create a new alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { getUserEntitlement, PLAN_LIMITS } from '@/lib/entitlements';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    const { data: alerts, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }

    return NextResponse.json({ alerts: alerts || [] });
  } catch (err) {
    console.error('[Alerts GET] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    // Pro+ required for alerts
    const entitlement = await getUserEntitlement(supabase, user.id);
    const tier = entitlement?.tier || 'free';
    if (tier === 'free') {
      return NextResponse.json({
        error: 'Price alerts require Pro plan. Upgrade at cryptoreportkit.com/pricing',
        code: 'SUBSCRIPTION_REQUIRED',
      }, { status: 402 });
    }

    const limits = PLAN_LIMITS[tier];
    const { count } = await supabase
      .from('price_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if ((count || 0) >= limits.maxAlerts) {
      return NextResponse.json({
        error: `Alert limit reached (${limits.maxAlerts}). Delete existing alerts or upgrade.`,
        code: 'ALERT_LIMIT_REACHED',
      }, { status: 429 });
    }

    const body = await request.json();
    const { coin_id, alert_type, threshold } = body;

    if (!coin_id || !alert_type || threshold === undefined) {
      return NextResponse.json({ error: 'Missing: coin_id, alert_type, threshold' }, { status: 400 });
    }

    if (!['above', 'below'].includes(alert_type)) {
      return NextResponse.json({ error: 'alert_type must be "above" or "below"' }, { status: 400 });
    }

    if (typeof threshold !== 'number' || threshold <= 0) {
      return NextResponse.json({ error: 'threshold must be a positive number' }, { status: 400 });
    }

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: user.id,
        coin_id: coin_id.toLowerCase(),
        alert_type,
        threshold,
      })
      .select()
      .single();

    if (error) {
      console.error('[Alerts POST] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }

    return NextResponse.json({ alert, message: 'Alert created' }, { status: 201 });
  } catch (err) {
    console.error('[Alerts POST] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
