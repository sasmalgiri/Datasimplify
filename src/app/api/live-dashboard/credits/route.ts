import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  CREDIT_COSTS,
  CREDIT_PACKAGES,
  type CreditAction,
  type CreditPackageId,
} from '@/lib/live-dashboard/credits';

// ---------------------------------------------------------------------------
// Supabase service-role client (server-side only)
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ---------------------------------------------------------------------------
// IP-based rate limiting — 60 operations per minute per IP
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_OPS_PER_MINUTE = 60;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_OPS_PER_MINUTE - 1 };
  }

  if (entry.count >= MAX_OPS_PER_MINUTE) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_OPS_PER_MINUTE - entry.count };
}

// ---------------------------------------------------------------------------
// Helper — resolve user ID from Authorization header (Supabase JWT)
// ---------------------------------------------------------------------------
async function resolveUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  return data.user.id;
}

// ---------------------------------------------------------------------------
// Helper — get IP from request
// ---------------------------------------------------------------------------
function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  );
}

// ---------------------------------------------------------------------------
// GET /api/live-dashboard/credits — check credit balance
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);

    if (!userId) {
      return NextResponse.json({
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
        transactions: [],
        authenticated: false,
      });
    }

    // Fetch credit balance
    const { data: creditRow } = await supabase
      .from('dashboard_credits')
      .select('balance, total_purchased, total_used')
      .eq('user_id', userId)
      .single() as { data: { balance: number; total_purchased: number; total_used: number } | null };

    // Fetch recent transactions (last 100)
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('id, amount, action, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100) as { data: { id: string; amount: number; action: string; description: string; created_at: string }[] | null };

    return NextResponse.json({
      balance: creditRow?.balance ?? 0,
      totalPurchased: creditRow?.total_purchased ?? 0,
      totalUsed: creditRow?.total_used ?? 0,
      transactions: (transactions ?? []).map((t) => ({
        id: t.id,
        amount: t.amount,
        action: t.action,
        description: t.description,
        timestamp: new Date(t.created_at).getTime(),
      })),
      authenticated: true,
    });
  } catch (error: unknown) {
    console.error('[live-dashboard/credits] GET error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/live-dashboard/credits — record a credit operation
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request);

    // --- Rate limit check ---
    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 60 operations per minute.' },
        { status: 429 },
      );
    }

    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required for server-side credit operations.' },
        { status: 401 },
      );
    }

    // --- Parse & validate body ---
    const body = await request.json();
    const { action, creditAction, amount, packageId } = body as {
      action?: 'purchase' | 'use' | 'bonus';
      creditAction?: CreditAction;
      amount?: number;
      packageId?: CreditPackageId;
    };

    if (!action || !['purchase', 'use', 'bonus'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "purchase", "use", or "bonus".' },
        { status: 400 },
      );
    }

    // --- Ensure credit row exists ---
    await supabase
      .from('dashboard_credits')
      .upsert(
        { user_id: userId, balance: 0, total_purchased: 0, total_used: 0, updated_at: new Date().toISOString() },
        { onConflict: 'user_id', ignoreDuplicates: true },
      );

    // --- Fetch current balance ---
    const { data: currentRow } = await supabase
      .from('dashboard_credits')
      .select('balance, total_purchased, total_used')
      .eq('user_id', userId)
      .single() as { data: { balance: number; total_purchased: number; total_used: number } | null };

    const currentBalance = currentRow?.balance ?? 0;
    const currentPurchased = currentRow?.total_purchased ?? 0;
    const currentUsed = currentRow?.total_used ?? 0;

    let creditChange = 0;
    let transactionAction = '';
    let description = '';

    // ---- Handle: purchase ----
    if (action === 'purchase') {
      if (!packageId) {
        return NextResponse.json(
          { error: 'Missing packageId for purchase action.' },
          { status: 400 },
        );
      }

      const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
      if (!pkg) {
        return NextResponse.json(
          { error: `Unknown package: "${packageId}".` },
          { status: 400 },
        );
      }

      creditChange = pkg.credits;
      transactionAction = 'purchase';
      description = `Purchased ${pkg.name} package (${pkg.credits} credits for $${pkg.price})`;

      await supabase
        .from('dashboard_credits')
        .update({
          balance: currentBalance + creditChange,
          total_purchased: currentPurchased + creditChange,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    // ---- Handle: use ----
    else if (action === 'use') {
      if (!creditAction || !(creditAction in CREDIT_COSTS)) {
        return NextResponse.json(
          { error: 'Missing or invalid creditAction for use action.' },
          { status: 400 },
        );
      }

      const cost = CREDIT_COSTS[creditAction];

      // Free actions always succeed (no transaction recorded)
      if (cost === 0) {
        return NextResponse.json({
          success: true,
          balance: currentBalance,
          transaction: null,
          remaining,
        });
      }

      if (currentBalance < cost) {
        return NextResponse.json(
          { error: 'Insufficient credits.', balance: currentBalance, cost },
          { status: 402 },
        );
      }

      creditChange = -cost;
      transactionAction = creditAction;
      description = `Used ${cost} credit${cost !== 1 ? 's' : ''} for ${creditAction}`;

      await supabase
        .from('dashboard_credits')
        .update({
          balance: currentBalance + creditChange,
          total_used: currentUsed + cost,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    // ---- Handle: bonus (admin-only) ----
    else if (action === 'bonus') {
      // Verify admin: check if user has admin role in user_profiles or a dedicated admin check.
      // For now we check a simple env-based admin list.
      const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (!adminIds.includes(userId)) {
        return NextResponse.json(
          { error: 'Admin access required for bonus credits.' },
          { status: 403 },
        );
      }

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json(
          { error: 'Missing or invalid amount for bonus action.' },
          { status: 400 },
        );
      }

      creditChange = amount;
      transactionAction = 'bonus';
      description = body.description || `Admin bonus: ${amount} credits`;

      await supabase
        .from('dashboard_credits')
        .update({
          balance: currentBalance + creditChange,
          total_purchased: currentPurchased + creditChange,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    // --- Record transaction ---
    const transactionId = crypto.randomUUID();
    await supabase.from('credit_transactions').insert({
      id: transactionId,
      user_id: userId,
      amount: creditChange,
      action: transactionAction,
      description,
      created_at: new Date().toISOString(),
    });

    const newBalance = currentBalance + creditChange;

    return NextResponse.json({
      success: true,
      balance: newBalance,
      transaction: {
        id: transactionId,
        amount: creditChange,
        action: transactionAction,
        description,
        timestamp: Date.now(),
      },
      remaining,
    });
  } catch (error: unknown) {
    console.error('[live-dashboard/credits] POST error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/live-dashboard/credits — sync client credits to server
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  try {
    const ip = getIp(request);

    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 60 operations per minute.' },
        { status: 429 },
      );
    }

    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required to sync credits.' },
        { status: 401 },
      );
    }

    // --- Parse & validate body ---
    const body = await request.json();
    const { balance, totalPurchased, totalUsed } = body as {
      balance?: number;
      totalPurchased?: number;
      totalUsed?: number;
    };

    if (
      typeof balance !== 'number' ||
      typeof totalPurchased !== 'number' ||
      typeof totalUsed !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: balance, totalPurchased, totalUsed.' },
        { status: 400 },
      );
    }

    // --- Ensure credit row exists ---
    await supabase
      .from('dashboard_credits')
      .upsert(
        { user_id: userId, balance: 0, total_purchased: 0, total_used: 0, updated_at: new Date().toISOString() },
        { onConflict: 'user_id', ignoreDuplicates: true },
      );

    // --- Fetch current server balance ---
    const { data: serverRow } = await supabase
      .from('dashboard_credits')
      .select('balance, total_purchased, total_used')
      .eq('user_id', userId)
      .single() as { data: { balance: number; total_purchased: number; total_used: number } | null };

    const serverBalance = serverRow?.balance ?? 0;
    const serverPurchased = serverRow?.total_purchased ?? 0;
    const serverUsed = serverRow?.total_used ?? 0;

    // --- Merge: take the higher of client vs server ---
    const mergedBalance = Math.max(balance, serverBalance);
    const mergedPurchased = Math.max(totalPurchased, serverPurchased);
    const mergedUsed = Math.max(totalUsed, serverUsed);

    await supabase
      .from('dashboard_credits')
      .update({
        balance: mergedBalance,
        total_purchased: mergedPurchased,
        total_used: mergedUsed,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Record a sync transaction if the client had more credits than the server
    if (balance > serverBalance) {
      const diff = balance - serverBalance;
      await supabase.from('credit_transactions').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        amount: diff,
        action: 'bonus',
        description: `Synced ${diff} credit${diff !== 1 ? 's' : ''} from anonymous session`,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      balance: mergedBalance,
      totalPurchased: mergedPurchased,
      totalUsed: mergedUsed,
    });
  } catch (error: unknown) {
    console.error('[live-dashboard/credits] PATCH error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
