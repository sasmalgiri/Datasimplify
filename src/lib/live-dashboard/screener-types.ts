export interface ScreenerCondition {
  id: string;
  field: 'price_change_24h' | 'price_change_7d' | 'market_cap' | 'total_volume' | 'current_price' | 'market_cap_rank';
  operator: 'gt' | 'lt' | 'between';
  value: number;
  value2?: number; // for 'between'
}

export interface ScreenerPreset {
  id: string;
  name: string;
  conditions: ScreenerCondition[];
  createdAt: number;
}

export const SCREENER_FIELDS = [
  { value: 'price_change_24h', label: '24h Change %', suffix: '%' },
  { value: 'price_change_7d', label: '7d Change %', suffix: '%' },
  { value: 'market_cap', label: 'Market Cap', suffix: '' },
  { value: 'total_volume', label: '24h Volume', suffix: '' },
  { value: 'current_price', label: 'Price', suffix: '' },
  { value: 'market_cap_rank', label: 'Rank', suffix: '' },
] as const;

export const SCREENER_OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'between', label: 'Between' },
] as const;

// Built-in presets
export const DEFAULT_PRESETS: ScreenerPreset[] = [
  {
    id: 'momentum',
    name: 'Momentum Play',
    conditions: [
      { id: '1', field: 'price_change_24h', operator: 'gt', value: 5 },
      { id: '2', field: 'total_volume', operator: 'gt', value: 50000000 },
    ],
    createdAt: 0,
  },
  {
    id: 'undervalued',
    name: 'Undervalued Gems',
    conditions: [
      { id: '1', field: 'market_cap_rank', operator: 'lt', value: 100 },
      { id: '2', field: 'price_change_7d', operator: 'lt', value: -10 },
    ],
    createdAt: 0,
  },
  {
    id: 'whale-watch',
    name: 'Whale Watch',
    conditions: [
      { id: '1', field: 'total_volume', operator: 'gt', value: 1000000000 },
      { id: '2', field: 'market_cap', operator: 'gt', value: 10000000000 },
    ],
    createdAt: 0,
  },
];

/** Map screener field names to CoinGecko market data property keys */
const FIELD_MAP: Record<ScreenerCondition['field'], string> = {
  price_change_24h: 'price_change_percentage_24h',
  price_change_7d: 'price_change_percentage_7d_in_currency',
  market_cap: 'market_cap',
  total_volume: 'total_volume',
  current_price: 'current_price',
  market_cap_rank: 'market_cap_rank',
};

/** Filter markets array by ALL conditions (AND logic) */
export function applyScreenerConditions(markets: any[], conditions: ScreenerCondition[]): any[] {
  if (!conditions.length) return markets;

  return markets.filter((coin) => {
    return conditions.every((condition) => {
      const key = FIELD_MAP[condition.field];
      const val = coin[key];

      // Skip coin if the field value is null or undefined
      if (val == null) return false;

      switch (condition.operator) {
        case 'gt':
          return val > condition.value;
        case 'lt':
          return val < condition.value;
        case 'between':
          if (condition.value2 == null) return val > condition.value;
          return val >= condition.value && val <= condition.value2;
        default:
          return true;
      }
    });
  });
}
