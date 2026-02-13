import { NextResponse } from 'next/server';
import { cleanupOldData } from '@/lib/dbCleanup';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const secret = process.env.CLEANUP_SECRET;
  const allowVercelCron = process.env.CLEANUP_ALLOW_VERCEL_CRON === 'true';

  // Optional: allow Vercel cron user-agent (Hobby can't set custom headers).
  if (allowVercelCron) {
    const ua = request.headers.get('user-agent') || '';
    if (ua.includes('vercel-cron/1.0')) return true;
  }

  if (!secret) return false;
  const header = request.headers.get('x-cleanup-secret');
  return header === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupOldData();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cleanup run error:', error);
    return NextResponse.json({ success: false, error: 'Cleanup run failed' }, { status: 500 });
  }
}
