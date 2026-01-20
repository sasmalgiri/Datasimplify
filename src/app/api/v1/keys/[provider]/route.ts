/**
 * Provider Keys API
 *
 * Manages encrypted API keys for data providers (CoinGecko, Binance, etc.)
 *
 * GET /api/v1/keys/:provider - Check if key exists (returns hint only)
 * POST /api/v1/keys/:provider - Save/update provider key
 * DELETE /api/v1/keys/:provider - Remove provider key
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { encryptApiKey, getKeyHint } from '@/lib/encryption';

const VALID_PROVIDERS = ['coingecko', 'binance', 'coinmarketcap', 'messari'] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

function isValidProvider(provider: string): provider is Provider {
  return VALID_PROVIDERS.includes(provider as Provider);
}

/**
 * GET - Check if a provider key exists
 * Returns connection status and key hint (last 4 chars)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!isValidProvider(provider)) {
    return NextResponse.json(
      { error: 'Invalid provider', validProviders: VALID_PROVIDERS },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('provider_keys')
    .select('key_hint, is_valid, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return NextResponse.json({ connected: false, provider });
  }

  return NextResponse.json({
    connected: true,
    provider,
    hint: data.key_hint,
    isValid: data.is_valid,
    connectedAt: data.created_at,
    updatedAt: data.updated_at,
  });
}

/**
 * POST - Save or update a provider API key
 * Validates the key before saving
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!isValidProvider(provider)) {
    return NextResponse.json(
      { error: 'Invalid provider', validProviders: VALID_PROVIDERS },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { apiKey } = body;

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  if (apiKey.length < 10) {
    return NextResponse.json(
      { error: 'API key appears too short' },
      { status: 400 }
    );
  }

  // Validate the key by making a test request to the provider
  const validationResult = await validateProviderKey(provider, apiKey);

  if (!validationResult.valid) {
    return NextResponse.json(
      { error: validationResult.error || 'API key validation failed' },
      { status: 400 }
    );
  }

  // Encrypt and store the key
  const encryptedKey = encryptApiKey(apiKey);
  const hint = getKeyHint(apiKey);

  const { error } = await supabase.from('provider_keys').upsert(
    {
      user_id: user.id,
      provider,
      encrypted_key: encryptedKey,
      key_hint: hint,
      is_valid: true,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,provider',
    }
  );

  if (error) {
    console.error('Failed to save provider key:', error);
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    );
  }

  // Log usage event
  await supabase.from('usage_events').insert({
    user_id: user.id,
    event_type: 'provider_key_connected',
    metadata: { provider },
  });

  return NextResponse.json({
    success: true,
    provider,
    hint,
    message: `${getProviderDisplayName(provider)} API key connected successfully`,
  });
}

/**
 * DELETE - Remove a provider API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!isValidProvider(provider)) {
    return NextResponse.json(
      { error: 'Invalid provider', validProviders: VALID_PROVIDERS },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('provider_keys')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider);

  if (error) {
    console.error('Failed to delete provider key:', error);
    return NextResponse.json(
      { error: 'Failed to remove API key' },
      { status: 500 }
    );
  }

  // Log usage event
  await supabase.from('usage_events').insert({
    user_id: user.id,
    event_type: 'provider_key_disconnected',
    metadata: { provider },
  });

  return NextResponse.json({
    success: true,
    provider,
    message: `${getProviderDisplayName(provider)} API key removed`,
  });
}

/**
 * Validate an API key by making a test request to the provider
 */
async function validateProviderKey(
  provider: Provider,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    switch (provider) {
      case 'coingecko': {
        // Try the Pro API endpoint first
        const proRes = await fetch(
          'https://pro-api.coingecko.com/api/v3/ping',
          {
            headers: { 'x-cg-pro-api-key': apiKey },
          }
        );
        if (proRes.ok) {
          return { valid: true };
        }
        // If Pro fails, try Demo API
        const demoRes = await fetch(
          'https://api.coingecko.com/api/v3/ping',
          {
            headers: { 'x-cg-demo-api-key': apiKey },
          }
        );
        if (demoRes.ok) {
          return { valid: true };
        }
        return { valid: false, error: 'CoinGecko API key is invalid' };
      }

      case 'binance': {
        // Binance public endpoints don't require auth, but we can verify key format
        // A valid Binance API key is 64 characters
        if (apiKey.length >= 64) {
          return { valid: true };
        }
        return {
          valid: false,
          error: 'Binance API key should be at least 64 characters',
        };
      }

      case 'coinmarketcap': {
        const cmcRes = await fetch(
          'https://pro-api.coinmarketcap.com/v1/key/info',
          {
            headers: { 'X-CMC_PRO_API_KEY': apiKey },
          }
        );
        if (cmcRes.ok) {
          return { valid: true };
        }
        const cmcError = await cmcRes.json().catch(() => ({}));
        return {
          valid: false,
          error:
            cmcError?.status?.error_message || 'CoinMarketCap API key is invalid',
        };
      }

      case 'messari': {
        const messariRes = await fetch('https://data.messari.io/api/v1/assets', {
          headers: { 'x-messari-api-key': apiKey },
        });
        if (messariRes.ok) {
          return { valid: true };
        }
        return { valid: false, error: 'Messari API key is invalid' };
      }

      default:
        return { valid: false, error: 'Unknown provider' };
    }
  } catch (err) {
    console.error('Error validating provider key:', err);
    return { valid: false, error: 'Failed to validate API key' };
  }
}

/**
 * Get display name for a provider
 */
function getProviderDisplayName(provider: Provider): string {
  const names: Record<Provider, string> = {
    coingecko: 'CoinGecko',
    binance: 'Binance',
    coinmarketcap: 'CoinMarketCap',
    messari: 'Messari',
  };
  return names[provider];
}
