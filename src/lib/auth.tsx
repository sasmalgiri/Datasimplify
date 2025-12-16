'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  subscription_tier: 'free' | 'starter' | 'pro' | 'business';
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
  canDownload: () => boolean;
  remainingDownloads: () => number;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// CHECK CONFIG
// ============================================

const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase, setSupabase] = useState<ReturnType<typeof import('@supabase/auth-helpers-nextjs').createClientComponentClient> | null>(null);

  // Download limits by tier
  const downloadLimits: Record<string, number> = {
    free: 5,
    starter: 50,
    pro: 999999,
    business: 999999,
  };

  // Initialize Supabase client
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Dynamically import to avoid build errors
    import('@supabase/auth-helpers-nextjs').then(({ createClientComponentClient }) => {
      const client = createClientComponentClient();
      setSupabase(client);
    });
  }, []);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    if (!supabase) return;

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
          email: user?.email,
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
  };

  // Initialize auth state
  useEffect(() => {
    if (!supabase) return;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
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
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Sign up
  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Auth not configured') };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Auth not configured') };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
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
      await fetchProfile(user.id);
    }
  };

  // Check if user can download
  const canDownload = () => {
    if (!profile) return true; // Allow for non-logged-in users (free tier)
    if (profile.subscription_tier === 'pro' || profile.subscription_tier === 'business') {
      return true;
    }
    return profile.downloads_this_month < profile.downloads_limit;
  };

  // Get remaining downloads
  const remainingDownloads = () => {
    if (!profile) return 5; // Default free tier
    if (profile.subscription_tier === 'pro' || profile.subscription_tier === 'business') {
      return 999999;
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
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        refreshProfile,
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
