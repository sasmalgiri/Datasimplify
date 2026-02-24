'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { type SupabaseClient, type User, type Session } from '@supabase/supabase-js';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { IS_BETA_MODE } from '@/lib/betaMode';

// ============================================
// TYPES
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  subscription_tier: 'free' | 'pro';
  downloads_this_month: number;
  downloads_limit: number;
  created_at: string;
  preferences?: {
    persona?: string;
    onboardingCompleted?: boolean;
  };
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  canDownload: () => boolean;
  remainingDownloads: () => number;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// SUPABASE CLIENT (SSR-compatible, cookie-based)
// ============================================

const getSupabaseClient = (): SupabaseClient | null => {
  return createBrowserClient() as SupabaseClient | null;
};

// ============================================
// COOKIE HELPERS — write auth cookies directly
// so the Edge proxy can read them without
// needing setSession (which acquires a lock).
// ============================================

function getProjectRef(): string {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return '';
  }
}

/** base64url encode (no padding) */
function toBase64URL(str: string): string {
  const b64 = btoa(
    new Uint8Array(new TextEncoder().encode(str)).reduce(
      (s, b) => s + String.fromCharCode(b), ''
    )
  );
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const CHUNK_SIZE = 3180;

/**
 * Write Supabase auth session cookies in the exact format
 * that @supabase/ssr createServerClient reads.
 */
function writeSessionCookies(sessionJson: string) {
  const ref = getProjectRef();
  if (!ref) return;

  const key = `sb-${ref}-auth-token`;
  const encoded = `base64-${toBase64URL(sessionJson)}`;
  const maxAge = 400 * 24 * 60 * 60; // ~400 days
  const opts = `path=/;max-age=${maxAge};SameSite=Lax`;

  // Remove any old chunks first (up to 10)
  for (let i = 0; i < 10; i++) {
    document.cookie = `${key}.${i}=;path=/;max-age=0`;
  }
  document.cookie = `${key}=;path=/;max-age=0`;

  if (encoded.length <= CHUNK_SIZE) {
    document.cookie = `${key}=${encoded};${opts}`;
  } else {
    // Chunk it
    const chunks = Math.ceil(encoded.length / CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
      const chunk = encoded.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      document.cookie = `${key}.${i}=${chunk};${opts}`;
    }
  }
}

function clearSessionCookies() {
  const ref = getProjectRef();
  if (!ref) return;
  const key = `sb-${ref}-auth-token`;
  document.cookie = `${key}=;path=/;max-age=0`;
  for (let i = 0; i < 10; i++) {
    document.cookie = `${key}.${i}=;path=/;max-age=0`;
  }
}

/** base64url decode */
function fromBase64URL(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Read session directly from cookies as a fallback when
 * getSession() fails or times out.
 */
function readSessionFromCookie(): Record<string, unknown> | null {
  try {
    const ref = getProjectRef();
    if (!ref) return null;

    const key = `sb-${ref}-auth-token`;
    const cookies: Record<string, string> = {};
    document.cookie.split(';').forEach(c => {
      const [k, ...v] = c.trim().split('=');
      if (k) cookies[k] = v.join('=');
    });

    // Try non-chunked cookie first
    let encoded = cookies[key];

    // Try chunked cookies
    if (!encoded) {
      const chunks: string[] = [];
      for (let i = 0; i < 10; i++) {
        const chunk = cookies[`${key}.${i}`];
        if (!chunk) break;
        chunks.push(chunk);
      }
      if (chunks.length > 0) {
        encoded = chunks.join('');
      }
    }

    if (!encoded) return null;

    // Decode base64url
    let decoded = encoded;
    if (encoded.startsWith('base64-')) {
      decoded = fromBase64URL(encoded.substring(7));
    }

    return JSON.parse(decoded);
  } catch (e) {
    console.warn('[auth] readSessionFromCookie failed:', e);
    return null;
  }
}

// ============================================
// PROVIDER
// ============================================

const ADMIN_EMAILS_LIST = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').filter(Boolean).map(e => e.trim().toLowerCase());

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState<SupabaseClient | null>(() => getSupabaseClient());
  const [isConfigured] = useState(() => supabase !== null);

  // Admin check — admins get full Pro access
  const isAdmin = user?.email ? ADMIN_EMAILS_LIST.includes(user.email.toLowerCase()) : false;

  // Download limits by tier (Free: 30, Pro: 300)
  const downloadLimits: Record<string, number> = {
    free: 30,
    pro: 300,
  };

  // Fetch user profile from database
  const fetchProfile = async (userId: string, userEmail?: string) => {
    if (!supabase) return;

    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        return;
      }

      // Profile doesn't exist — try to create it
      try {
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .upsert({
            id: userId,
            email: userEmail || '',
            subscription_tier: 'free',
            downloads_this_month: 0,
            downloads_limit: downloadLimits.free,
          }, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (newProfile) {
          setProfile(newProfile);
        } else if (insertError) {
          console.warn('Could not create profile:', insertError.message);
          setProfile({
            id: userId, email: userEmail || '', subscription_tier: 'free',
            downloads_this_month: 0, downloads_limit: downloadLimits.free,
            created_at: new Date().toISOString(),
          } as UserProfile);
        }
      } catch {
        setProfile({
          id: userId, email: userEmail || '', subscription_tier: 'free',
          downloads_this_month: 0, downloads_limit: downloadLimits.free,
          created_at: new Date().toISOString(),
        } as UserProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile({
        id: userId, email: userEmail || '', subscription_tier: 'free',
        downloads_this_month: 0, downloads_limit: downloadLimits.free,
        created_at: new Date().toISOString(),
      } as UserProfile);
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        // Try getSession with a 5-second timeout to avoid hanging on lock contention
        let currentSession: Session | null = null;

        try {
          const { data } = await Promise.race([
            supabase.auth.getSession(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('getSession timeout')), 5000)
            ),
          ]);
          currentSession = data.session;
        } catch {
          console.warn('[auth] getSession timed out, trying cookie fallback');
        }

        // Fallback: read session directly from cookies
        if (!currentSession) {
          const cookieData = readSessionFromCookie();
          if (cookieData?.access_token && cookieData?.user) {
            console.log('[auth] Using cookie fallback session');
            currentSession = cookieData as unknown as Session;

            // Try to register this session with the Supabase client (non-blocking)
            supabase.auth.setSession({
              access_token: cookieData.access_token as string,
              refresh_token: cookieData.refresh_token as string,
            }).catch(() => { /* ignore - we already have cookie data */ });
          }
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // IMPORTANT: Set loading false BEFORE profile fetch so pages render immediately.
        // Profile loads in the background — pages that need it can check profile != null.
        setIsLoading(false);

        if (currentSession?.user) {
          // Non-blocking profile fetch with timeout
          Promise.race([
            fetchProfile(currentSession.user.id, currentSession.user.email),
            new Promise<void>((resolve) => setTimeout(resolve, 5000)),
          ]).catch(() => {});
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id, newSession.user.email);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Sign up with email/password
  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Please configure Supabase in Vercel environment variables') };
    }
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), 30000);
      });

      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      const { data, error } = await Promise.race([signUpPromise, timeoutPromise]);

      if (error) {
        if (error.message.includes('Invalid API key')) {
          return { error: new Error('Server configuration error. Please contact support.') };
        }
        if (error.message.includes('Database error saving new user') ||
            error.message.includes('Database error')) {
          return { error: new Error('Account creation is temporarily unavailable. Please try again in a few minutes or contact support.') };
        }
        if (error.message.includes('User already registered')) {
          return { error: new Error('This email is already registered. Please sign in instead.') };
        }
        return { error: new Error(error.message) };
      }

      if (data?.user) {
        // Detect duplicate email: Supabase returns a user with empty identities
        // when the email is already registered (instead of an error)
        if (!data.user.identities || data.user.identities.length === 0) {
          return { error: new Error('This email is already registered. Please sign in instead.') };
        }

        try {
          const profilePromise = supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              email: email,
              subscription_tier: 'free',
              downloads_this_month: 0,
              downloads_limit: 30,
            }, { onConflict: 'id', ignoreDuplicates: true });

          const profileTimeout = new Promise<{ error: { message: string } }>((resolve) => {
            setTimeout(() => resolve({ error: { message: 'Profile creation timed out' } }), 5000);
          });

          const { error: profileError } = await Promise.race([profilePromise, profileTimeout]);
          if (profileError) {
            console.warn('Could not create user profile:', profileError.message);
          }
        } catch (profileErr) {
          console.warn('Profile upsert error:', profileErr);
        }
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('timed out')) {
        return { error: err };
      }
      return { error: new Error('Signup failed. Please try again.') };
    }
  };

  // ──────────────────────────────────────────────
  // Sign in — direct fetch + manual cookie write
  // Bypasses Supabase client entirely to avoid
  // navigator-lock contention with getSession.
  // ──────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

    if (!supabaseUrl || !supabaseKey) {
      return { error: new Error('Please configure Supabase in Vercel environment variables') };
    }

    console.log('[auth] signIn: starting...');
    const t0 = Date.now();

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(30000),
      });

      const data = await res.json();
      console.log(`[auth] signIn: ${res.status} in ${Date.now() - t0}ms`);

      if (!res.ok) {
        const msg = data?.error_description || data?.msg || data?.error || 'Login failed';
        if (msg.includes('Invalid login credentials')) {
          return { error: new Error('Invalid email or password. Please check your credentials and try again.') };
        }
        if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
          return { error: new Error('EMAIL_NOT_VERIFIED') };
        }
        return { error: new Error(msg) };
      }

      // Write cookies directly — no Supabase client lock involved
      if (data.access_token) {
        console.log('[auth] signIn: writing session cookies...');
        writeSessionCookies(JSON.stringify(data));
        console.log(`[auth] signIn: done in ${Date.now() - t0}ms`);
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      console.error(`[auth] signIn: error after ${Date.now() - t0}ms:`, err.message);
      if (err.name === 'TimeoutError' || err.message.includes('timed out') || err.message.includes('timeout')) {
        return { error: new Error('Login timed out. Supabase may be waking up — please try again in a few seconds.') };
      }
      return { error: new Error('Login failed. Please try again.') };
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: new Error('Please configure Supabase in Vercel environment variables') };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (error) {
      return { error: new Error('Google sign-in failed. Please try again.') };
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Please configure Supabase in Vercel environment variables') };
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Please configure Supabase in Vercel environment variables') };
    }
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 15000);
      });

      const resetPromise = supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      const { error } = await Promise.race([resetPromise, timeoutPromise]);
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('timed out')) {
        return { error: err };
      }
      return { error: new Error('Failed to send reset email. Please try again.') };
    }
  };

  // Sign out
  const signOut = async () => {
    if (!supabase) return;
    clearSessionCookies();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  const canDownload = () => {
    if (IS_BETA_MODE) return true;
    if (!profile) return true;
    return profile.downloads_this_month < profile.downloads_limit;
  };

  const remainingDownloads = () => {
    if (IS_BETA_MODE) return 99999;
    if (!profile) return 30;
    return Math.max(0, profile.downloads_limit - profile.downloads_this_month);
  };

  return (
    <AuthContext.Provider
      value={{
        user, profile, session, isLoading, isConfigured, isAdmin,
        signUp, signIn, signInWithGoogle, signOut, refreshProfile,
        resendVerificationEmail, resetPassword,
        canDownload, remainingDownloads,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
