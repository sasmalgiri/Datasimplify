/**
 * Wizard API Key Validation Endpoint
 *
 * Validates a CoinGecko API key without requiring authentication.
 * Used in the setup wizard for users who aren't logged in yet.
 * Does NOT store the key - just validates it.
 */

import { NextRequest, NextResponse } from 'next/server';

interface ValidationResult {
  isValid: boolean;
  keyType?: 'demo' | 'pro';
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, provider } = body;

    if (provider !== 'coingecko') {
      return NextResponse.json({
        error: 'Only CoinGecko is supported',
      }, { status: 400 });
    }

    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
      return NextResponse.json({
        error: 'Invalid API key format',
      }, { status: 400 });
    }

    const result = await validateCoinGeckoKey(apiKey);

    if (!result.isValid) {
      return NextResponse.json({
        error: result.error || 'Invalid API key',
        valid: false,
      }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      keyType: result.keyType,
      message: `CoinGecko ${result.keyType} API key validated successfully`,
    });
  } catch (error) {
    console.error('[Wizard Validate Key] Error:', error);
    return NextResponse.json({
      error: 'Validation failed. Please try again.',
    }, { status: 500 });
  }
}

async function validateCoinGeckoKey(apiKey: string): Promise<ValidationResult> {
  try {
    // Try Demo API first (most common for free users)
    const demoResponse = await fetch('https://api.coingecko.com/api/v3/ping', {
      headers: { 'x-cg-demo-api-key': apiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (demoResponse.ok) {
      return { isValid: true, keyType: 'demo' };
    }

    // Try Pro API
    const proResponse = await fetch('https://pro-api.coingecko.com/api/v3/ping', {
      headers: { 'x-cg-pro-api-key': apiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (proResponse.ok) {
      return { isValid: true, keyType: 'pro' };
    }

    // Both failed - check error codes
    if (demoResponse.status === 401 || demoResponse.status === 403 ||
        proResponse.status === 401 || proResponse.status === 403) {
      return {
        isValid: false,
        error: 'Invalid API key. Please check that you copied the full key from CoinGecko.',
      };
    }

    // Rate limit or other error
    if (demoResponse.status === 429 || proResponse.status === 429) {
      return {
        isValid: false,
        error: 'Rate limited. Please wait a moment and try again.',
      };
    }

    return {
      isValid: false,
      error: 'Could not validate key. Please try again.',
    };
  } catch (error) {
    console.error('[Validate CoinGecko Key] Error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return { isValid: false, error: 'Validation timed out. Please try again.' };
    }
    return { isValid: false, error: 'Network error. Please check your connection.' };
  }
}
