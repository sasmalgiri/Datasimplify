/**
 * Supabase Audit Logging
 *
 * Logs security events to Supabase for monitoring and abuse detection.
 * Uses the security_events table.
 */

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export type SecurityEventType =
  | 'registration_attempt'
  | 'registration_success'
  | 'registration_blocked'
  | 'download_attempt'
  | 'download_success'
  | 'download_blocked'
  | 'rate_limit_exceeded'
  | 'bot_detected'
  | 'captcha_failed'
  | 'captcha_success'
  | 'suspicious_activity'
  | 'ip_blocked'
  | 'email_verification_sent'
  | 'email_verified';

export interface SecurityEvent {
  event_type: SecurityEventType;
  ip_address?: string;
  user_agent?: string;
  email?: string;
  user_id?: string;
  details?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log a security event to Supabase
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    // Log to console if Supabase not configured
    console.log('[SecurityAudit]', JSON.stringify(event));
    return;
  }

  try {
    const { error } = await supabaseAdmin
      .from('security_events')
      .insert({
        event_type: event.event_type,
        ip_address: event.ip_address || null,
        user_agent: event.user_agent?.slice(0, 500) || null, // Limit UA length
        email: event.email?.toLowerCase() || null,
        user_id: event.user_id || null,
        details: event.details || {},
        severity: event.severity || 'low',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[SecurityAudit] Failed to log event:', error);
    }
  } catch (err) {
    console.error('[SecurityAudit] Error logging event:', err);
  }
}

/**
 * Check for suspicious patterns (multiple failed attempts, etc.)
 */
export async function checkSuspiciousActivity(
  ip: string,
  email?: string
): Promise<{ suspicious: boolean; reason?: string }> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return { suspicious: false };
  }

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Check for multiple failed attempts from same IP
    const { count: ipFailures } = await supabaseAdmin
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .in('event_type', ['registration_blocked', 'download_blocked', 'rate_limit_exceeded', 'captcha_failed'])
      .gte('created_at', oneHourAgo);

    if (ipFailures && ipFailures >= 10) {
      return {
        suspicious: true,
        reason: `High failure rate from IP: ${ipFailures} failures in last hour`,
      };
    }

    // Check for multiple emails from same IP (email farming)
    if (email) {
      const { count: emailCount } = await supabaseAdmin
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .eq('event_type', 'registration_success')
        .gte('created_at', oneHourAgo);

      if (emailCount && emailCount >= 5) {
        return {
          suspicious: true,
          reason: `Multiple registrations from IP: ${emailCount} in last hour`,
        };
      }
    }

    return { suspicious: false };
  } catch (err) {
    console.error('[SecurityAudit] Error checking suspicious activity:', err);
    return { suspicious: false };
  }
}

/**
 * Get recent security events for an IP or email
 */
export async function getRecentEvents(
  options: { ip?: string; email?: string; limit?: number }
): Promise<unknown[]> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return [];
  }

  try {
    let query = supabaseAdmin
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(options.limit || 50);

    if (options.ip) {
      query = query.eq('ip_address', options.ip);
    }

    if (options.email) {
      query = query.eq('email', options.email.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SecurityAudit] Error fetching events:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[SecurityAudit] Error fetching events:', err);
    return [];
  }
}

/**
 * Get abuse statistics for monitoring
 */
export async function getAbuseStats(): Promise<{
  last24h: { total: number; blocked: number; suspicious: number };
  topIps: Array<{ ip: string; count: number }>;
}> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return {
      last24h: { total: 0, blocked: 0, suspicious: 0 },
      topIps: [],
    };
  }

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Total events in last 24h
    const { count: total } = await supabaseAdmin
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    // Blocked events
    const { count: blocked } = await supabaseAdmin
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .in('event_type', ['registration_blocked', 'download_blocked', 'ip_blocked', 'bot_detected'])
      .gte('created_at', oneDayAgo);

    // High severity events
    const { count: suspicious } = await supabaseAdmin
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .in('severity', ['high', 'critical'])
      .gte('created_at', oneDayAgo);

    // Top IPs by event count (potential abuse)
    const { data: topIpsData } = await supabaseAdmin
      .rpc('get_top_ips_by_events', { since_time: oneDayAgo, limit_count: 10 });

    return {
      last24h: {
        total: total || 0,
        blocked: blocked || 0,
        suspicious: suspicious || 0,
      },
      topIps: topIpsData || [],
    };
  } catch (err) {
    console.error('[SecurityAudit] Error getting abuse stats:', err);
    return {
      last24h: { total: 0, blocked: 0, suspicious: 0 },
      topIps: [],
    };
  }
}
