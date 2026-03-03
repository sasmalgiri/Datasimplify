import { NextResponse } from 'next/server';
import { cleanupOldData } from '@/lib/dbCleanup';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  // Vercel Hobby plan crons send this UA (no custom headers on Hobby)
  const ua = request.headers.get('user-agent') || '';
  if (ua.includes('vercel-cron')) return true;

  // Manual trigger with secret header
  const secret = process.env.CLEANUP_SECRET;
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
