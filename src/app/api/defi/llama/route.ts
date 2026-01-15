/**
 * DefiLlama API Route
 *
 * Returns DeFi protocol and stablecoin data from DefiLlama
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

const LLAMA_BASE = 'https://api.llama.fi';

type LlamaType = 'stablecoins' | 'protocols';

function parseType(value: string | null): LlamaType | null {
  if (value === 'stablecoins' || value === 'protocols') return value;
  return null;
}

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/defi/llama');
  if (blocked) return blocked;
  if (!isFeatureEnabled('defi')) {
    return NextResponse.json(
      { success: false, disabled: true, error: 'DeFi feature is disabled.' },
      { status: 503 }
    );
  }

  assertRedistributionAllowed('defillama', { purpose: 'chart', route: '/api/defi/llama' });

  const { searchParams } = new URL(request.url);
  const type = parseType(searchParams.get('type'));

  if (!type) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid `type` query param.' },
      { status: 400 }
    );
  }

  const upstreamUrl = `${LLAMA_BASE}/${type}`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream returned ${res.status}`, source: 'defillama' },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error), source: 'defillama' },
      { status: 502 }
    );
  }
}
