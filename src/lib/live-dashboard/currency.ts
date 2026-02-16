// Currency symbols and metadata for multi-currency support
// CoinGecko supports 60+ vs_currencies

export const CURRENCY_SYMBOLS: Record<string, string> = {
  // Major fiat
  usd: '$', eur: '€', gbp: '£', jpy: '¥', cny: '¥',
  krw: '₩', inr: '₹', rub: '₽', try: '₺', brl: 'R$',
  aud: 'A$', cad: 'C$', chf: 'CHF ', hkd: 'HK$', sgd: 'S$',
  twd: 'NT$', nzd: 'NZ$', mxn: 'MX$', zar: 'R',
  // European
  sek: 'kr', nok: 'kr', dkk: 'kr', pln: 'zł', czk: 'Kč',
  huf: 'Ft', ron: 'lei', bgn: 'лв', hrk: 'kn', isk: 'kr',
  // Asian
  idr: 'Rp', php: '₱', thb: '฿', myr: 'RM', vnd: '₫',
  pkr: '₨', bdt: '৳', lkr: 'Rs', mmk: 'K',
  // Middle East / Africa
  aed: 'د.إ', sar: '﷼', ils: '₪', ngn: '₦', egp: 'E£',
  kwd: 'د.ك', bhd: 'BD', qar: 'QR',
  // Americas
  ars: 'ARS$', clp: 'CLP$', cop: 'COL$', pen: 'S/',
  // Crypto
  btc: '₿', eth: 'Ξ', bnb: 'BNB ', xrp: 'XRP ', sol: 'SOL ',
  dot: 'DOT ', ltc: 'Ł', link: 'LINK ', xlm: 'XLM ',
  sats: 'sats ',
};

export interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
  group: 'popular' | 'fiat' | 'crypto';
}

