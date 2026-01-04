import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { paddlePriceToTier } from '@/lib/payments';
import { verifyPaddleWebhookSignature } from '@/lib/paddleWebhook';
import { isFeatureEnabled } from '@/lib/featureFlags';

// ============================================
// PADDLE WEBHOOK HANDLER
// Handles subscription lifecycle events
// ============================================

// Lazy Supabase client (only initialize when needed)
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase not configured');
  }
  
  return createClient(url, key);
}

export async function POST(request: Request) {
  if (!isFeatureEnabled('payments')) {
    return NextResponse.json({ error: 'Payments are disabled' }, { status: 404 });
  }

  try {
    const body = await request.text();

    // Verify Paddle signature (prevents spoofed subscription events)
    const signatureHeader =
      request.headers.get('paddle-signature') ||
      request.headers.get('Paddle-Signature') ||
      '';
    const secret = (process.env.PADDLE_WEBHOOK_SECRET || '').trim();

    // Fail closed in production if misconfigured
    if (process.env.NODE_ENV === 'production' && !secret) {
      return NextResponse.json(
        { error: 'Webhook misconfigured' },
        { status: 500 }
      );
    }

    if (secret) {
      const verification = verifyPaddleWebhookSignature({
        rawBody: body,
        signatureHeader,
        secret,
        toleranceSeconds: 300,
      });

      if (!verification.ok) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
    }

    const event = JSON.parse(body);
    console.log('Paddle webhook received:', event.event_type);

    const supabase = getSupabase();

    switch (event.event_type) {
      // ============================================
      // SUBSCRIPTION CREATED / ACTIVATED
      // ============================================
      case 'subscription.created':
      case 'subscription.activated': {
        const data = event.data;
        const customData = data.custom_data || {};
        const userId = customData.user_id;
        const priceId = data.items?.[0]?.price?.id;

        if (userId && priceId) {
          const tierInfo = paddlePriceToTier(priceId);
          
          if (tierInfo) {
            await supabase
              .from('user_profiles')
              .update({
                subscription_tier: tierInfo.tier,
                downloads_limit: tierInfo.limit,
                downloads_this_month: 0, // Reset on new subscription
                paddle_subscription_id: data.id,
                paddle_customer_id: data.customer_id,
                payment_provider: 'paddle',
                subscription_status: 'active',
              })
              .eq('id', userId);

            console.log(`✅ User ${userId} subscribed to ${tierInfo.tier}`);
          }
        }
        break;
      }

      // ============================================
      // SUBSCRIPTION UPDATED (Plan change)
      // ============================================
      case 'subscription.updated': {
        const data = event.data;
        const priceId = data.items?.[0]?.price?.id;

        // Find user by Paddle customer ID
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('paddle_customer_id', data.customer_id)
          .single();

        if (profile && priceId) {
          const tierInfo = paddlePriceToTier(priceId);
          
          if (tierInfo) {
            await supabase
              .from('user_profiles')
              .update({
                subscription_tier: tierInfo.tier,
                downloads_limit: tierInfo.limit,
              })
              .eq('id', profile.id);

            console.log(`✅ User ${profile.id} updated to ${tierInfo.tier}`);
          }
        }
        break;
      }

      // ============================================
      // SUBSCRIPTION CANCELLED
      // ============================================
      case 'subscription.canceled': {
        const data = event.data;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('paddle_customer_id', data.customer_id)
          .single();

        if (profile) {
          // Downgrade to free at end of billing period
          // Note: Paddle sends this immediately, but access continues until period ends
          await supabase
            .from('user_profiles')
            .update({
              subscription_status: 'cancelled',
              // Don't change tier yet - they keep access until period ends
            })
            .eq('id', profile.id);

          console.log(`⚠️ User ${profile.id} cancelled (access until period end)`);
        }
        break;
      }

      // ============================================
      // SUBSCRIPTION PAUSED
      // ============================================
      case 'subscription.paused': {
        const data = event.data;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('paddle_customer_id', data.customer_id)
          .single();

        if (profile) {
          await supabase
            .from('user_profiles')
            .update({
              subscription_tier: 'free',
              downloads_limit: 5,
              subscription_status: 'paused',
            })
            .eq('id', profile.id);

          console.log(`⏸️ User ${profile.id} paused - downgraded to free`);
        }
        break;
      }

      // ============================================
      // SUBSCRIPTION PAST DUE (Payment failed)
      // ============================================
      case 'subscription.past_due': {
        const data = event.data;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('paddle_customer_id', data.customer_id)
          .single();

        if (profile) {
          await supabase
            .from('user_profiles')
            .update({
              subscription_status: 'past_due',
            })
            .eq('id', profile.id);

          console.log(`⚠️ User ${profile.id} payment failed - past due`);
          // TODO: Send email reminder
        }
        break;
      }

      // ============================================
      // TRANSACTION COMPLETED (Payment success)
      // ============================================
      case 'transaction.completed': {
        const data = event.data;
        console.log(`💰 Payment completed: ${data.id}`);
        
        // Reset monthly download count on successful payment
        if (data.subscription_id) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('paddle_subscription_id', data.subscription_id)
            .single();

          if (profile) {
            await supabase
              .from('user_profiles')
              .update({
                downloads_this_month: 0,
                subscription_status: 'active',
              })
              .eq('id', profile.id);
          }
        }
        break;
      }

      // ============================================
      // TRANSACTION FAILED
      // ============================================
      case 'transaction.payment_failed': {
        const data = event.data;
        console.log(`❌ Payment failed: ${data.id}`);
        // TODO: Send email notification
        break;
      }

      default:
        console.log(`Unhandled event: ${event.event_type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Paddle webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
