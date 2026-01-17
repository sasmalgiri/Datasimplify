import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// Fallback in-memory storage (when Supabase not configured)
interface TemplateRequest {
  id: string;
  page_path: string;
  page_title: string;
  coins: string[];
  report_type: string;
  timeframe: string;
  purpose: string;
  details: string | null;
  votes_count: number;
  status: 'pending' | 'planned' | 'building' | 'shipped';
  created_at: string;
  ip: string | null;
}

const requestStore: TemplateRequest[] = [];

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

// Strip URLs from text for safety
function sanitizeText(text: string | null): string | null {
  if (!text) return null;
  return text
    .replace(/https?:\/\/[^\s]+/gi, '[link removed]')
    .replace(/www\.[^\s]+/gi, '[link removed]')
    .slice(0, 400);
}

// Block keywords that suggest trading signals
const BLOCKED_KEYWORDS = [
  'entry',
  'exit',
  'target',
  'stop-loss',
  'stoploss',
  'signal',
  'moon',
  'guaranteed',
  'profit',
  'buy now',
  'sell now',
  'when to buy',
  'when to sell',
];

function containsBlockedKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => lower.includes(keyword));
}

// Check rate limit using Supabase
async function checkRateLimitSupabase(ip: string): Promise<boolean> {
  if (!supabaseAdmin) return true;

  try {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_ip: ip,
      p_endpoint: 'template_request',
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
    const { pagePath, pageTitle, coins, reportType, timeframe, purpose, details } = body;

    // Validate required fields
    if (!reportType || !purpose) {
      return NextResponse.json(
        { error: 'Report type and purpose are required' },
        { status: 400 }
      );
    }

    // Check for blocked keywords
    const allText = `${coins?.join(' ') || ''} ${details || ''}`;
    if (containsBlockedKeywords(allText)) {
      return NextResponse.json(
        { error: 'Request contains prohibited content related to trading signals.' },
        { status: 400 }
      );
    }

    const sanitizedCoins = Array.isArray(coins)
      ? coins.map((c: string) => c.slice(0, 20)).slice(0, 20)
      : [];

    const entry: TemplateRequest = {
      id: crypto.randomUUID(),
      page_path: (pagePath || '').slice(0, 200),
      page_title: (pageTitle || '').slice(0, 200),
      coins: sanitizedCoins,
      report_type: reportType.slice(0, 50),
      timeframe: (timeframe || '1d').slice(0, 10),
      purpose: purpose.slice(0, 50),
      details: sanitizeText(details),
      votes_count: 1, // Creator's vote
      status: 'pending',
      created_at: new Date().toISOString(),
      ip: ip.slice(0, 45),
    };

    // Store request
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('template_requests')
        .insert({
          page_path: entry.page_path,
          page_title: entry.page_title,
          coins: entry.coins,
          report_type: entry.report_type,
          timeframe: entry.timeframe,
          purpose: entry.purpose,
          details: entry.details,
          votes_count: entry.votes_count,
          status: entry.status,
          ip: entry.ip,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase template request insert error:', error);
        requestStore.push(entry);
      } else if (data) {
        // Also insert the creator's vote
        await supabaseAdmin
          .from('template_request_votes')
          .insert({
            request_id: data.id,
            ip: entry.ip,
          });

        entry.id = data.id;
      }
    } else {
      requestStore.push(entry);
    }

    // Log for monitoring
    console.log('[Template Request]', {
      reportType: entry.report_type,
      coins: entry.coins.join(', '),
      purpose: entry.purpose,
      stored: isSupabaseConfigured ? 'supabase' : 'memory',
    });

    return NextResponse.json({ success: true, id: entry.id });
  } catch (error) {
    console.error('Template request API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for public roadmap
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  // Use Supabase if configured
  if (isSupabaseConfigured && supabaseAdmin) {
    let query = supabaseAdmin
      .from('template_requests')
      .select('id, report_type, coins, timeframe, purpose, details, votes_count, status, created_at')
      .order('votes_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase template requests fetch error:', error);
      // Fall back to in-memory
    } else {
      // Map to expected format (camelCase for frontend)
      const publicResults = (data || []).map((r) => ({
        id: r.id,
        reportType: r.report_type,
        coins: r.coins || [],
        timeframe: r.timeframe,
        purpose: r.purpose,
        details: r.details,
        votesCount: r.votes_count,
        status: r.status,
        createdAt: r.created_at,
      }));

      return NextResponse.json({
        total: count || publicResults.length,
        requests: publicResults,
      });
    }
  }

  // Fallback to in-memory
  let results = [...requestStore];

  if (status) {
    results = results.filter((r) => r.status === status);
  }

  // Sort by votes (descending) then by date (newest first)
  results.sort((a, b) => {
    if (b.votes_count !== a.votes_count) {
      return b.votes_count - a.votes_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Return public data only (no IP)
  const publicResults = results.slice(0, limit).map((r) => ({
    id: r.id,
    reportType: r.report_type,
    coins: r.coins,
    timeframe: r.timeframe,
    purpose: r.purpose,
    details: r.details,
    votesCount: r.votes_count,
    status: r.status,
    createdAt: r.created_at,
  }));

  return NextResponse.json({
    total: results.length,
    requests: publicResults,
  });
}

// PATCH endpoint for voting
export async function PATCH(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      // Check if already voted
      const { data: existingVote } = await supabaseAdmin
        .from('template_request_votes')
        .select('id')
        .eq('request_id', requestId)
        .eq('ip', ip)
        .single();

      if (existingVote) {
        return NextResponse.json({ error: 'Already voted' }, { status: 409 });
      }

      // Insert vote (trigger will update votes_count)
      const { error } = await supabaseAdmin
        .from('template_request_votes')
        .insert({
          request_id: requestId,
          ip: ip.slice(0, 45),
        });

      if (error) {
        console.error('Supabase vote insert error:', error);
        return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Fallback: update in-memory
    const request_entry = requestStore.find((r) => r.id === requestId);
    if (request_entry) {
      request_entry.votes_count++;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
