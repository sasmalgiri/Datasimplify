'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { type SupabaseClient, type User, type Session } from '@supabase/supabase-js';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

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
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
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

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState<SupabaseClient | null>(() => getSupabaseClient());
  const [isConfigured] = useState(() => supabase !== null);

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
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
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
    if (!profile) return true;
    return profile.downloads_this_month < profile.downloads_limit;
  };

  const remainingDownloads = () => {
    if (!profile) return 30;
    return Math.max(0, profile.downloads_limit - profile.downloads_this_month);
  };

  return (
    <AuthContext.Provider
      value={{
        user, profile, session, isLoading, isConfigured,
        signUp, signIn, signOut, refreshProfile,
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