export const ALL_CURRENCIES: CurrencyOption[] = [
  // Popular (shown first)
  { value: 'usd', label: 'US Dollar', symbol: '$', group: 'popular' },
  { value: 'eur', label: 'Euro', symbol: '€', group: 'popular' },
  { value: 'gbp', label: 'British Pound', symbol: '£', group: 'popular' },
  { value: 'jpy', label: 'Japanese Yen', symbol: '¥', group: 'popular' },
  { value: 'inr', label: 'Indian Rupee', symbol: '₹', group: 'popular' },
  { value: 'cny', label: 'Chinese Yuan', symbol: '¥', group: 'popular' },
  { value: 'krw', label: 'Korean Won', symbol: '₩', group: 'popular' },
  { value: 'btc', label: 'Bitcoin', symbol: '₿', group: 'popular' },
  { value: 'eth', label: 'Ethereum', symbol: 'Ξ', group: 'popular' },
  // Fiat A-Z
  { value: 'aed', label: 'UAE Dirham', symbol: 'د.إ', group: 'fiat' },
  { value: 'ars', label: 'Argentine Peso', symbol: 'ARS$', group: 'fiat' },
  { value: 'aud', label: 'Australian Dollar', symbol: 'A$', group: 'fiat' },
  { value: 'bdt', label: 'Bangladeshi Taka', symbol: '৳', group: 'fiat' },
  { value: 'bhd', label: 'Bahraini Dinar', symbol: 'BD', group: 'fiat' },
  { value: 'brl', label: 'Brazilian Real', symbol: 'R$', group: 'fiat' },
  { value: 'cad', label: 'Canadian Dollar', symbol: 'C$', group: 'fiat' },
  { value: 'chf', label: 'Swiss Franc', symbol: 'CHF', group: 'fiat' },
  { value: 'clp', label: 'Chilean Peso', symbol: 'CLP$', group: 'fiat' },
  { value: 'czk', label: 'Czech Koruna', symbol: 'Kč', group: 'fiat' },
  { value: 'dkk', label: 'Danish Krone', symbol: 'kr', group: 'fiat' },
  { value: 'egp', label: 'Egyptian Pound', symbol: 'E£', group: 'fiat' },
  { value: 'hkd', label: 'Hong Kong Dollar', symbol: 'HK$', group: 'fiat' },
  { value: 'huf', label: 'Hungarian Forint', symbol: 'Ft', group: 'fiat' },
  { value: 'idr', label: 'Indonesian Rupiah', symbol: 'Rp', group: 'fiat' },
  { value: 'ils', label: 'Israeli Shekel', symbol: '₪', group: 'fiat' },
  { value: 'kwd', label: 'Kuwaiti Dinar', symbol: 'د.ك', group: 'fiat' },
  { value: 'mxn', label: 'Mexican Peso', symbol: 'MX$', group: 'fiat' },
  { value: 'myr', label: 'Malaysian Ringgit', symbol: 'RM', group: 'fiat' },
  { value: 'ngn', label: 'Nigerian Naira', symbol: '₦', group: 'fiat' },
  { value: 'nok', label: 'Norwegian Krone', symbol: 'kr', group: 'fiat' },
  { value: 'nzd', label: 'New Zealand Dollar', symbol: 'NZ$', group: 'fiat' },
  { value: 'pen', label: 'Peruvian Sol', symbol: 'S/', group: 'fiat' },
  { value: 'php', label: 'Philippine Peso', symbol: '₱', group: 'fiat' },
  { value: 'pkr', label: 'Pakistani Rupee', symbol: '₨', group: 'fiat' },
  { value: 'pln', label: 'Polish Zloty', symbol: 'zł', group: 'fiat' },
  { value: 'qar', label: 'Qatari Riyal', symbol: 'QR', group: 'fiat' },
  { value: 'ron', label: 'Romanian Leu', symbol: 'lei', group: 'fiat' },
  { value: 'rub', label: 'Russian Ruble', symbol: '₽', group: 'fiat' },
  { value: 'sar', label: 'Saudi Riyal', symbol: '﷼', group: 'fiat' },
  { value: 'sek', label: 'Swedish Krona', symbol: 'kr', group: 'fiat' },
  { value: 'sgd', label: 'Singapore Dollar', symbol: 'S$', group: 'fiat' },
  { value: 'thb', label: 'Thai Baht', symbol: '฿', group: 'fiat' },
  { value: 'try', label: 'Turkish Lira', symbol: '₺', group: 'fiat' },
  { value: 'twd', label: 'Taiwan Dollar', symbol: 'NT$', group: 'fiat' },
  { value: 'vnd', label: 'Vietnamese Dong', symbol: '₫', group: 'fiat' },
  { value: 'zar', label: 'South African Rand', symbol: 'R', group: 'fiat' },
  // Crypto
  { value: 'bnb', label: 'BNB', symbol: 'BNB', group: 'crypto' },
  { value: 'dot', label: 'Polkadot', symbol: 'DOT', group: 'crypto' },
  { value: 'link', label: 'Chainlink', symbol: 'LINK', group: 'crypto' },
  { value: 'ltc', label: 'Litecoin', symbol: 'Ł', group: 'crypto' },
  { value: 'sats', label: 'Satoshis', symbol: 'sats', group: 'crypto' },
  { value: 'sol', label: 'Solana', symbol: 'SOL', group: 'crypto' },
  { value: 'xlm', label: 'Stellar', symbol: 'XLM', group: 'crypto' },
  { value: 'xrp', label: 'XRP', symbol: 'XRP', group: 'crypto' },
];

/** Get the symbol for a currency code. Falls back to uppercase code. */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency.toUpperCase() + ' ';
}

/** Check if a currency is a crypto denomination */
export function isCryptoCurrency(currency: string): boolean {
  return ['btc', 'eth', 'bnb', 'xrp', 'sol', 'dot', 'ltc', 'link', 'xlm', 'sats'].includes(currency);
}
