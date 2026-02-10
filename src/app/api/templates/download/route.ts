/**
 * Template Download API Route
 *
 * Generates Excel templates with LIVE DATA via Power Query.
 * Fetches real-time data from CoinGecko during generation,
 * and includes Power Query M code for auto-refresh.
 *
 * Security features:
 * - IP-based rate limiting (10 downloads/15min per IP)
 * - Email-based download limits (5/month per email)
 * - Input validation and sanitization
 * - Bot detection
 */

import { NextResponse } from 'next/server';
import {
  generateMasterExcel,
  type DashboardType,
} from '@/lib/excel/masterGenerator';
import type { ContentType } from '@/lib/templates/generator';
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
      : 'native_charts';

    // Sanitize coin symbols (alphanumeric only, max 100)
    const sanitizedCoins = validateCoinSymbols(body.coins);

    // Validate timeframe → days for master generator
    const TIMEFRAME_TO_DAYS: Record<string, number> = {
      '1h': 1, '4h': 1, '24h': 1, '1d': 1, '7d': 7, '30d': 30, '1m': 30, '3m': 90, '1y': 365,
    };
    const days = TIMEFRAME_TO_DAYS[body.timeframe] || 30;

    // Map coin symbols to CoinGecko IDs
    const SYMBOL_TO_ID: Record<string, string> = {
      'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'BNB': 'binancecoin',
      'XRP': 'ripple', 'ADA': 'cardano', 'DOGE': 'dogecoin', 'DOT': 'polkadot',
      'AVAX': 'avalanche-2', 'MATIC': 'matic-network', 'LINK': 'chainlink',
      'UNI': 'uniswap', 'ATOM': 'cosmos', 'LTC': 'litecoin', 'FIL': 'filecoin',
      'NEAR': 'near', 'APT': 'aptos', 'ARB': 'arbitrum', 'OP': 'optimism',
      'SUI': 'sui', 'SEI': 'sei-network', 'TIA': 'celestia', 'INJ': 'injective-protocol',
      'SHIB': 'shiba-inu', 'PEPE': 'pepe', 'TRX': 'tron', 'TON': 'the-open-network',
    };
    const coinIds = sanitizedCoins.map(s => SYMBOL_TO_ID[s.toUpperCase()] || s.toLowerCase());

    // Map template type → master generator dashboard type
    const TEMPLATE_TO_DASHBOARD: Record<string, DashboardType> = {
      // Direct mappings
      'screener': 'screener',
      'market_overview': 'market-overview',
      'gainers_losers': 'gainers-losers',
      'fear_greed': 'fear-greed',
      'defi_tvl': 'defi-dashboard',
      'defi_yields': 'defi-yields',
      'technical_indicators': 'technical-analysis',
      'ohlcv_history': 'technical-analysis',
      'portfolio_tracker': 'portfolio-tracker',
      'correlation_matrix': 'correlation',
      'risk_dashboard': 'correlation',
      'watchlist': 'custom',
      'compare': 'custom',
      'onchain_btc': 'bitcoin-dashboard',
      'eth_gas_tracker': 'ethereum-dashboard',
      'social_sentiment': 'social-sentiment',
      'funding_rates': 'funding-rates',
      'open_interest': 'derivatives',
      'token_unlocks': 'token-unlocks',
      'staking_rewards': 'staking-yields',
      'nft_collections': 'nft-tracker',
      'etf_tracker': 'etf-tracker',
      'whale_tracker': 'whale-tracker',
      'backtest_results': 'technical-analysis',
      'macro_indicators': 'market-overview',
      'exchange_flows': 'exchange-reserves',
      'mining_stats': 'mining-calc',
      'liquidations': 'liquidations',
      'alerts_summary': 'market-overview',
      // Kit sub-template mappings
      'holdings': 'portfolio-tracker',
      'prices': 'custom',
      'allocation': 'portfolio-tracker',
      'performance': 'portfolio-tracker',
      'global': 'market-overview',
      'top_coins': 'screener',
      'trending': 'trending',
      'dominance': 'market-overview',
      'heatmap': 'heatmap',
      'movers': 'gainers-losers',
      'sentiment': 'social-sentiment',
      'candles': 'technical-analysis',
      'indicators': 'technical-analysis',
      'signals': 'technical-analysis',
      'protocols_list': 'defi-dashboard',
      'tvl_trend': 'defi-dashboard',
      'top_chains': 'defi-dashboard',
      'stablecoin_table': 'stablecoins',
      'dominance_view': 'market-overview',
      'changes': 'gainers-losers',
      'marketcap': 'market-overview',
    };

    const dashboard: DashboardType = TEMPLATE_TO_DASHBOARD[body.templateType] || 'market-overview';

    // Map content type to output mode
    const includeCharts = contentType !== 'formulas_only' && body.customizations?.includeCharts !== false;

    // Map refresh frequency
    const refreshMap: Record<string, 'realtime' | 'frequent' | 'hourly' | 'daily' | 'manual'> = {
      'realtime': 'realtime', '5m': 'realtime',
      'frequent': 'frequent', '15m': 'frequent',
      'hourly': 'hourly', '1h': 'hourly',
      'daily': 'daily', '24h': 'daily',
      'manual': 'manual',
    };
    const refreshInterval = refreshMap[body.customizations?.refreshFrequency] || 'hourly';

    // Generate template using master generator (real data + Power Query)
    console.log('[Templates] Generating live template:', {
      dashboard,
      coins: coinIds.length,
      days,
      includeCharts,
      email,
      ip: clientIp,
    });

    const buffer = await generateMasterExcel({
      dashboard,
      coins: coinIds.length > 0 ? coinIds : undefined,
      limit: 100,
      days,
      includeCharts,
      outputMode: 'live',
      refreshInterval,
      chartStyle: 'professional',
    });

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `cryptoreportkit_${dashboard}_${timestamp}.xlsx`;

    // Track the successful download
    await trackDownload(email, dashboard, filename);

    // Return file
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Template-Type': dashboard,
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
        requiresAddons: [],
        supportedFormats: ['xlsx'],
        supportedContentTypes: [
          { id: 'native_charts', name: 'With Charts', description: 'Live data with Power Query + native Excel charts (recommended)' },
          { id: 'formulas_only', name: 'Data Only', description: 'Power Query data tables without charts' },
        ],
        dataIncluded: true,
        powerQuery: true,
        noAddinRequired: true,
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
