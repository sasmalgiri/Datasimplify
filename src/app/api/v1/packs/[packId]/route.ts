/**
 * Pack Download API
 *
 * Downloads a pre-configured Excel pack template.
 * Packs are "report-first" workbooks that get data via /api/v1/report/run
 *
 * GET /api/v1/packs/market_overview - Download Market Overview pack
 * GET /api/v1/packs/defi_dashboard - Download DeFi Dashboard pack
 * GET /api/v1/packs/layer1_comparison - Download Layer 1 Comparison pack
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generatePack, PACK_RECIPES } from '@/lib/templates/packGenerator';
import {
  checkEntitlement,
  createEntitlementErrorResponse,
  incrementDownloadCount,
} from '@/lib/entitlements';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  const { packId } = await params;

  // Validate pack exists
  const recipe = PACK_RECIPES[packId];
  if (!recipe) {
    return NextResponse.json(
      {
        error: 'Pack not found',
        available_packs: Object.keys(PACK_RECIPES),
      },
      { status: 404 }
    );
  }

  // Require authentication for pack downloads
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required to download packs', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  // Check entitlement with download limit
  const entitlementCheck = await checkEntitlement(supabase, user.id, {
    requireDownload: true,
  });
  if (!entitlementCheck.allowed) {
    return NextResponse.json(
      createEntitlementErrorResponse(entitlementCheck),
      { status: entitlementCheck.status || 403 }
    );
  }

  try {
    // Generate the pack
    const buffer = await generatePack(recipe);

    // Increment download count and log usage
    void (async () => {
      try {
        await incrementDownloadCount(supabase, user.id);
        await supabase.from('usage_events').insert({
          user_id: user.id,
          event_type: 'pack_download',
          metadata: {
            pack_id: packId,
            pack_name: recipe.name,
            plan: entitlementCheck.entitlement?.tier,
          },
        });
      } catch (err) {
        console.error('Failed to log usage:', err);
      }
    })();

    // Return Excel file
    const filename = `${recipe.name.replace(/\s+/g, '-')}-CRK-Pack.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Pack generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate pack' },
      { status: 500 }
    );
  }
}

/**
 * List available packs
 */
export async function HEAD() {
  return NextResponse.json({
    packs: Object.entries(PACK_RECIPES).map(([id, recipe]) => ({
      id,
      name: recipe.name,
      description: recipe.description,
      coins_count: recipe.coins.length,
    })),
  });
}
