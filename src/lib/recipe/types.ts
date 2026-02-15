/**
 * Recipe Schema v1
 *
 * Canonical schema for defining Excel pack recipes.
 * Based on PRODUCT_ROADMAP.md Phase 2 specification.
 */

export type DatasetType =
  | 'price'
  | 'ohlcv'
  | 'ta'
  | 'defi_tvl'
  | 'funding'
  | 'news'
  | 'sentiment'
  | 'risk'
  | 'fear_greed'
  | 'macro'
  | 'onchain';

export type DataProvider =
  | 'coingecko'
  | 'defillama'
  | 'alternative'
  | 'etherscan'
  | 'reddit'
  | 'fred'
  | 'yahoo'
  | 'local'; // For computed metrics

export type DataMode = 'byok' | 'public' | 'computed';

export type ChartType =
  | 'line'
  | 'candlestick'
  | 'bar'
  | 'area'
  | 'pie'
  | 'scatter';

export type RecipeCategory =
  | 'market'
  | 'ta'
  | 'risk'
  | 'defi'
  | 'onchain'
  | 'derivatives'
  | 'sentiment'
  | 'macro'
  | 'portfolio';

export interface DatasetConfig {
  id: string; // Unique identifier within recipe
  type: DatasetType;
  provider: DataProvider;
  mode: DataMode;
  params: {
    symbols?: string[]; // Coin IDs for price/ohlcv
    interval?: string; // e.g., '1h', '1d'
    lookback?: number; // Days of history
    limit?: number; // Max rows
    // Dataset-specific params
    [key: string]: string | number | string[] | undefined;
  };
  tableName: string; // Excel table name like 'tbl_prices'
  sheetName?: string; // Optional sheet override (default: 'Data')
}

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  datasetId: string; // References DatasetConfig.id
  sheetName: string; // Sheet where chart appears
  position: {
    col: number; // 1-indexed
    row: number; // 1-indexed
  };
  size: {
    width: number; // pixels
    height: number; // pixels
  };
  options: {
    xField?: string; // Column for X-axis
    yField?: string | string[]; // Column(s) for Y-axis
    colors?: string[]; // Chart colors
    showLegend?: boolean;
    showGrid?: boolean;
    [key: string]: any;
  };
}

export interface KPIConfig {
  id: string;
  label: string;
  formula: string; // Excel formula or reference to dataset
  format: string; // Excel number format
  cell: {
    sheet: string;
    col: number;
    row: number;
  };
  style?: {
    fontSize?: number;
    bold?: boolean;
    color?: string;
    bgColor?: string;
  };
}

export interface RefreshPolicy {
  minInterval: number; // Seconds between refreshes
  planLimits: {
    free: number; // Max refreshes per day
    pro: number;
  };
}

export interface RecipeV1 {
  id: string;
  name: string;
  description?: string;
  category: RecipeCategory;
  version: '1.0';
  createdAt: string; // ISO timestamp
  updatedAt: string;

  // Data sources
  datasets: DatasetConfig[];

  // Visualizations
  charts: ChartConfig[];

  // Key metrics
  kpis: KPIConfig[];

  // Refresh configuration
  refreshPolicy: RefreshPolicy;

  // Metadata
  metadata: {
    author?: string;
    tags?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    isPublic?: boolean;
  };
}

/**
 * Validation result for recipes
 */
export interface RecipeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Saved recipe in database
 */
export interface SavedRecipe {
  id: string;
  userId: string;
  recipe: RecipeV1;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
