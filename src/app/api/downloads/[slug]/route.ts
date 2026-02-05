import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { slug } = await context.params;

    const { data: release, error: relErr } = await supabaseAdmin
      .from('template_releases')
      .select('*')
      .eq('slug', slug)
      .single();

    if (relErr || !release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const { user } = await getAuthUser(request);

    // Require login for paid releases
    if (release.required_product_key) {
      if (!user) {
        return NextResponse.json({ error: 'Login required' }, { status: 401 });
      }

      const { data: entitlement, error: entErr } = await supabaseAdmin
        .from('product_entitlements')
        .select('id,status')
        .eq('user_id', user.id)
        .eq('product_key', release.required_product_key)
        .eq('status', 'active')
        .maybeSingle();

      if (entErr) {
        return NextResponse.json({ error: entErr.message }, { status: 500 });
      }

      if (!entitlement) {
        return NextResponse.json({ error: 'Not entitled' }, { status: 403 });
      }
    }

    // Create signed URL for download from Supabase Storage
    const expiresIn = 60 * 5; // 5 minutes
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from(release.storage_bucket)
      .createSignedUrl(release.storage_path, expiresIn);

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({
        error: 'Failed to create download link',
        details: signErr?.message,
      }, { status: 500 });
    }

    // Track download if logged in
    if (user) {
      const fileName: string = release.file_name || release.storage_path || 'download';
      const ext = fileName.includes('.') ? fileName.split('.').pop() : null;
      await supabaseAdmin
        .from('download_history')
        .insert({
          user_id: user.id,
          category: 'release_download',
          format: (ext || 'file').slice(0, 10),
          filters: {
            slug: release.slug,
            version: release.version,
            product_key: release.required_product_key || 'free',
            file_name: release.file_name,
            content_type: release.content_type,
          },
          row_count: null,
        });
    }

    return NextResponse.redirect(signed.signedUrl, 302);
  } catch (err) {
    console.error('[downloads/:slug] error', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
