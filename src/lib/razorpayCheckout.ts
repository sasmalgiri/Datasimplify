'use client';

/**
 * Client-side Razorpay subscription checkout.
 * Inert unless NEXT_PUBLIC_RAZORPAY_KEY_ID is set — callers fall back to their
 * existing flow when isRazorpayCheckoutEnabled() is false.
 */
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

export function isRazorpayCheckoutEnabled(): boolean {
  return Boolean(RAZORPAY_KEY);
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('No window'));
      return;
    }
    if (window.Razorpay) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(s);
  });
}

export async function startProCheckout(opts: {
  period: 'monthly' | 'yearly';
  email: string;
  onSuccess?: () => void;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/razorpay/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period: opts.period }),
    });
    const data = (await res.json()) as {
      subscriptionId?: string;
      keyId?: string;
      error?: string;
    };
    if (!res.ok || !data.subscriptionId) {
      return { ok: false, error: data.error || 'Could not start checkout.' };
    }

    await loadScript();
    if (!window.Razorpay) {
      return { ok: false, error: 'Checkout is unavailable right now.' };
    }

    const rzp = new window.Razorpay({
      key: data.keyId,
      subscription_id: data.subscriptionId,
      name: 'CryptoReportKit Pro',
      description: `Pro ${opts.period} subscription`,
      theme: { color: '#10b981' },
      prefill: { email: opts.email },
      handler: () => opts.onSuccess?.(),
    });
    rzp.open();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Checkout error' };
  }
}
