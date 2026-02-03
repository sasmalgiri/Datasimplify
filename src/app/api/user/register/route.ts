import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/security/apiRateLimit';
import { isValidEmail, sanitizeEmail, detectBotBehavior, checkHoneypot } from '@/lib/security/validation';
import { verifyTurnstileToken } from '@/lib/security/turnstileServer';
import { logSecurityEvent, checkSuspiciousActivity } from '@/lib/security/auditLog';

const FREE_DOWNLOAD_LIMIT = 5;

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';

  try {
    // Log registration attempt
    await logSecurityEvent({
      event_type: 'registration_attempt',
      ip_address: clientIp,
      user_agent: userAgent,
      severity: 'low',
    });

    // Rate limiting by IP
    const rateLimit = checkRateLimit(clientIp, 'register');

    if (!rateLimit.allowed) {
      await logSecurityEvent({
        event_type: 'rate_limit_exceeded',
        ip_address: clientIp,
        user_agent: userAgent,
        severity: 'medium',
        details: { endpoint: 'register', resetIn: rateLimit.resetIn },
      });

      return NextResponse.json(
        {
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: Math.ceil(rateLimit.resetIn / 1000),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetIn),
        }
      );
    }

    // Check for suspicious activity patterns
    const suspiciousCheck = await checkSuspiciousActivity(clientIp);
    if (suspiciousCheck.suspicious) {
      await logSecurityEvent({
        event_type: 'suspicious_activity',
        ip_address: clientIp,
        user_agent: userAgent,
        severity: 'high',
        details: { reason: suspiciousCheck.reason },
      });

      // Don't reveal the block, just slow down the response
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Bot detection
    const botCheck = detectBotBehavior(request);
    if (botCheck.isBot) {
      await logSecurityEvent({
        event_type: 'bot_detected',
        ip_address: clientIp,
        user_agent: userAgent,
        severity: 'medium',
        details: { reason: botCheck.reason },
      });

      // Return fake success to not reveal detection
      return NextResponse.json({
        success: true,
        userId: 'temp-' + Date.now(),
        email: 'registered@example.com',
        downloadsRemaining: FREE_DOWNLOAD_LIMIT,
        isNew: true,
      });
    }

    const body = await request.json();
    const { email, website_url, turnstileToken } = body;

    // Honeypot check (website_url should be empty - bots often fill all fields)
    if (checkHoneypot(website_url)) {
      await logSecurityEvent({
        event_type: 'bot_detected',
        ip_address: clientIp,
        user_agent: userAgent,
        severity: 'medium',
        details: { reason: 'honeypot_triggered' },
      });

      return NextResponse.json({
        success: true,
        userId: 'temp-' + Date.now(),
        email: sanitizeEmail(email),
        downloadsRemaining: FREE_DOWNLOAD_LIMIT,
        isNew: true,
      });
    }

    // Verify Turnstile CAPTCHA (if configured)
    if (turnstileToken) {
      const captchaResult = await verifyTurnstileToken(turnstileToken, clientIp);
      if (!captchaResult.success) {
        await logSecurityEvent({
          event_type: 'captcha_failed',
          ip_address: clientIp,
          user_agent: userAgent,
          email: email,
          severity: 'medium',
          details: { error: captchaResult.error },
        });

        return NextResponse.json(
          { error: captchaResult.error || 'CAPTCHA verification failed' },
          { status: 400, headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetIn) }
        );
      }

      await logSecurityEvent({
        event_type: 'captcha_success',
        ip_address: clientIp,
        email: email,
        severity: 'low',
      });
    }

    // Validate email format (more robust than just @)
    if (!isValidEmail(email)) {
      await logSecurityEvent({
        event_type: 'registration_blocked',
        ip_address: clientIp,
        user_agent: userAgent,
        email: email,
        severity: 'low',
        details: { reason: 'invalid_email' },
      });

      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400, headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetIn) }
      );
    }

    const sanitizedEmail = sanitizeEmail(email);

    // Supabase is required for truthful user tracking
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'User registration requires Supabase to be configured.',
          requiresSupabase: true,
        },
        { status: 503 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('free_users')
      .select('*')
      .eq('email', sanitizedEmail)
      .single();

    if (existingUser) {
      // User exists, return their data
      // Check for month reset
      const lastDownload = existingUser.last_download_at ? new Date(existingUser.last_download_at) : null;
      const now = new Date();
      const isNewMonth = lastDownload &&
        (lastDownload.getMonth() !== now.getMonth() || lastDownload.getFullYear() !== now.getFullYear());

      const downloadsThisMonth = isNewMonth ? 0 : (existingUser.downloads_this_month || 0);
      const downloadsRemaining = Math.max(0, FREE_DOWNLOAD_LIMIT - downloadsThisMonth);

      return NextResponse.json({
        success: true,
        userId: existingUser.id,
        email: existingUser.email,
        downloadsRemaining,
        downloadsThisMonth,
        isExisting: true,
      }, {
        headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetIn),
      });
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('free_users')
      .insert({
        email: sanitizedEmail,
        downloads_this_month: 0,
        total_downloads: 0,
        created_at: new Date().toISOString(),
        last_download_at: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Register] Error creating user:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create user.' },
        { status: 500 }
      );
    }

    // Log successful registration
    await logSecurityEvent({
      event_type: 'registration_success',
      ip_address: clientIp,
      user_agent: userAgent,
      email: sanitizedEmail,
      user_id: newUser.id,
      severity: 'low',
      details: { isNew: true },
    });

    console.log(`[Register] New user registered: ${sanitizedEmail} from ${clientIp}`);

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      email: newUser.email,
      downloadsRemaining: FREE_DOWNLOAD_LIMIT,
      downloadsThisMonth: 0,
      isNew: true,
    }, {
      headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetIn),
    });

  } catch (error) {
    console.error('[Register] Error:', error);

    await logSecurityEvent({
      event_type: 'registration_blocked',
      ip_address: clientIp,
      user_agent: userAgent,
      severity: 'low',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
