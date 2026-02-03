/**
 * Template Download API Route
 *
 * Generates and returns Excel templates with CryptoSheets formulas.
 * No data redistribution - templates contain formulas only.
 *
 * Security features:
 * - IP-based rate limiting (10 downloads/15min per IP)
 * - Email-based download limits (5/month per email)
 * - Input validation and sanitization
 * - Bot detection
 */

import { NextResponse } from 'next/server';
import {
  generateTemplate,
  validateUserConfig,
  type UserTemplateConfig,
  type ContentType,
} from '@/lib/templates/generator';
import type { TemplateType } from '@/lib/templates/templateConfig';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/security/apiRateLimit';
import { isValidEmail, sanitizeEmail, validateCoinSymbols, detectBotBehavior } from '@/lib/security/validation';

const FREE_DOWNLOAD_LIMIT = 5;

// Check download limits for a user
async function checkDownloadLimit(email: string): Promise<{ allowed: boolean; remaining: number; error?: string }> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    // If Supabase not configured, allow downloads but warn
    console.warn('[Templates] Supabase not configured - download limits not enforced');
    return { allowed: true, remaining: FREE_DOWNLOAD_LIMIT };
  }

  const { data: user } = await supabaseAdmin
    .from('free_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (!user) {
    return { allowed: false, remaining: 0, error: 'User not found. Please register first.' };
  }

  // Check if month reset needed
  const lastDownload = user.last_download_at ? new Date(user.last_download_at) : null;
  const now = new Date();
  const isNewMonth = lastDownload &&
    (lastDownload.getMonth() !== now.getMonth() || lastDownload.getFullYear() !== now.getFullYear());

  const downloadsThisMonth = isNewMonth ? 0 : (user.downloads_this_month || 0);
  const remaining = Math.max(0, FREE_DOWNLOAD_LIMIT - downloadsThisMonth);

  if (downloadsThisMonth >= FREE_DOWNLOAD_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      error: `Monthly download limit reached (${FREE_DOWNLOAD_LIMIT}/month). Upgrade for more downloads.`
    };
  }

  return { allowed: true, remaining };
}

// Track a successful download
async function trackDownload(email: string, templateType: string, fileName: string): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) return;

  const now = new Date();

  // Get current user data
  const { data: user } = await supabaseAdmin
    .from('free_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (!user) return;

  // Check for month reset
  const lastDownload = user.last_download_at ? new Date(user.last_download_at) : null;
  const isNewMonth = lastDownload &&
    (lastDownload.getMonth() !== now.getMonth() || lastDownload.getFullYear() !== now.getFullYear());

  const currentMonthDownloads = isNewMonth ? 0 : (user.downloads_this_month || 0);

  // Update download count
  await supabaseAdmin
    .from('free_users')
    .update({
      downloads_this_month: currentMonthDownloads + 1,
      total_downloads: (user.total_downloads || 0) + 1,
      last_download_at: now.toISOString(),
    })
    .eq('email', email.toLowerCase());

  // Log the download
  try {
    await supabaseAdmin.from('download_logs').insert({
      user_email: email.toLowerCase(),
      download_type: templateType,
      file_name: fileName,
      downloaded_at: now.toISOString(),
    });
  } catch (logError) {
    console.error('[Templates] Error logging download:', logError);
  }
}

