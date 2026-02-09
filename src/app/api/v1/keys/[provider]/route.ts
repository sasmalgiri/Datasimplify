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

const VALID_PROVIDERS = ['coingecko', 'binance', 'coinbase'] as const;
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
      key_type: validationResult.keyType || 'demo', // Store whether it's demo or pro
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
  keyType?: 'demo' | 'pro';
  error?: string;
}

async function validateProviderKey(
  provider: Provider,
  apiKey: string
): Promise<ValidationResult> {
  try {
    if (provider === 'coingecko') {
      // Try Pro API first
      const proResponse = await fetch('https://pro-api.coingecko.com/api/v3/ping', {
        headers: { 'x-cg-pro-api-key': apiKey },
        signal: AbortSignal.timeout(5000),
      });

      if (proResponse.ok) {
        return { isValid: true, keyType: 'pro' };
      }

      // Try Demo API (free tier)
      const demoResponse = await fetch('https://api.coingecko.com/api/v3/ping', {
        headers: { 'x-cg-demo-api-key': apiKey },
        signal: AbortSignal.timeout(5000),
      });

      if (demoResponse.ok) {
        return { isValid: true, keyType: 'demo' };
      }

      if (proResponse.status === 401 || proResponse.status === 403 ||
          demoResponse.status === 401 || demoResponse.status === 403) {
        return { isValid: false, error: 'Invalid API key. Make sure you have a valid CoinGecko Demo or Pro key.' };
      }

      return { isValid: false, error: 'Validation failed. Please try again.' };
    }

    if (provider === 'binance') {
      // For Binance, we store apiKey + secret as JSON: { key, secret }
      // Basic format validation (keys are typically 64 chars)
      try {
        const parsed = JSON.parse(apiKey);
        if (!parsed.key || !parsed.secret) {
          return { isValid: false, error: 'Binance requires JSON: {"key":"...","secret":"..."}' };
        }
        if (parsed.key.length < 20 || parsed.secret.length < 20) {
          return { isValid: false, error: 'Invalid Binance API key format' };
        }
        return { isValid: true, keyType: 'pro' };
      } catch {
        return { isValid: false, error: 'Binance key must be JSON: {"key":"YOUR_KEY","secret":"YOUR_SECRET"}' };
      }
    }

    if (provider === 'coinbase') {
      try {
        const parsed = JSON.parse(apiKey);
        if (!parsed.key || !parsed.secret) {
          return { isValid: false, error: 'Coinbase requires JSON: {"key":"...","secret":"..."}' };
        }
        return { isValid: true, keyType: 'pro' };
      } catch {
        return { isValid: false, error: 'Coinbase key must be JSON: {"key":"YOUR_KEY","secret":"YOUR_SECRET"}' };
      }
    }

    return { isValid: false, error: 'Unsupported provider' };
  } catch (error) {
    console.error('Validation error for ' + provider + ':', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return { isValid: false, error: 'Validation timeout' };
    }
    return { isValid: false, error: 'Network error during validation' };
  }
}
