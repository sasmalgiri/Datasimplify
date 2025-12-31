import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const FREE_DOWNLOAD_LIMIT = 3;

export async function POST(request: Request) {
  try {
    const { email, downloadType, fileName } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // If Supabase not configured, use localStorage-based tracking
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        success: true,
        downloadsRemaining: 2, // Mock remaining
        message: 'Download tracked (local mode)',
      });
    }

    // Get user
    const { data: user } = await supabase
      .from('free_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      );
    }

    // Check download limit
    const downloadsThisMonth = user.downloads_this_month || 0;

    // Check if we need to reset monthly counter
    const lastDownload = user.last_download_at ? new Date(user.last_download_at) : null;
    const now = new Date();
    const isNewMonth = lastDownload &&
      (lastDownload.getMonth() !== now.getMonth() || lastDownload.getFullYear() !== now.getFullYear());

    let currentMonthDownloads = isNewMonth ? 0 : downloadsThisMonth;

    if (currentMonthDownloads >= FREE_DOWNLOAD_LIMIT) {
      return NextResponse.json({
        success: false,
        error: 'Monthly download limit reached',
        downloadsRemaining: 0,
        upgradeRequired: true,
      }, { status: 403 });
    }

    // Increment download count
    const { error: updateError } = await supabase
      .from('free_users')
      .update({
        downloads_this_month: currentMonthDownloads + 1,
        total_downloads: (user.total_downloads || 0) + 1,
        last_download_at: now.toISOString(),
      })
      .eq('email', email.toLowerCase());

    if (updateError) {
      console.error('Error updating download count:', updateError);
    }

    // Log the download
    try {
      await supabase.from('download_logs').insert({
        user_email: email.toLowerCase(),
        download_type: downloadType || 'unknown',
        file_name: fileName || 'unknown',
        downloaded_at: now.toISOString(),
      });
    } catch (logError) {
      console.error('Error logging download:', logError);
    }

    return NextResponse.json({
      success: true,
      downloadsRemaining: FREE_DOWNLOAD_LIMIT - (currentMonthDownloads + 1),
      downloadsThisMonth: currentMonthDownloads + 1,
      totalDownloads: (user.total_downloads || 0) + 1,
    });

  } catch (error) {
    console.error('Track download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        downloadsRemaining: 3,
        downloadsThisMonth: 0,
      });
    }

    const { data: user } = await supabase
      .from('free_users')
      .select('downloads_this_month, last_download_at')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      return NextResponse.json({
        downloadsRemaining: 3,
        downloadsThisMonth: 0,
      });
    }

    // Check if month reset needed
    const lastDownload = user.last_download_at ? new Date(user.last_download_at) : null;
    const now = new Date();
    const isNewMonth = lastDownload &&
      (lastDownload.getMonth() !== now.getMonth() || lastDownload.getFullYear() !== now.getFullYear());

    const downloadsThisMonth = isNewMonth ? 0 : (user.downloads_this_month || 0);

    return NextResponse.json({
      downloadsRemaining: Math.max(0, FREE_DOWNLOAD_LIMIT - downloadsThisMonth),
      downloadsThisMonth,
    });

  } catch (error) {
    console.error('Get download status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
