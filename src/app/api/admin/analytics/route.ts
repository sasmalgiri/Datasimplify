/**
 * Admin API - Analytics Dashboard
 *
 * Returns aggregated analytics data from usage_events, security_events,
 * user_profiles, and download_events tables.
 * Uses service role client to bypass RLS for admin access.
 *
 * GET /api/admin/analytics?range=7d|30d|90d
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return { isAdmin: false, user: null };
  return {
    isAdmin: ADMIN_EMAILS.includes(user.email.toLowerCase()),
    user: { id: user.id, email: user.email },
  };
}

export async function GET(request: NextRequest) {
  // Auth check with cookie-based client
  const supabase = await createClient();
  const { isAdmin: isAdminUser, user } = await isAdmin(supabase);

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Use service role client to bypass RLS
  const db = getServiceClient();
  if (!db) {
    return NextResponse.json(
      { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '7d';

  const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  try {
    const [
      totalUsersRes,
      proUsersRes,
      newUsersRes,
      newUsersTodayRes,
      apiCallsRes,
      apiCallsTodayRes,
      topEndpointsRes,
      dailyApiCallsRes,
      dailySignupsRes,
      securityEventsRes,
      downloadEventsRes,
      topUsersRes,
      feedbackRes,
    ] = await Promise.all([
      db.from('user_profiles').select('id', { count: 'exact', head: true }),
      db.from('user_profiles').select('id', { count: 'exact', head: true })
        .eq('subscription_tier', 'pro'),
      db.from('user_profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', sinceISO),
      db.from('user_profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO),
      db.from('usage_events').select('id', { count: 'exact', head: true })
        .gte('created_at', sinceISO),
      db.from('usage_events').select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO),
      db.from('usage_events')
        .select('event_type')
        .gte('created_at', sinceISO)
        .limit(5000),
      db.from('usage_events')
        .select('created_at')
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: true })
        .limit(10000),
      db.from('user_profiles')
        .select('created_at')
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: true }),
      db.from('security_events')
        .select('event_type, severity, created_at')
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false })
        .limit(1000),
      db.from('download_events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sinceISO),
      db.from('usage_events')
        .select('user_id')
        .gte('created_at', sinceISO)
        .not('user_id', 'is', null)
        .limit(5000),
      db.from('page_feedback')
        .select('helpful, created_at')
        .gte('created_at', sinceISO),
    ]);

    // Aggregate top endpoints
    const endpointCounts: Record<string, number> = {};
    (topEndpointsRes.data || []).forEach((row: { event_type: string }) => {
      endpointCounts[row.event_type] = (endpointCounts[row.event_type] || 0) + 1;
    });
    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Aggregate daily API calls
    const dailyCalls: Record<string, number> = {};
    (dailyApiCallsRes.data || []).forEach((row: { created_at: string }) => {
      const day = row.created_at.slice(0, 10);
      dailyCalls[day] = (dailyCalls[day] || 0) + 1;
    });
    const dailyApiCalls = Object.entries(dailyCalls)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Aggregate daily signups
    const dailySignupCounts: Record<string, number> = {};
    (dailySignupsRes.data || []).forEach((row: { created_at: string }) => {
      const day = row.created_at.slice(0, 10);
      dailySignupCounts[day] = (dailySignupCounts[day] || 0) + 1;
    });
    const dailySignups = Object.entries(dailySignupCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Aggregate top users
    const userCounts: Record<string, number> = {};
    (topUsersRes.data || []).forEach((row: { user_id: string }) => {
      if (row.user_id) {
        userCounts[row.user_id] = (userCounts[row.user_id] || 0) + 1;
      }
    });
    const topUserIds = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    // Fetch top user emails
    let topUsers: { user_id: string; email: string; calls: number }[] = [];
    if (topUserIds.length > 0) {
      const { data: userProfiles } = await db
        .from('user_profiles')
        .select('id, email')
        .in('id', topUserIds.map(([id]) => id));

      const emailMap: Record<string, string> = {};
      (userProfiles || []).forEach((p: { id: string; email: string }) => {
        emailMap[p.id] = p.email;
      });

      topUsers = topUserIds.map(([id, count]) => ({
        user_id: id,
        email: emailMap[id] || 'Unknown',
        calls: count,
      }));
    }

    // Aggregate security events
    const securityByType: Record<string, number> = {};
    const securityBySeverity: Record<string, number> = {};
    (securityEventsRes.data || []).forEach((row: { event_type: string; severity: string }) => {
      securityByType[row.event_type] = (securityByType[row.event_type] || 0) + 1;
      securityBySeverity[row.severity || 'low'] = (securityBySeverity[row.severity || 'low'] || 0) + 1;
    });

    // Feedback stats
    const feedbackData = feedbackRes.data || [];
    const helpfulCount = feedbackData.filter((f: { helpful: boolean }) => f.helpful).length;
    const unhelpfulCount = feedbackData.filter((f: { helpful: boolean }) => !f.helpful).length;

    return NextResponse.json({
      kpis: {
        totalUsers: totalUsersRes.count || 0,
        proUsers: proUsersRes.count || 0,
        newUsers: newUsersRes.count || 0,
        newUsersToday: newUsersTodayRes.count || 0,
        apiCalls: apiCallsRes.count || 0,
        apiCallsToday: apiCallsTodayRes.count || 0,
        downloads: downloadEventsRes.count || 0,
        conversionRate: (totalUsersRes.count || 0) > 0
          ? ((proUsersRes.count || 0) / (totalUsersRes.count || 1) * 100).toFixed(1)
          : '0.0',
      },
      topEndpoints,
      dailyApiCalls,
      dailySignups,
      topUsers,
      security: {
        total: securityEventsRes.data?.length || 0,
        byType: securityByType,
        bySeverity: securityBySeverity,
      },
      feedback: {
        total: feedbackData.length,
        helpful: helpfulCount,
        unhelpful: unhelpfulCount,
        score: feedbackData.length > 0
          ? (helpfulCount / feedbackData.length * 100).toFixed(1)
          : '0.0',
      },
      range,
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
