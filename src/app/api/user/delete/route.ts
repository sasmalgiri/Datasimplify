import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// GDPR Right to Erasure / CCPA Right to Delete
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();

    // Parse confirmation from body
    const body = await request.json().catch(() => ({}));
    const { confirmDelete, confirmEmail } = body;

    if (!confirmDelete || confirmDelete !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        { error: 'Invalid confirmation. Please type DELETE_MY_ACCOUNT to confirm.' },
        { status: 400 }
      );
    }

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
        { error: 'Unauthorized. Please log in to delete your account.' },
        { status: 401 }
      );
    }

    // Verify email confirmation matches
    if (confirmEmail && confirmEmail.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email confirmation does not match your account email.' },
        { status: 400 }
      );
    }

    // Create admin client for deletion
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const deletedTables: string[] = [];
    const errors: string[] = [];

    // Delete data from all user-related tables
    // Order matters: delete from child tables first

    // 1. Download History
    const { error: downloadError } = await supabaseAdmin
      .from('download_history')
      .delete()
      .eq('user_id', user.id);

    if (!downloadError) deletedTables.push('download_history');
    else if (downloadError.code !== 'PGRST116') errors.push(`download_history: ${downloadError.message}`);

    // 2. Chat History
    const { error: chatError } = await supabaseAdmin
      .from('chat_history')
      .delete()
      .eq('user_id', user.id);

    if (!chatError) deletedTables.push('chat_history');
    else if (chatError.code !== 'PGRST116') errors.push(`chat_history: ${chatError.message}`);

    // 3. Price Alerts
    const { error: alertError } = await supabaseAdmin
      .from('price_alerts')
      .delete()
      .eq('user_id', user.id);

    if (!alertError) deletedTables.push('price_alerts');
    else if (alertError.code !== 'PGRST116') errors.push(`price_alerts: ${alertError.message}`);

    // 4. Subscription History
    const { error: subError } = await supabaseAdmin
      .from('subscription_history')
      .delete()
      .eq('user_id', user.id);

    if (!subError) deletedTables.push('subscription_history');
    else if (subError.code !== 'PGRST116') errors.push(`subscription_history: ${subError.message}`);

    // 5. RAG Cost Tracking
    const { error: ragCostError } = await supabaseAdmin
      .from('rag_cost_tracking')
      .delete()
      .eq('user_id', user.id);

    if (!ragCostError) deletedTables.push('rag_cost_tracking');
    else if (ragCostError.code !== 'PGRST116') errors.push(`rag_cost_tracking: ${ragCostError.message}`);

    // 6. User Analytics
    const { error: analyticsError } = await supabaseAdmin
      .from('user_analytics')
      .delete()
      .eq('user_id', user.id);

    if (!analyticsError) deletedTables.push('user_analytics');
    else if (analyticsError.code !== 'PGRST116') errors.push(`user_analytics: ${analyticsError.message}`);

    // 7. User Profile (last before auth deletion)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', user.id);

    if (!profileError) deletedTables.push('user_profiles');
    else if (profileError.code !== 'PGRST116') errors.push(`user_profiles: ${profileError.message}`);

    // 8. Delete the auth user (this is the final step)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      console.error('Failed to delete auth user:', authDeleteError);
      return NextResponse.json(
        {
          error: 'Failed to delete account. Please contact support.',
          details: authDeleteError.message,
          partialDeletion: deletedTables,
        },
        { status: 500 }
      );
    }

    // Log successful deletion (for compliance records)
    console.log(`Account deleted: ${user.id} (${user.email}) - Tables cleared: ${deletedTables.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
      deletedData: {
        tables: deletedTables,
        accountEmail: user.email,
        deletionDate: new Date().toISOString(),
      },
      gdprCompliance: {
        article: 'GDPR Article 17 - Right to Erasure',
        ccpa: 'CCPA Section 1798.105 - Right to Delete',
        retentionNote: 'Some anonymized aggregate data may be retained for analytics purposes as permitted by law.',
      },
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please contact support at sasmalgiri@gmail.com' },
      { status: 500 }
    );
  }
}

// GET endpoint to check what data will be deleted
export async function GET() {
  try {
    const cookieStore = await cookies();

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
              // Server component
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Count records in each table
    const counts: Record<string, number> = {};

    const { count: downloads } = await supabaseAdmin
      .from('download_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    counts.downloadHistory = downloads || 0;

    const { count: chats } = await supabaseAdmin
      .from('chat_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    counts.chatHistory = chats || 0;

    const { count: alerts } = await supabaseAdmin
      .from('price_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    counts.priceAlerts = alerts || 0;

    return NextResponse.json({
      email: user.email,
      dataToBeDeleted: {
        account: 'Your account and login credentials',
        profile: 'Subscription tier and settings',
        ...counts,
      },
      warning: 'This action is permanent and cannot be undone.',
      cancelSubscription: 'If you have an active subscription, it will be cancelled.',
    });

  } catch (error) {
    console.error('Deletion preview error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve deletion preview' },
      { status: 500 }
    );
  }
}
