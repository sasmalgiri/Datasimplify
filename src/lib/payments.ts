// ============================================
// PAYMENT SERVICE - PADDLE ONLY
// Paddle is Merchant of Record (handles all taxes)
// ============================================

// Paddle Configuration
export const PADDLE_CONFIG = {
  vendorId: process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID || '',
  environment: process.env.PADDLE_SANDBOX === 'true' ? 'sandbox' : 'production',
  
  // Price IDs from Paddle Dashboard
  prices: {
    starter: process.env.PADDLE_STARTER_PRICE_ID || '',
    pro: process.env.PADDLE_PRO_PRICE_ID || '',
    business: process.env.PADDLE_BUSINESS_PRICE_ID || '',
  },
  
  // Display prices (Paddle handles actual pricing + taxes)
  displayPrices: {
    starter: { amount: 19, currency: 'USD' },
    pro: { amount: 49, currency: 'USD' },
    business: { amount: 99, currency: 'USD' },
  },
};

// Countries where service is blocked (no payment option available yet)
export const BLOCKED_COUNTRIES = ['IN']; // India - coming soon

// Tier features
export const TIER_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    downloads: 5,
    features: [
      '5 downloads per month',
      'Standard downloads (XLSX/CSV)',
      'Live downloads (IQY for Excel refresh)',
      'Community support',
    ],
  },
  starter: {
    name: 'Starter',
    price: 19,
    downloads: 50,
    features: [
      '50 downloads per month',
      'Standard + Live downloads',
      'Customizable exports (choose columns)',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 49,
    downloads: 999999, // Unlimited
    features: [
      'Unlimited downloads',
      'Standard + Live downloads',
      'Live chart exports to Excel (IQY)',
      'Faster refresh via authenticated endpoints',
      'Priority support',
    ],
  },
  business: {
    name: 'Business',
    price: 99,
    downloads: 999999, // Unlimited
    features: [
      'Everything in Pro',
      'API access (authenticated)',
      'Higher limits by request',
      'Priority onboarding (email)',
      'Priority support',
    ],
  },
};

// Map Paddle Price ID to tier info
export function paddlePriceToTier(priceId: string): { tier: string; limit: number } | null {
  const { prices } = PADDLE_CONFIG;
  
  if (priceId === prices.starter) {
    return { tier: 'starter', limit: 50 };
  }
  if (priceId === prices.pro) {
    return { tier: 'pro', limit: 999999 };
  }
  if (priceId === prices.business) {
    return { tier: 'business', limit: 999999 };
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
