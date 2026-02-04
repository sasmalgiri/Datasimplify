/**
 * API Authentication Utility
 *
 * Supports both:
 * 1. Cookie-based auth (web browser sessions)
 * 2. Bearer token auth (Excel add-in)
 */

import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

interface AuthResult {
  user: { id: string; email?: string } | null;
  error: string | null;
}

/**
 * Get authenticated user from either Bearer token or cookies
 *
 * Priority:
 * 1. Bearer token in Authorization header (for Excel add-in)
 * 2. Cookie-based session (for web browser)
 */
export async function getAuthUser(request: NextRequest): Promise<AuthResult> {
  // Check for Bearer token first (Excel add-in)
  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return await verifyBearerToken(token);
  }

  // Fall back to cookie-based auth (web browser)
  return await verifyCookieAuth();
}

/**
 * Verify a Bearer token from the Excel add-in
 */
async function verifyBearerToken(token: string): Promise<AuthResult> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return { user: null, error: 'Server configuration error' };
    }

    // Use service client to verify the token
    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' };
    }

    return {
      user: { id: user.id, email: user.email },
      error: null
    };
  } catch (err) {
    console.error('[API Auth] Bearer token verification error:', err);
    return { user: null, error: 'Token verification failed' };
  }
}

/**
 * Verify cookie-based auth (existing web browser flow)
 */
async function verifyCookieAuth(): Promise<AuthResult> {
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
              // Ignore errors from Server Components
            }
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, error: error?.message || 'Not authenticated' };
    }

    return {
      user: { id: user.id, email: user.email },
      error: null
    };
  } catch (err) {
    console.error('[API Auth] Cookie auth verification error:', err);
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Create a Supabase client for the authenticated user
 * Returns null if not authenticated
 */
export async function getSupabaseClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  // For Bearer token, create service client (to access user's data)
  if (authHeader?.startsWith('Bearer ')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return null;
    }

    return createServiceClient(supabaseUrl, supabaseServiceKey);
  }

  // For cookie auth, use the standard server client
  const cookieStore = await cookies();

  return createServerClient(
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
            // Ignore errors from Server Components
          }
        },
      },
    }
  );
}
