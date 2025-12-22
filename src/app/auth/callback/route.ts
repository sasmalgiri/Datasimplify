import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(
          new URL('/login?error=auth_failed&message=' + encodeURIComponent(error.message), requestUrl.origin)
        );
      }
    } catch (error) {
      console.error('Auth callback exception:', error);
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', requestUrl.origin)
      );
    }
  } else {
    // No code provided - redirect to login
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
  }

  // Redirect to dashboard after successful login
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
}
