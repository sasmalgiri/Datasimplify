import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// Fallback in-memory storage (when Supabase not configured)
interface FeedbackEntry {
  id: string;
  page_path: string;
  page_title: string;
  helpful: boolean;
  reason: string | null;
  message: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

const feedbackStore: FeedbackEntry[] = [];

// In-memory rate limiting fallback
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitInMemory(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return true;
  }

  if (limit.count >= 3) {
    return false;
  }

  limit.count++;
  return true;
}

// Strip URLs from message for safety
function sanitizeMessage(message: string | null): string | null {
  if (!message) return null;
  return message
    .replace(/https?:\/\/[^\s]+/gi, '[link removed]')
    .replace(/www\.[^\s]+/gi, '[link removed]')
    .slice(0, 400);
}

// Check rate limit using Supabase
async function checkRateLimitSupabase(ip: string): Promise<boolean> {
  if (!supabaseAdmin) return true;

  try {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_ip: ip,
      p_endpoint: 'feedback',
      p_max_requests: 3,
      p_window_hours: 24,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow on error
    }

    return data === true;
  } catch {
    return true; // Allow on error
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const userAgent = request.headers.get('user-agent') || null;

    // Check rate limit
    const isAllowed = isSupabaseConfigured
      ? await checkRateLimitSupabase(ip)
      : checkRateLimitInMemory(ip);

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again tomorrow.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { pagePath, pageTitle, helpful, reason, message } = body;

    // Validate required fields
    if (typeof pagePath !== 'string' || typeof helpful !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const entry: FeedbackEntry = {
      id: crypto.randomUUID(),
      page_path: pagePath.slice(0, 200),
      page_title: (pageTitle || '').slice(0, 200),
      helpful,
      reason: reason || null,
      message: sanitizeMessage(message),
      ip: ip.slice(0, 45),
      user_agent: userAgent?.slice(0, 500) || null,
      created_at: new Date().toISOString(),
    };

    // Store feedback
    if (isSupabaseConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('page_feedback')
        .insert({
          page_path: entry.page_path,
          page_title: entry.page_title,
          helpful: entry.helpful,
          reason: entry.reason,
          message: entry.message,
          ip: entry.ip,
          user_agent: entry.user_agent,
        });

      if (error) {
        console.error('Supabase feedback insert error:', error);
        // Fall back to in-memory
        feedbackStore.push(entry);
      }
    } else {
      feedbackStore.push(entry);
    }

    // Log for monitoring
    console.log('[Feedback]', {
      page: entry.page_path,
      helpful: entry.helpful,
      reason: entry.reason,
      stored: isSupabaseConfigured ? 'supabase' : 'memory',
    });

    return NextResponse.json({ success: true, id: entry.id });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for admin access (protected)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  // Auth check
  if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const pagePath = url.searchParams.get('pagePath');
  const helpful = url.searchParams.get('helpful');
  const limit = parseInt(url.searchParams.get('limit') || '100');

  // Use Supabase if configured
  if (isSupabaseConfigured && supabaseAdmin) {
    let query = supabaseAdmin
      .from('page_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (pagePath) {
      query = query.ilike('page_path', `%${pagePath}%`);
    }

    if (helpful !== null) {
      query = query.eq('helpful', helpful === 'true');
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase feedback fetch error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      total: count || data?.length || 0,
      feedback: data || [],
    });
  }

  // Fallback to in-memory
  let results = [...feedbackStore];

  if (pagePath) {
    results = results.filter((f) => f.page_path.includes(pagePath));
  }

  if (helpful !== null) {
    results = results.filter((f) => f.helpful === (helpful === 'true'));
  }

  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    total: results.length,
    feedback: results.slice(0, limit),
  });
}
