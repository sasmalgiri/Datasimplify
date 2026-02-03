/**
 * Server-side Turnstile verification
 * This file is server-only and should NOT have 'use client' directive
 */

/**
 * Verify Turnstile token on the server side
 * Call this from your API route
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If not configured, allow through (for development)
  if (!secretKey) {
    console.warn('Turnstile: TURNSTILE_SECRET_KEY not configured - skipping verification');
    return { success: true };
  }

  // If token indicates not configured, allow through
  if (token === 'not-configured') {
    return { success: true };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const result = await response.json();

    if (result.success) {
      return { success: true };
    } else {
      console.warn('Turnstile verification failed:', result['error-codes']);
      return {
        success: false,
        error: 'CAPTCHA verification failed. Please try again.',
      };
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return {
      success: false,
      error: 'Failed to verify CAPTCHA. Please try again.',
    };
  }
}
