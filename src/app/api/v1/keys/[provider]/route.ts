/**
 * Provider API Keys Management Endpoint
 *
 * Handles CRUD operations for user-provided API keys (BYOK)
 * - GET: Check if key exists and get hint
 * - POST: Save/update provider key (with validation)
 * - DELETE: Remove provider key
 *
 * Security:
 * - Keys encrypted at rest with AES-256-GCM
 * - Validation before storage
 * - RLS enforced on database level
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { encryptApiKey, getKeyHint } from '@/lib/encryption';

const VALID_PROVIDERS = ['coingecko', 'binance', 'coinmarketcap'] as const;
type Provider = typeof VALID_PROVIDERS[number];

// GET - Check if key exists
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!VALID_PROVIDERS.includes(provider as Provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('provider_keys')
      .select('key_hint, is_valid, created_at, last_validated_at')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (error || !data) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      hint: data.key_hint,
      isValid: data.is_valid,
      connectedAt: data.created_at,
      lastValidated: data.last_validated_at,
    });
  } catch (error) {
    console.error('[Keys API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save/update provider key
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!VALID_PROVIDERS.includes(provider as Provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }

    const validationResult = await validateProviderKey(provider as Provider, apiKey);

    if (!validationResult.isValid) {
      return NextResponse.json({
        error: 'API key validation failed',
        message: validationResult.error || 'Invalid API key',
      }, { status: 400 });
    }

    const encryptedKey = encryptApiKey(apiKey);
    const hint = getKeyHint(apiKey);

    const { error } = await supabase.from('provider_keys').upsert({
      user_id: user.id,
      provider,
      encrypted_key: encryptedKey,
      key_hint: hint,
      is_valid: true,
      last_validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });

    if (error) {
      console.error('[Keys API] Save error:', error);
      return NextResponse.json({ error: 'Failed to save key' }, { status: 500 });
    }

    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: 'provider_key_connected',
      metadata: { provider, hint },
    });

    return NextResponse.json({
      success: true,
      hint,
      message: provider + ' API key connected successfully',
    });
  } catch (error) {
    console.error('[Keys API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove provider key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!VALID_PROVIDERS.includes(provider as Provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase.from('provider_keys').delete()
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      console.error('[Keys API] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 });
    }

    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: 'provider_key_disconnected',
      metadata: { provider },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Keys API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

async function validateProviderKey(
  provider: Provider,
  apiKey: string
): Promise<ValidationResult> {
  try {
    switch (provider) {
      case 'coingecko': {
        const response = await fetch('https://pro-api.coingecko.com/api/v3/ping', {
          headers: { 'x-cg-pro-api-key': apiKey },
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) return { isValid: true };
        if (response.status === 401 || response.status === 403) {
          return { isValid: false, error: 'Invalid API key' };
        }
        return { isValid: false, error: 'Validation failed: ' + response.status };
      }
      case 'binance': {
        if (!/^[A-Za-z0-9]{64}$/.test(apiKey)) {
          return { isValid: false, error: 'Invalid format (expected 64 alphanumeric chars)' };
        }
        return { isValid: true };
      }
      case 'coinmarketcap': {
        const response = await fetch('https://pro-api.coinmarketcap.com/v1/key/info', {
          headers: { 'X-CMC_PRO_API_KEY': apiKey },
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) return { isValid: true };
        if (response.status === 401 || response.status === 403) {
          return { isValid: false, error: 'Invalid API key' };
        }
        return { isValid: false, error: 'Validation failed: ' + response.status };
      }
      default:
        return { isValid: false, error: 'Unsupported provider' };
    }
  } catch (error) {
    console.error('Validation error for ' + provider + ':', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return { isValid: false, error: 'Validation timeout' };
    }
    return { isValid: false, error: 'Network error' };
  }
}
