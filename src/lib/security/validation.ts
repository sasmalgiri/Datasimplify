/**
 * Security Validation Utilities
 *
 * Input validation and sanitization for API endpoints.
 */

/**
 * Validate email address format (RFC 5322 compliant)
 * More robust than just checking for @
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  // Trim and lowercase
  const normalized = email.trim().toLowerCase();

  // Basic length checks
  if (normalized.length < 5 || normalized.length > 254) return false;

  // RFC 5322 compliant regex (simplified but effective)
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  if (!emailRegex.test(normalized)) return false;

  // Check for common disposable email domains (optional - can expand this list)
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', 'mailinator.com', 'guerrillamail.com',
    'temp-mail.org', '10minutemail.com', 'fakeinbox.com', 'maildrop.cc',
    'yopmail.com', 'getnada.com', 'sharklasers.com', 'trashmail.com',
  ];

  const domain = normalized.split('@')[1];
  if (disposableDomains.includes(domain)) {
    return false; // Optionally return false for disposable emails
  }

  return true;
}

/**
 * Sanitize email for storage (trim, lowercase)
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase().slice(0, 254);
}

/**
 * Validate string input (prevent injection attacks)
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Escape HTML entities for XSS prevention
    .replace(/[<>&"']/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;',
      };
      return entities[char] || char;
    });
}

/**
 * Validate array of coin symbols
 */
export function validateCoinSymbols(coins: unknown): string[] {
  if (!Array.isArray(coins)) return [];

  return coins
    .filter((coin): coin is string => typeof coin === 'string')
    .map(coin => coin.toUpperCase().trim().slice(0, 20))
    .filter(coin => /^[A-Z0-9-]+$/.test(coin)) // Only alphanumeric and hyphens
    .slice(0, 100); // Max 100 coins
}

/**
 * Validate template type
 */
export function validateTemplateType(type: unknown): string | null {
  if (!type || typeof type !== 'string') return null;

  const validTypes = [
    'screener', 'portfolio', 'technical', 'fundamental', 'market_overview',
    'correlation', 'watchlist', 'alerts', 'gainers_losers', 'fear_greed',
    'defi', 'comparison', 'custom',
  ];

  const normalized = type.trim().toLowerCase();
  return validTypes.includes(normalized) ? normalized : null;
}

/**
 * Check for suspicious patterns that might indicate bot activity
 */
export function detectBotBehavior(request: Request): { isBot: boolean; reason?: string } {
  const headers = new Headers(request.headers);

  // Check for missing or suspicious user agent
  const userAgent = headers.get('user-agent') || '';
  if (!userAgent || userAgent.length < 10) {
    return { isBot: true, reason: 'Missing or invalid user agent' };
  }

  // Check for known bot patterns
  const botPatterns = [
    /curl/i, /wget/i, /python-requests/i, /scrapy/i, /bot/i,
    /spider/i, /crawler/i, /headless/i, /phantom/i, /selenium/i,
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return { isBot: true, reason: 'Bot user agent detected' };
    }
  }

  // Check for missing common browser headers
  const acceptLanguage = headers.get('accept-language');
  const accept = headers.get('accept');

  if (!acceptLanguage && !accept) {
    return { isBot: true, reason: 'Missing browser headers' };
  }

  return { isBot: false };
}

/**
 * Generate a simple honeypot field name (for form spam detection)
 */
export function getHoneypotFieldName(): string {
  // Use a legitimate-looking but unused field name
  return 'website_url';
}

/**
 * Check if honeypot field was filled (indicates bot)
 */
export function checkHoneypot(value: unknown): boolean {
  // If honeypot field has value, it's likely a bot
  return value !== undefined && value !== null && value !== '';
}
