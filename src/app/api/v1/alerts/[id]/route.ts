/**
 * Alert Management Endpoint
 *
 * DELETE /api/v1/alerts/:id - Delete a specific alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Alert DELETE] Error:', error);
      return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Alert deleted' });
  } catch (err) {
    console.error('[Alert DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
