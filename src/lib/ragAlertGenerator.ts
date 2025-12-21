// ============================================
// RAG ALERT GENERATION FROM CHAT
// Parse user queries to create price alerts
// ============================================

import { supabase, isSupabaseConfigured } from './supabase';

export interface ParsedAlert {
  type: 'price_above' | 'price_below' | 'percent_change' | 'volume_spike';
  coin: string;
  coinId?: string;
  threshold: number;
  unit: 'usd' | 'percent';
  originalQuery: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AlertCreationResult {
  success: boolean;
  alert?: ParsedAlert;
  alertId?: string;
  message: string;
}

// Coin symbol to ID mapping
const COIN_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'BITCOIN': 'bitcoin',
  'ETH': 'ethereum',
  'ETHEREUM': 'ethereum',
  'SOL': 'solana',
  'SOLANA': 'solana',
  'XRP': 'ripple',
  'RIPPLE': 'ripple',
  'ADA': 'cardano',
  'CARDANO': 'cardano',
  'DOGE': 'dogecoin',
  'DOGECOIN': 'dogecoin',
  'DOT': 'polkadot',
  'POLKADOT': 'polkadot',
  'AVAX': 'avalanche',
  'AVALANCHE': 'avalanche',
  'MATIC': 'polygon',
  'POLYGON': 'polygon',
  'LINK': 'chainlink',
  'CHAINLINK': 'chainlink',
};

/**
 * Parse alert intent from user query
 */
export function parseAlertIntent(query: string): ParsedAlert | null {
  const q = query.toLowerCase();

  // Pattern: "alert me when BTC hits $100k"
  const priceHitPattern = /(?:alert|notify|tell)\s+(?:me\s+)?when\s+(\w+)\s+(?:hits?|reaches?|gets?\s+to)\s+\$?([\d,]+(?:\.\d+)?)\s*k?/i;

  // Pattern: "set alert for BTC above $100000"
  const priceAbovePattern = /(?:set\s+)?alert\s+(?:for\s+)?(\w+)\s+(?:above|over|exceeds?)\s+\$?([\d,]+(?:\.\d+)?)\s*k?/i;

  // Pattern: "alert when BTC drops below $90000"
  const priceBelowPattern = /(?:alert|notify)\s+(?:me\s+)?(?:when|if)\s+(\w+)\s+(?:drops?|falls?|goes?)\s+(?:below|under)\s+\$?([\d,]+(?:\.\d+)?)\s*k?/i;

  // Pattern: "notify me if ETH drops 10%"
  const percentDropPattern = /(?:alert|notify)\s+(?:me\s+)?(?:when|if)\s+(\w+)\s+(?:drops?|falls?|loses?)\s+(\d+(?:\.\d+)?)\s*%/i;

  // Pattern: "alert when BTC rises 5%"
  const percentRisePattern = /(?:alert|notify)\s+(?:me\s+)?(?:when|if)\s+(\w+)\s+(?:rises?|gains?|goes?\s+up)\s+(\d+(?:\.\d+)?)\s*%/i;

  let match: RegExpMatchArray | null;
  let alert: ParsedAlert | null = null;

  // Check price hit pattern
  match = query.match(priceHitPattern);
  if (match) {
    const coin = match[1].toUpperCase();
    let price = parseFloat(match[2].replace(/,/g, ''));
    if (q.includes('k') && price < 1000) price *= 1000;

    alert = {
      type: 'price_above',
      coin,
      coinId: COIN_MAP[coin],
      threshold: price,
      unit: 'usd',
      originalQuery: query,
      confidence: COIN_MAP[coin] ? 'high' : 'medium',
    };
  }

  // Check price above pattern
  if (!alert) {
    match = query.match(priceAbovePattern);
    if (match) {
      const coin = match[1].toUpperCase();
      let price = parseFloat(match[2].replace(/,/g, ''));
      if (q.includes('k') && price < 1000) price *= 1000;

      alert = {
        type: 'price_above',
        coin,
        coinId: COIN_MAP[coin],
        threshold: price,
        unit: 'usd',
        originalQuery: query,
        confidence: COIN_MAP[coin] ? 'high' : 'medium',
      };
    }
  }

  // Check price below pattern
  if (!alert) {
    match = query.match(priceBelowPattern);
    if (match) {
      const coin = match[1].toUpperCase();
      let price = parseFloat(match[2].replace(/,/g, ''));
      if (q.includes('k') && price < 1000) price *= 1000;

      alert = {
        type: 'price_below',
        coin,
        coinId: COIN_MAP[coin],
        threshold: price,
        unit: 'usd',
        originalQuery: query,
        confidence: COIN_MAP[coin] ? 'high' : 'medium',
      };
    }
  }

  // Check percent drop pattern
  if (!alert) {
    match = query.match(percentDropPattern);
    if (match) {
      const coin = match[1].toUpperCase();
      const percent = parseFloat(match[2]);

      alert = {
        type: 'percent_change',
        coin,
        coinId: COIN_MAP[coin],
        threshold: -percent, // Negative for drop
        unit: 'percent',
        originalQuery: query,
        confidence: COIN_MAP[coin] ? 'high' : 'medium',
      };
    }
  }

  // Check percent rise pattern
  if (!alert) {
    match = query.match(percentRisePattern);
    if (match) {
      const coin = match[1].toUpperCase();
      const percent = parseFloat(match[2]);

      alert = {
        type: 'percent_change',
        coin,
        coinId: COIN_MAP[coin],
        threshold: percent,
        unit: 'percent',
        originalQuery: query,
        confidence: COIN_MAP[coin] ? 'high' : 'medium',
      };
    }
  }

  return alert;
}

