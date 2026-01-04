import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { PADDLE_CONFIG, isCountryBlocked } from '@/lib/payments';
import { isFeatureEnabled } from '@/lib/featureFlags';

// ============================================
// PADDLE CHECKOUT API
// Returns config for Paddle.js frontend checkout
// ============================================

export async function POST(request: Request) {
  if (!isFeatureEnabled('payments')) {
    return NextResponse.json({ error: 'Payments are disabled' }, { status: 404 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { tier } = await request.json();

    if (!tier || !['starter', 'pro', 'business'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Check country
    const headersList = await headers();
    const country = headersList.get('cf-ipcountry') ||
                   headersList.get('x-vercel-ip-country') ||
                   'US';

    if (isCountryBlocked(country)) {
      return NextResponse.json({
        error: 'Service not available in your region yet',
        blocked: true,
        country,
        message: 'We are launching in India soon! Join the waitlist.',
      }, { status: 403 });
    }

    // Check Paddle configuration
    if (!PADDLE_CONFIG.vendorId) {
      return NextResponse.json({
        error: 'Payment system not configured',
        message: 'Please configure Paddle credentials',
      }, { status: 503 });
    }

    const priceId = PADDLE_CONFIG.prices[tier as keyof typeof PADDLE_CONFIG.prices];

    if (!priceId) {
      return NextResponse.json({
        error: 'Price not configured for this tier',
      }, { status: 500 });
    }

    // Update user profile with payment provider
    await supabase
      .from('user_profiles')
      .update({ payment_provider: 'paddle' })
      .eq('id', user.id);

    // Return Paddle checkout config for frontend
    return NextResponse.json({
      provider: 'paddle',
      priceId,
      config: {
        vendor: PADDLE_CONFIG.vendorId,
        environment: PADDLE_CONFIG.environment,
        email: user.email,
        customData: {
          user_id: user.id,
        },
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
          locale: 'en',
        },
      },
    });

  } catch (error) {
    console.error('Paddle checkout error:', error);
    return NextResponse.json({
      error: 'Checkout failed',
      details: String(error),
    }, { status: 500 });
  }
}

// ============================================
// GET: Return pricing info and availability
// ============================================

export async function GET(request: Request) {
  if (!isFeatureEnabled('payments')) {
    return NextResponse.json({ available: false, blocked: true, blockedMessage: 'Payments are disabled' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  const headersList = await headers();
  const detectedCountry = country ||
                          headersList.get('cf-ipcountry') ||
                          headersList.get('x-vercel-ip-country') ||
                          'US';

  const blocked = isCountryBlocked(detectedCountry);

  return NextResponse.json({
    available: !blocked,
    country: detectedCountry,
    blocked,
    blockedMessage: blocked
      ? 'We are launching in India soon with UPI payments! Join the waitlist.'
      : null,
    provider: 'paddle',
    pricing: PADDLE_CONFIG.displayPrices,
    currency: 'USD',
  });
}
