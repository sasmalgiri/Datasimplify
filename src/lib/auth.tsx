'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  subscription_tier: 'free' | 'pro' | 'premium';
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
  canDownload: () => boolean;
  remainingDownloads: () => number;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// SUPABASE CLIENT (with trimmed env vars)
// ============================================

const getSupabaseClient = (): SupabaseClient | null => {
  // Trim whitespace from env vars (common issue when copying to Vercel)
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  
  // Validate
  if (!url || !key) {
    console.log('Supabase not configured: missing URL or key');
    return null;
  }
  
  if (!url.includes('supabase.co')) {
    console.log('Supabase not configured: invalid URL');
    return null;
  }
  
  if (!key.startsWith('eyJ')) {
    console.log('Supabase not configured: invalid key format');
    return null;
  }
  
  try {
    return createClient(url, key);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
};

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

  // Download limits by tier (Free: 5, Pro: 100, Premium: unlimited)
  const downloadLimits: Record<string, number> = {
    free: 5,
    pro: 100,
    premium: 999999,
  };

  // Fetch user profile from database
  const fetchProfile = async (userId: string, userEmail?: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: userEmail || '',
            subscription_tier: 'free',
            downloads_this_month: 0,
            downloads_limit: downloadLimits.free,
          })
          .select()
          .single();
        
        setProfile(newProfile);
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), 15000);
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
        // Make error messages more user-friendly
        if (error.message.includes('Invalid API key')) {
          return { error: new Error('Server configuration error. Please contact support.') };
        }
        // Handle database trigger errors gracefully
        if (error.message.includes('Database error saving new user') ||
            error.message.includes('Database error')) {
          // The auth user was likely created, but the profile trigger failed
          console.error('Profile creation trigger failed:', error.message);
          return { error: new Error('Account creation is temporarily unavailable. Please try again in a few minutes or contact support.') };
        }
        if (error.message.includes('User already registered')) {
          return { error: new Error('This email is already registered. Please sign in instead.') };
        }
        return { error: new Error(error.message) };
      }

      // If signup succeeded but we need to ensure profile exists
      if (data?.user) {
        // Try to create profile if trigger didn't work (with short timeout)
        try {
          const profilePromise = supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              email: email,
              subscription_tier: 'free',
              downloads_this_month: 0,
              downloads_limit: 5,
            }, {
              onConflict: 'id',
              ignoreDuplicates: true
            });

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

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Please configure Supabase in Vercel environment variables') };
    }
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) => {
        setTimeout(() => reject(new Error('Login timed out. Please check your connection and try again.')), 15000);
      });

      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const result = await Promise.race([signInPromise, timeoutPromise]);

      // Check if it was the timeout
      if ('error' in result && result.error instanceof Error && result.error.message.includes('timed out')) {
        return { error: result.error };
      }

      const { error } = result as Awaited<typeof signInPromise>;

      if (error) {
        // Make error messages more user-friendly
        if (error.message.includes('Invalid API key')) {
          return { error: new Error('Server configuration error. Please contact support.') };
        }
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          return { error: new Error('EMAIL_NOT_VERIFIED') };
        }
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error('Invalid email or password. Please check your credentials and try again.') };
        }
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('timed out')) {
        return { error: err };
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

  // Sign out
  const signOut = async () => {
    if (!supabase) return;
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

  // Check if user can download
  const canDownload = () => {
    if (!profile) return true;
    if (profile.subscription_tier === 'premium') {
      return true; // Premium has unlimited
    }
    return profile.downloads_this_month < profile.downloads_limit;
  };

  // Get remaining downloads
  const remainingDownloads = () => {
    if (!profile) return 5;
    if (profile.subscription_tier === 'premium') {
      return 999999; // Premium has unlimited
    }
    return Math.max(0, profile.downloads_limit - profile.downloads_this_month);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isConfigured,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        resendVerificationEmail,
        canDownload,
        remainingDownloads,
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
