import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  if (id) {
    // Fetch specific upload with full data
    const { data, error } = await (supabase.from('datalab_excel_uploads') as any)
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }
    return NextResponse.json({ upload: data });
  }

  // Fetch active upload (latest)
  const { data, error } = await (supabase.from('datalab_excel_uploads') as any)
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ upload: null });
  }

  return NextResponse.json({ upload: data });
}
