/**
 * Alert Check Endpoint
 *
 * POST /api/v1/alerts/check - Check all active alerts against current prices
 *
 * Can be triggered by:
 * - Vercel Cron job
 * - Manual trigger from admin
 * - Piggybacked on other API calls
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isEmailConfigured, sendEmail } from '@/lib/email';

const COINGECKO_FREE = 'https://api.coingecko.com/api/v3';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or admin auth
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active alerts
    const { data: alerts, error } = await supabase
      .from('price_alerts')
      .select('*, user_profiles!inner(email:id)')
      .eq('is_active', true)
      .is('triggered_at', null);

    if (error || !alerts || alerts.length === 0) {
      return NextResponse.json({ checked: 0, triggered: 0 });
    }

    // Get unique coin IDs
    const coinIds = [...new Set(alerts.map(a => a.coin_id))];

    // Fetch current prices
    const priceRes = await fetch(
      `${COINGECKO_FREE}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`
    );
    if (!priceRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 502 });
    }
    const prices = await priceRes.json();

    let triggered = 0;

    for (const alert of alerts) {
      const currentPrice = prices[alert.coin_id]?.usd;
      if (!currentPrice) continue;

      const shouldTrigger =
        (alert.alert_type === 'above' && currentPrice >= alert.threshold) ||
        (alert.alert_type === 'below' && currentPrice <= alert.threshold);

      if (shouldTrigger) {
        // Mark as triggered
        await supabase
          .from('price_alerts')
          .update({
            triggered_at: new Date().toISOString(),
            is_active: false,
            notification_sent: true,
          })
          .eq('id', alert.id);

        // Send email notification
        if (isEmailConfigured()) {
          // Get user email
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('id', alert.user_id)
            .single();

          if (profile?.email) {
            const direction = alert.alert_type === 'above' ? 'risen above' : 'dropped below';
            await sendEmail({
              to: profile.email,
              subject: `CRK Alert: ${alert.coin_id} has ${direction} $${alert.threshold}`,
              html: `
                <h2>Price Alert Triggered</h2>
                <p><strong>${alert.coin_id.toUpperCase()}</strong> has ${direction} your threshold of <strong>$${alert.threshold.toLocaleString()}</strong>.</p>
                <p>Current price: <strong>$${currentPrice.toLocaleString()}</strong></p>
                <p style="color: #666; font-size: 12px;">This alert has been deactivated. Create a new one in your dashboard.</p>
              `,
            });
          }
        }

        triggered++;
      }
    }

    return NextResponse.json({
      checked: alerts.length,
      triggered,
      prices: Object.fromEntries(coinIds.map(id => [id, prices[id]?.usd])),
    });
  } catch (err) {
    console.error('[Alert Check] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
