import 'server-only';

import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function logDownloadEvent(params: {
  request: Request;
  category: string;
  format: string;
  fileName?: string;
  rowCount?: number;
  filters?: Record<string, unknown>;
  userId?: string | null;
  userEmail?: string | null;
}) {
  if (!isSupabaseConfigured || !supabaseAdmin) return;

  const {
    request,
    category,
    format,
    fileName,
    rowCount,
    filters,
    userId,
    userEmail,
  } = params;

  try {
    await supabaseAdmin.from('download_events').insert({
      user_id: userId || null,
      user_email: userEmail || null,
      category,
      format,
      file_name: fileName || null,
      row_count: typeof rowCount === 'number' && Number.isFinite(rowCount) ? rowCount : null,
      filters: filters || null,
      ip: getClientIp(request),
      user_agent: request.headers.get('user-agent') || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Never block the download on logging; just keep it best-effort.
    console.error('[DownloadTracking] Failed to log download event:', err);
  }
}
