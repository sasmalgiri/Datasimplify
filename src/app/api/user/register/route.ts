import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Supabase is required for truthful user tracking
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'User registration requires Supabase to be configured.',
          requiresSupabase: true,
        },
        { status: 503 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('free_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      // User exists, return their data
      const downloadsThisMonth = existingUser.downloads_this_month || 0;
      const downloadsRemaining = Math.max(0, 3 - downloadsThisMonth);

      return NextResponse.json({
        success: true,
        userId: existingUser.id,
        email: existingUser.email,
        downloadsRemaining,
        downloadsThisMonth,
        isExisting: true,
      });
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('free_users')
      .insert({
        email: email.toLowerCase(),
        downloads_this_month: 0,
        total_downloads: 0,
        created_at: new Date().toISOString(),
        last_download_at: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create user.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      email: newUser.email,
      downloadsRemaining: 3,
      downloadsThisMonth: 0,
      isNew: true,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
