'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Cloudflare Turnstile CAPTCHA Component
 *
 * Free, privacy-friendly CAPTCHA that doesn't require user interaction.
 * Get keys from: https://dash.cloudflare.com/?to=/:account/turnstile
 *
 * Environment variables needed:
 * - NEXT_PUBLIC_TURNSTILE_SITE_KEY (client-side)
 * - TURNSTILE_SECRET_KEY (server-side)
 */

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: (error: string) => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
}

export function Turnstile({
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = '',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !siteKey) return;

    // Remove existing widget if any
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore errors when removing
      }
    }

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setError(null);
          onVerify(token);
        },
        'error-callback': (err: string) => {
          setError('Verification failed. Please try again.');
          onError?.(err);
        },
        'expired-callback': () => {
          setError('Verification expired. Please verify again.');
          onExpire?.();
        },
        theme,
        size,
      });
    } catch (err) {
      console.error('Turnstile render error:', err);
      setError('Failed to load verification. Please refresh the page.');
    }
  }, [siteKey, theme, size, onVerify, onError, onExpire]);

  useEffect(() => {
    if (!siteKey) {
      console.warn('Turnstile: NEXT_PUBLIC_TURNSTILE_SITE_KEY not configured');
      // Allow form submission without CAPTCHA if not configured
      onVerify('not-configured');
      return;
    }

    // Check if script is already loaded
    if (window.turnstile) {
      setIsLoaded(true);
      renderWidget();
      return;
    }

    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;

    window.onTurnstileLoad = () => {
      setIsLoaded(true);
      renderWidget();
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [siteKey, renderWidget, onVerify]);

  // Re-render when loaded
  useEffect(() => {
    if (isLoaded) {
      renderWidget();
    }
  }, [isLoaded, renderWidget]);

  // If not configured, don't show anything
  if (!siteKey) {
    return null;
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="cf-turnstile" />
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}

/**
 * Verify Turnstile token on the server side
 * Call this from your API route
 */
export async function verifyTurnstileToken(token: string, ip?: string): Promise<{ success: boolean; error?: string }> {
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