/**
 * Create alert in database
 */
export async function createAlertFromChat(
  parsedAlert: ParsedAlert,
  userId?: string
): Promise<AlertCreationResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      message: 'Database not configured. Alert cannot be saved.',
    };
  }

  if (!parsedAlert.coinId) {
    return {
      success: false,
      alert: parsedAlert,
      message: `I couldn't identify the coin "${parsedAlert.coin}". Please use a known coin symbol like BTC, ETH, SOL, etc.`,
    };
  }

  try {
    // Get current price for context
    const { data: marketData } = await supabase
      .from('market_data')
      .select('price')
      .eq('symbol', parsedAlert.coin)
      .single();

    const currentPrice = marketData?.price || 0;

    // Create alert
    const alertData = {
      user_id: userId || null,
      coin_id: parsedAlert.coinId,
      coin_symbol: parsedAlert.coin,
      alert_type: parsedAlert.type,
      threshold: parsedAlert.threshold,
      unit: parsedAlert.unit,
      current_price_at_creation: currentPrice,
      is_active: true,
      created_from: 'chat',
      original_query: parsedAlert.originalQuery,
    };

    const { data, error } = await supabase
      .from('price_alerts')
      .insert(alertData)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create alert:', error);
      return {
        success: false,
        alert: parsedAlert,
        message: 'Failed to save the alert. Please try again.',
      };
    }

    // Format success message
    let message = '';
    if (parsedAlert.type === 'price_above') {
      message = `Alert created! I'll notify you when ${parsedAlert.coin} goes above $${parsedAlert.threshold.toLocaleString()}. Current price: $${Number(currentPrice).toLocaleString()}.`;
    } else if (parsedAlert.type === 'price_below') {
      message = `Alert created! I'll notify you when ${parsedAlert.coin} drops below $${parsedAlert.threshold.toLocaleString()}. Current price: $${Number(currentPrice).toLocaleString()}.`;
    } else if (parsedAlert.type === 'percent_change') {
      const direction = parsedAlert.threshold > 0 ? 'rises' : 'drops';
      message = `Alert created! I'll notify you when ${parsedAlert.coin} ${direction} ${Math.abs(parsedAlert.threshold)}%.`;
    }

    return {
      success: true,
      alert: parsedAlert,
      alertId: data.id,
      message,
    };
  } catch (error) {
    console.error('Alert creation error:', error);
    return {
      success: false,
      alert: parsedAlert,
      message: 'An error occurred while creating the alert.',
    };
  }
}

/**
 * Check if query is an alert request
 */
export function isAlertRequest(query: string): boolean {
  const alertKeywords = [
    /\balert\s+me\b/i,
    /\bnotify\s+me\b/i,
    /\btell\s+me\s+when\b/i,
    /\bset\s+(?:an?\s+)?alert\b/i,
    /\bcreate\s+(?:an?\s+)?alert\b/i,
    /\bwatch\s+for\b/i,
  ];

  return alertKeywords.some(pattern => pattern.test(query));
}

/**
 * Format alert for chat response
 */
export function formatAlertResponse(result: AlertCreationResult): string {
  if (result.success) {
    return `✅ ${result.message}

You can view and manage your alerts in the Alerts page.`;
  }

  if (result.alert) {
    return `⚠️ ${result.message}

Detected intent:
- Coin: ${result.alert.coin}
- Type: ${result.alert.type.replace('_', ' ')}
- Threshold: ${result.alert.unit === 'usd' ? '$' : ''}${Math.abs(result.alert.threshold)}${result.alert.unit === 'percent' ? '%' : ''}

Please try rephrasing or use the Alerts page to create the alert manually.`;
  }

  return `❌ ${result.message}`;
}
