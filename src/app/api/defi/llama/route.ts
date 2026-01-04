import { NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';

const LLAMA_BASE = 'https://api.llama.fi';

type LlamaType = 'stablecoins' | 'protocols';

function parseType(value: string | null): LlamaType | null {
  if (value === 'stablecoins' || value === 'protocols') return value;
  return null;
}

export async function GET(request: Request) {
  if (!isFeatureEnabled('defi')) {
    return NextResponse.json(
      { success: false, disabled: true, error: 'DeFi feature is disabled.' },
      { status: 503 }
    );
  }

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
