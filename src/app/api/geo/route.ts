import { NextRequest, NextResponse } from 'next/server';

/**
 * Country → currency mapping with approximate USD exchange rates.
 * Rates are for display only — actual checkout uses FastSpring's live rates.
 */
const COUNTRY_CURRENCY: Record<string, { currency: string; symbol: string; rate: number }> = {
  // Americas
  US: { currency: 'USD', symbol: '$', rate: 1 },
  CA: { currency: 'CAD', symbol: 'CA$', rate: 1.36 },
  MX: { currency: 'MXN', symbol: 'MX$', rate: 17.2 },
  BR: { currency: 'BRL', symbol: 'R$', rate: 4.97 },
  AR: { currency: 'ARS', symbol: 'ARS', rate: 870 },
  CL: { currency: 'CLP', symbol: 'CL$', rate: 940 },
  CO: { currency: 'COP', symbol: 'COL$', rate: 3950 },

  // Europe
  GB: { currency: 'GBP', symbol: '£', rate: 0.79 },
  DE: { currency: 'EUR', symbol: '€', rate: 0.92 },
  FR: { currency: 'EUR', symbol: '€', rate: 0.92 },
  IT: { currency: 'EUR', symbol: '€', rate: 0.92 },
  ES: { currency: 'EUR', symbol: '€', rate: 0.92 },
  NL: { currency: 'EUR', symbol: '€', rate: 0.92 },
  BE: { currency: 'EUR', symbol: '€', rate: 0.92 },
  AT: { currency: 'EUR', symbol: '€', rate: 0.92 },
  PT: { currency: 'EUR', symbol: '€', rate: 0.92 },
  IE: { currency: 'EUR', symbol: '€', rate: 0.92 },
  FI: { currency: 'EUR', symbol: '€', rate: 0.92 },
  GR: { currency: 'EUR', symbol: '€', rate: 0.92 },
  CH: { currency: 'CHF', symbol: 'CHF', rate: 0.88 },
  SE: { currency: 'SEK', symbol: 'kr', rate: 10.5 },
  NO: { currency: 'NOK', symbol: 'kr', rate: 10.6 },
  DK: { currency: 'DKK', symbol: 'kr', rate: 6.88 },
  PL: { currency: 'PLN', symbol: 'zł', rate: 4.02 },
  CZ: { currency: 'CZK', symbol: 'Kč', rate: 23.1 },
  RO: { currency: 'RON', symbol: 'lei', rate: 4.6 },
  HU: { currency: 'HUF', symbol: 'Ft', rate: 365 },
  UA: { currency: 'UAH', symbol: '₴', rate: 41.2 },
  RU: { currency: 'RUB', symbol: '₽', rate: 92 },
  TR: { currency: 'TRY', symbol: '₺', rate: 32.5 },

  // Asia
  IN: { currency: 'INR', symbol: '₹', rate: 83.4 },
  JP: { currency: 'JPY', symbol: '¥', rate: 150 },
  CN: { currency: 'CNY', symbol: '¥', rate: 7.25 },
  KR: { currency: 'KRW', symbol: '₩', rate: 1330 },
  SG: { currency: 'SGD', symbol: 'S$', rate: 1.34 },
  HK: { currency: 'HKD', symbol: 'HK$', rate: 7.82 },
  TW: { currency: 'TWD', symbol: 'NT$', rate: 31.5 },
  TH: { currency: 'THB', symbol: '฿', rate: 35.5 },
  MY: { currency: 'MYR', symbol: 'RM', rate: 4.72 },
  ID: { currency: 'IDR', symbol: 'Rp', rate: 15700 },
  PH: { currency: 'PHP', symbol: '₱', rate: 56 },
  VN: { currency: 'VND', symbol: '₫', rate: 24500 },
  PK: { currency: 'PKR', symbol: '₨', rate: 280 },
  BD: { currency: 'BDT', symbol: '৳', rate: 110 },
  LK: { currency: 'LKR', symbol: 'Rs', rate: 310 },
  NP: { currency: 'NPR', symbol: 'रू', rate: 133 },

  // Middle East
  AE: { currency: 'AED', symbol: 'د.إ', rate: 3.67 },
  SA: { currency: 'SAR', symbol: 'ر.س', rate: 3.75 },
  IL: { currency: 'ILS', symbol: '₪', rate: 3.72 },
  QA: { currency: 'QAR', symbol: 'ر.ق', rate: 3.64 },
  KW: { currency: 'KWD', symbol: 'د.ك', rate: 0.31 },
  BH: { currency: 'BHD', symbol: 'BD', rate: 0.376 },

  // Africa
  ZA: { currency: 'ZAR', symbol: 'R', rate: 18.6 },
  NG: { currency: 'NGN', symbol: '₦', rate: 1550 },
  EG: { currency: 'EGP', symbol: 'E£', rate: 48.5 },
  KE: { currency: 'KES', symbol: 'KSh', rate: 153 },

  // Oceania
  AU: { currency: 'AUD', symbol: 'A$', rate: 1.53 },
  NZ: { currency: 'NZD', symbol: 'NZ$', rate: 1.65 },
};

const DEFAULT = { currency: 'USD', symbol: '$', rate: 1, country: 'US' };

export async function GET(req: NextRequest) {
  // Vercel provides geolocation headers automatically
  const country = req.headers.get('x-vercel-ip-country') || 'US';
  const info = COUNTRY_CURRENCY[country] || DEFAULT;

  return NextResponse.json({
    country,
    currency: info.currency,
    symbol: info.symbol,
    rate: info.rate,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
