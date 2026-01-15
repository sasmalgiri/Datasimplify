/**
 * Fear & Greed History API
 *
 * Returns historical fear & greed data from Alternative.me
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

// Alternative.me Fear & Greed Index API (FREE)
const FEAR_GREED_API = 'https://api.alternative.me/fng/';

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/onchain/fear-greed-history');
  if (blocked) return blocked;
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(365, Math.max(1, Number.parseInt(searchParams.get('limit') || '30', 10) || 30));

    assertRedistributionAllowed('alternativeme', { purpose: 'chart', route: '/api/onchain/fear-greed-history' });

    const response = await fetch(`${FEAR_GREED_API}?limit=${limit}&format=json`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, data: [], source: 'error', error: `Fear & Greed API returned ${response.status}` },
        { status: 502 }
      );
    }

    const result = await response.json();
    const rows = Array.isArray(result?.data) ? result.data : [];

    const data = rows
      .map((r: any) => ({
        timestamp: typeof r?.timestamp === 'string' ? new Date(Number(r.timestamp) * 1000).toISOString() : null,
        value: typeof r?.value === 'string' ? Number.parseInt(r.value, 10) : null,
        classification: typeof r?.value_classification === 'string' ? r.value_classification : null,
      }))
      .filter((r: any) => r.timestamp && Number.isFinite(r.value));

    return NextResponse.json({
      success: true,
      data,
      limit,
      source: 'alternative.me',
      updated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, data: [], source: 'error', error: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}
