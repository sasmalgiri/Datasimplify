import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createClient } from '@supabase/supabase-js';
import { FEATURES } from '@/lib/featureFlags';

const VALID_ACTIONS = ['refresh', 'export_pdf', 'export_csv', 'export_excel'] as const;
type ActionType = (typeof VALID_ACTIONS)[number];

const TOKEN_TTL_MS = 90_000; // 90 seconds

/**
 * POST /api/v1/authorize-action
 *
 * Issues a short-lived action token for gated operations (refresh, export).
 * The add-in must call this before performing expensive actions.
 * Token is single-use and expires in 90 seconds.
 *
 * Feature-flagged: requires NEXT_PUBLIC_FEATURE_ADDIN_V2=true
 */
export async function POST(req: NextRequest) {
  if (!FEATURES.addinV2) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const { user, error: authError } = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = body.action as ActionType;
  if (!action || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
      { status: 400 },
    );
  }

  // Check subscription entitlement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();

  const tier = (profile?.subscription_tier || 'free') as string;

  // Free tier can still use actions (controlled by entitlements elsewhere)
  // This route just issues the token — entitlement limits are checked at action time

  // Generate short-lived token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  const { error: insertError } = await supabase
    .from('action_tokens')
    .insert({
      user_id: user.id,
      action,
      token,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error('[authorize-action] Insert error:', insertError);
    return NextResponse.json({ error: 'Failed to create action token' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    token,
    action,
    expiresAt,
    tier,
  });
}

/**
 * Verify an action token (called server-side by other routes)
 * Consumes the token on successful verification.
 */
export async function verifyActionToken(
  userId: string,
  token: string,
  action: string,
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return false;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('action_tokens')
    .select('id, expires_at')
    .eq('token', token)
    .eq('user_id', userId)
    .eq('action', action)
    .eq('consumed', false)
    .maybeSingle();

  if (error || !data) return false;
  if (new Date(data.expires_at) < new Date()) return false;

  // Consume the token
  await supabase
    .from('action_tokens')
    .update({ consumed: true })
    .eq('id', data.id);

  return true;
}
