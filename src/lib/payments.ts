// ============================================
// PAYMENT SERVICE - PADDLE ONLY
// Paddle is Merchant of Record (handles all taxes)
// ============================================

// Paddle Configuration
export const PADDLE_CONFIG = {
  vendorId: process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID || '',
  environment: process.env.PADDLE_SANDBOX === 'true' ? 'sandbox' : 'production',

  // Price IDs from Paddle Dashboard
  // Tiers: Free ($0, no Paddle), Pro ($29), Premium ($79)
  prices: {
    pro: process.env.PADDLE_PRO_PRICE_ID || '',
    premium: process.env.PADDLE_PREMIUM_PRICE_ID || '',
  },

  // Display prices (Paddle handles actual pricing + taxes)
  displayPrices: {
    free: { amount: 0, currency: 'USD' },
    pro: { amount: 29, currency: 'USD' },
    premium: { amount: 79, currency: 'USD' },
  },
};

// Countries where service is blocked (no payment option available yet)
export const BLOCKED_COUNTRIES = ['IN']; // India - coming soon

// Tier features
// Note: Templates contain CryptoSheets formulas - data comes from user's CryptoSheets license
export const TIER_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    downloads: 5,
    features: [
      '5 template downloads per month',
      'Excel templates with CryptoSheets formulas',
      'Basic chart templates',
      'Community support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 29,
    downloads: 100,
    features: [
      '100 template downloads per month',
      'All template categories',
      'Custom column selection',
      'Email support',
    ],
  },
  premium: {
    name: 'Premium',
    price: 79,
    downloads: 999999, // Unlimited
    features: [
      'Unlimited template downloads',
      'All Pro features',
      'White-label templates (no branding)',
      'Custom integrations (by request)',
      'Priority support',
    ],
  },
};

// Map Paddle Price ID to tier info
export function paddlePriceToTier(priceId: string): { tier: string; limit: number } | null {
  const { prices } = PADDLE_CONFIG;

  if (priceId === prices.pro) {
    return { tier: 'pro', limit: 100 };
  }
  if (priceId === prices.premium) {
    return { tier: 'premium', limit: 999999 };
  }
  return null;
}

// Check if country is blocked
export function isCountryBlocked(countryCode: string): boolean {
  return BLOCKED_COUNTRIES.includes(countryCode?.toUpperCase());
}

// Get tier by name
export function getTierInfo(tierName: string) {
  return TIER_FEATURES[tierName as keyof typeof TIER_FEATURES] || TIER_FEATURES.free;
}
