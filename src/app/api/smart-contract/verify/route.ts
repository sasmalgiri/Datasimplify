/**
 * Smart Contract Verification API
 *
 * Uses Sourcify to check whether a deployed contract is verified.
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getContractVerificationFromCache, saveContractVerificationToCache } from '@/lib/supabaseData';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

const SOURCIFY_BASE_URL = 'https://sourcify.dev/server';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function fetchSourcifyContract(chainId: number, address: string): Promise<{
  verified: boolean;
  matchType?: string;
  contractName?: string;
  raw?: unknown;
}> {
  const url = `${SOURCIFY_BASE_URL}/v2/contract/${encodeURIComponent(String(chainId))}/${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    cache: 'no-store'
  });

  if (res.status === 404) {
    return { verified: false };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sourcify error (${res.status}): ${text || res.statusText}`);
  }

  const json = await res.json().catch(() => null);

  const contractName = (() => {
    if (!isRecord(json)) return undefined;
    const name = json['name'];
    return typeof name === 'string' ? name : undefined;
  })();

  const matchType = (() => {
    if (!isRecord(json)) return undefined;
    const mt = json['matchType'];
    return typeof mt === 'string' ? mt : undefined;
  })();

  return {
    verified: true,
    matchType,
    contractName,
    raw: json
  };
}

export async function POST(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/smart-contract/verify');
  if (blocked) return blocked;

  if (!isFeatureEnabled('smartContractVerifier')) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => null);
    const bodyRecord: Record<string, unknown> = isRecord(body) ? body : {};

    const chainId = Number(bodyRecord['chainId'] ?? 1);
    const address = String(bodyRecord['address'] ?? '').trim();

    if (!Number.isFinite(chainId) || chainId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid chainId. Provide a positive integer.',
        code: 'E_INVALID_INPUT'
      }, { status: 400 });
    }

    if (!isValidEvmAddress(address)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid address. Provide a 0x-prefixed 40-hex EVM address.',
        code: 'E_INVALID_INPUT'
      }, { status: 400 });
    }

    // 1) Cache-first (fresh). If stale exists and live fails, return stale with explicit flag.
    let cached = null as Awaited<ReturnType<typeof getContractVerificationFromCache>>;
    if (isSupabaseConfigured) {
      cached = await getContractVerificationFromCache(chainId, address);
      if (cached) {
        const ageMs = Date.now() - new Date(cached.updated_at).getTime();
        if (Number.isFinite(ageMs) && ageMs <= CACHE_TTL_MS) {
          return NextResponse.json({
            success: true,
            chainId,
            address,
            verified: cached.status === 'verified',
            status: cached.status,
            matchType: cached.match_type ?? undefined,
            contractName: cached.contract_name ?? undefined,
            source: 'cache',
            stale: false
          });
        }
      }
    }

    // 2) Live Sourcify lookup
    try {
      const live = await fetchSourcifyContract(chainId, address);

      if (isSupabaseConfigured) {
        await saveContractVerificationToCache({
          chainId,
          address,
          status: live.verified ? 'verified' : 'not_verified',
          matchType: live.matchType ?? null,
          contractName: live.contractName ?? null,
          raw: live.raw ?? null
        });
      }

      return NextResponse.json({
        success: true,
        chainId,
        address,
        verified: live.verified,
        status: live.verified ? 'verified' : 'not_verified',
        matchType: live.matchType,
        contractName: live.contractName,
        source: 'sourcify',
        stale: false
      });
    } catch (liveError) {
      if (cached) {
        return NextResponse.json({
          success: true,
          chainId,
          address,
          verified: cached.status === 'verified',
          status: cached.status,
          matchType: cached.match_type ?? undefined,
          contractName: cached.contract_name ?? undefined,
          source: 'cache',
          stale: true,
          staleReason: liveError instanceof Error ? liveError.message : 'Live lookup failed'
        });
      }

      throw liveError;
    }

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to verify contract via Sourcify.',
      code: 'E_VERIFICATION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 502 });
  }
}