export async function POST(request: Request) {
  // Get client IP for rate limiting and logging
  const clientIp = getClientIp(request);

  try {
    // 1. IP-based rate limiting (defense against abuse)
    const rateLimit = checkRateLimit(clientIp, 'download');
    if (!rateLimit.allowed) {
      console.warn(`[Templates] Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        {
          error: 'Too many download requests. Please try again later.',
          retryAfter: Math.ceil(rateLimit.resetIn / 1000),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetIn),
        }
      );
    }

    // 2. Bot detection (log only, don't block - too many false positives)
    const botCheck = detectBotBehavior(request);
    if (botCheck.isBot) {
      console.warn(`[Templates] Possible bot from ${clientIp}: ${botCheck.reason} - allowing anyway`);
      // Don't block - just log for monitoring
    }

    // Parse request body
    const body = await request.json();

    // 3. Validate email (robust validation, not just @)
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { error: 'Email is required for downloads', message: 'Please provide a valid email address.' },
        { status: 400, headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetIn) }
      );
    }

    const email = sanitizeEmail(body.email);

    // 4. Check email-based download limit
    const limitCheck = await checkDownloadLimit(email);
    if (!limitCheck.allowed) {
      console.log(`[Templates] Download limit reached for ${email}`);
      return NextResponse.json(
        {
          error: 'Download limit reached',
          message: limitCheck.error,
          downloadsRemaining: 0,
          upgradeRequired: true
        },
        { status: 403, headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetIn) }
      );
    }

    // 5. Validate and sanitize inputs
    const validContentTypes: ContentType[] = ['formulas_only', 'addin', 'native_charts'];
    const contentType: ContentType = validContentTypes.includes(body.contentType)
      ? body.contentType
      : 'addin';

    // Sanitize coin symbols (alphanumeric only, max 100)
    const sanitizedCoins = validateCoinSymbols(body.coins);

    // Validate timeframe
    const validTimeframes = ['1h', '4h', '24h', '1d', '7d', '30d', '1m', '3m', '1y'];
    const timeframe = validTimeframes.includes(body.timeframe) ? body.timeframe : '24h';

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'BTC', 'ETH'];
    const currency = validCurrencies.includes(body.currency?.toUpperCase()) ? body.currency.toUpperCase() : 'USD';

    // Map kit template names to valid TemplateTypes
    const TEMPLATE_TYPE_MAP: Record<string, string> = {
      // Portfolio Starter Kit templates
      'holdings': 'portfolio_tracker',
      'prices': 'watchlist',
      'allocation': 'portfolio_tracker',
      'performance': 'portfolio_tracker',
      'settings': 'watchlist',
      // Market Overview templates
      'global': 'market_overview',
      'top_coins': 'screener',
      'trending': 'gainers_losers',
      'fear_greed': 'fear_greed_index',
      // Trader Chart templates
      'candles': 'ohlcv_history',
      'indicators': 'technical_indicators',
      'signals': 'technical_indicators',
      // Screener templates
      'screener': 'screener',
      'watchlist': 'watchlist',
      // Coin Research templates
      'snapshot': 'compare',
      'fundamentals': 'compare',
      'history': 'ohlcv_history',
      'comparison': 'compare',
      // Correlation templates
      'matrix': 'correlation_matrix',
      'trend': 'ohlcv_history',
      // DeFi templates
      'protocols_list': 'defi_protocols',
      'tvl_trend': 'defi_protocols',
      'top_chains': 'defi_protocols',
      // Stablecoin templates
      'marketcap': 'market_overview',
      'dominance': 'market_overview',
    };

    const mappedTemplateType = TEMPLATE_TYPE_MAP[body.templateType] || body.templateType || 'screener';

    // Build user configuration with sanitized inputs
    const userConfig: UserTemplateConfig = {
      templateType: (mappedTemplateType as TemplateType) || 'screener',
      coins: sanitizedCoins,
      timeframe,
      currency,
      contentType,
      formulaMode: 'crk', // BYOK: Use CRK formulas by default (not CryptoSheets)
      customizations: {
        // For formulas_only, override includeCharts to false
        includeCharts: contentType === 'formulas_only' ? false : body.customizations?.includeCharts !== false,
        metricsList: Array.isArray(body.customizations?.metricsList)
          ? body.customizations.metricsList.filter((m: unknown): m is string => typeof m === 'string').slice(0, 50)
          : [],
        ...body.customizations,
      },
    };

    // Validate configuration
    const validation = validateUserConfig(userConfig);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid configuration',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Determine format (.xlsx or .xlsm)
    const format = body.format === 'xlsm' ? 'xlsm' : 'xlsx';

    // Generate template
    console.log('[Templates] Generating template:', {
      type: userConfig.templateType,
      contentType: userConfig.contentType,
      coins: userConfig.coins.length,
      format,
      email,
      ip: clientIp,
    });

    const buffer = await generateTemplate(userConfig, format);

    // Generate filename with content type label
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const contentLabel = contentType === 'formulas_only' ? '_formulas' :
                        contentType === 'addin' ? '_interactive' : '_native';
    const filename = `cryptoreportkit_${userConfig.templateType}${contentLabel}_${timestamp}.${format}`;

    // Track the successful download
    await trackDownload(email, userConfig.templateType, filename);

    // Return file (convert Buffer to Uint8Array for NextResponse compatibility)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          format === 'xlsm'
            ? 'application/vnd.ms-excel.sheet.macroEnabled.12'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Template-Type': userConfig.templateType,
        'X-Template-Format': format,
        'X-Downloads-Remaining': String(Math.max(0, limitCheck.remaining - 1)),
      },
    });
  } catch (error) {
    console.error('[Templates] Generation error:', error);
    console.error('[Templates] Error stack:', error instanceof Error ? error.stack : 'No stack');

    return NextResponse.json(
      {
        error: 'Failed to generate template',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - returns available templates list
 */
export async function GET() {
  const { getTemplateList } = await import('@/lib/templates/templateConfig');

  try {
    const templates = getTemplateList();

    return NextResponse.json({
      success: true,
      templates,
      info: {
        requiresAddons: ['CryptoSheets'],
        supportedFormats: ['xlsx', 'xlsm'],
        supportedContentTypes: [
          { id: 'addin', name: 'Interactive Charts', description: 'Animated ChartJS charts via Office.js Add-in (requires M365)' },
          { id: 'native_charts', name: 'Native Excel Charts', description: 'Chart-ready data layout with instructions (works everywhere)' },
          { id: 'formulas_only', name: 'Formulas Only', description: 'Just CryptoSheets formulas, no charts' },
        ],
        dataIncluded: false,
        formulasOnly: true,
      },
    });
  } catch (error) {
    console.error('[Templates] List error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch template list',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
