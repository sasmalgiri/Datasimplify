import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables (client-side accessible)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  isValidUrl(supabaseUrl)
);

// Singleton client instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
}

// Export the client (may be null if not configured)
export const supabaseBrowser = getSupabaseBrowser();

// Types for feedback and template requests
export interface PageFeedback {
  id?: string;
  page_path: string;
  page_title?: string;
  helpful: boolean;
  reason?: string;
  message?: string;
  ip?: string;
  user_agent?: string;
  user_id?: string;
  created_at?: string;
}

export interface TemplateRequest {
  id?: string;
  page_path?: string;
  page_title?: string;
  coins?: string[];
  report_type: string;
  timeframe?: string;
  purpose: string;
  details?: string;
  votes_count?: number;
  status?: 'pending' | 'planned' | 'building' | 'shipped';
  ip?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateRequestVote {
  id?: string;
  request_id: string;
  ip?: string;
  user_id?: string;
  created_at?: string;
}

// Helper to check if a vote already exists
export async function hasVoted(requestId: string, ip: string): Promise<boolean> {
  const client = getSupabaseBrowser();
  if (!client) return false;

  const { data, error } = await client
    .from('template_request_votes')
    .select('id')
    .eq('request_id', requestId)
    .eq('ip', ip)
    .single();

  return !error && !!data;
}
