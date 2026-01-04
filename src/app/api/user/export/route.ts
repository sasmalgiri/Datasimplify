import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { logDownloadEvent } from '@/lib/downloadTracking';

// GDPR/CCPA Data Export - Right to Data Portability
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();

    // Create authenticated client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server component - can be ignored
            }
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to export your data.' },
        { status: 401 }
      );
    }

    // Create admin client for full data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Collect all user data
    const exportData: Record<string, unknown> = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      accountCreated: user.created_at,
      lastSignIn: user.last_sign_in_at,
    };

    // 1. User Profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      exportData.profile = {
        subscriptionTier: profile.subscription_tier,
        downloadsThisMonth: profile.downloads_this_month,
        downloadsLimit: profile.downloads_limit,
        createdAt: profile.created_at,
      };
    }

    // 2. Download History
    const { data: downloads } = await supabaseAdmin
      .from('download_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (downloads && downloads.length > 0) {
      exportData.downloadHistory = downloads.map(d => ({
        category: d.category,
        format: d.format,
        downloadedAt: d.created_at,
      }));
    }

    // 3. Chat History (if exists)
    const { data: chatHistory } = await supabaseAdmin
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (chatHistory && chatHistory.length > 0) {
      exportData.chatHistory = chatHistory.map(c => ({
        query: c.query,
        response: c.response?.substring(0, 500) + '...', // Truncate for size
        createdAt: c.created_at,
      }));
    }

    // 4. Price Alerts (if exists)
    const { data: alerts } = await supabaseAdmin
      .from('price_alerts')
      .select('*')
      .eq('user_id', user.id);

    if (alerts && alerts.length > 0) {
      exportData.priceAlerts = alerts.map(a => ({
        symbol: a.symbol,
        targetPrice: a.target_price,
        direction: a.direction,
        isActive: a.is_active,
        createdAt: a.created_at,
      }));
    }

    // 5. Subscription History (if exists)
    const { data: subscriptions } = await supabaseAdmin
      .from('subscription_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (subscriptions && subscriptions.length > 0) {
      exportData.subscriptionHistory = subscriptions.map(s => ({
        tier: s.tier,
        status: s.status,
        startDate: s.start_date,
        endDate: s.end_date,
      }));
    }

    // 6. Cookie Consent (client-side, so just note it)
    exportData.cookieConsent = 'Stored in your browser localStorage under "cookie-consent" key';

    // Add data categories summary
    exportData.dataSummary = {
      totalDownloads: downloads?.length || 0,
      totalChatQueries: chatHistory?.length || 0,
      totalAlerts: alerts?.length || 0,
      dataCategories: [
        'Account Information',
        'Profile Settings',
        'Download History',
        'Chat History',
        'Price Alerts',
        'Subscription History',
      ],
    };

    // Add GDPR/CCPA compliance notice
    exportData.privacyNotice = {
      purpose: 'This data export is provided in compliance with GDPR Article 20 (Right to Data Portability) and CCPA Section 1798.100 (Right to Know).',
      contact: 'sasmalgiri@gmail.com',
      requestDeletion: 'To request account deletion, visit your Dashboard > Settings > Delete Account',
    };

    // Return as downloadable JSON
    logDownloadEvent({
      request,
      category: 'user_export',
      format: 'json',
      fileName: `datasimplify-export-${new Date().toISOString().split('T')[0]}.json`,
      filters: Object.fromEntries(new URL(request.url).searchParams.entries()),
      userId: user.id,
      userEmail: user.email || null,
    }).catch(() => {});

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="datasimplify-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
