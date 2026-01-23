/**
 * Recipe Validation
 *
 * Validates RecipeV1 against Sources Matrix rules
 */

import type {
  RecipeV1,
  DatasetConfig,
  RecipeValidationResult,
} from './types';

/**
 * Sources Matrix rules (subset for validation)
 * In production, this would be loaded from SOURCES_MATRIX.md
 */
const SOURCES_MATRIX_RULES = {
  // BYOK-only datasets
  byokRequired: ['ohlcv_5m', 'ohlcv_1m', 'funding_realtime', 'whale_transactions'],

  // Public datasets with attribution
  publicWithAttribution: {
    fear_greed: 'Alternative.me',
    defi_tvl: 'DeFiLlama',
    macro_fred: 'FRED',
    macro_yahoo: 'Yahoo Finance',
  },

  // Forbidden sources
  forbidden: ['4chan', 'discord_scrape', 'telegram_scrape'],

  // Plan gates
  planGates: {
    free: ['price', 'ohlcv_1h', 'market_cap', 'volume', 'fear_greed', 'defi_tvl'],
    pro: ['ohlcv_5m', 'ohlcv_15m', 'funding', 'reddit_sentiment'],
    premium: ['ohlcv_1m', 'nansen_smart_money', 'deribit_options'],
  },
};

/**
 * Validate a recipe against schema and Sources Matrix rules
 */
export function validateRecipe(recipe: RecipeV1): RecipeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // === Schema Validation ===

  // Check required fields
  if (!recipe.id || recipe.id.trim() === '') {
    errors.push('Recipe ID is required');
  }

  if (!recipe.name || recipe.name.trim() === '') {
    errors.push('Recipe name is required');
  }

  if (!recipe.version || recipe.version !== '1.0') {
    errors.push('Recipe version must be "1.0"');
  }

  if (!recipe.datasets || recipe.datasets.length === 0) {
    errors.push('At least one dataset is required');
  }

  // === Dataset Validation ===

  const datasetIds = new Set<string>();
  recipe.datasets.forEach((dataset, index) => {
    // Check for duplicate IDs
    if (datasetIds.has(dataset.id)) {
      errors.push(`Duplicate dataset ID: ${dataset.id}`);
    }
    datasetIds.add(dataset.id);

    // Check required fields
    if (!dataset.id || !dataset.type || !dataset.provider || !dataset.tableName) {
      errors.push(`Dataset ${index} is missing required fields`);
    }

    // Check table name format
    if (dataset.tableName && !dataset.tableName.startsWith('tbl_')) {
      warnings.push(
        `Dataset ${dataset.id}: table name should start with 'tbl_' (got: ${dataset.tableName})`
      );
    }

    // Check for forbidden sources
    if (
      SOURCES_MATRIX_RULES.forbidden.some((forbidden) =>
        dataset.type.toLowerCase().includes(forbidden)
      )
    ) {
      errors.push(`Dataset ${dataset.id}: forbidden data source`);
    }

    // Check BYOK requirements
    if (
      SOURCES_MATRIX_RULES.byokRequired.includes(dataset.type) &&
      dataset.mode !== 'byok'
    ) {
      errors.push(
        `Dataset ${dataset.id}: ${dataset.type} requires BYOK mode`
      );
    }

    // Check public attribution requirements
    if (
      dataset.mode === 'public' &&
      dataset.type in SOURCES_MATRIX_RULES.publicWithAttribution
    ) {
      warnings.push(
        `Dataset ${dataset.id}: requires attribution to ${
          SOURCES_MATRIX_RULES.publicWithAttribution[
            dataset.type as keyof typeof SOURCES_MATRIX_RULES.publicWithAttribution
          ]
        }`
      );
    }
  });

  // === Chart Validation ===

  recipe.charts.forEach((chart, index) => {
    // Check required fields
    if (!chart.id || !chart.type || !chart.datasetId) {
      errors.push(`Chart ${index} is missing required fields`);
    }

    // Check dataset reference
    if (chart.datasetId && !datasetIds.has(chart.datasetId)) {
      errors.push(
        `Chart ${chart.id}: references unknown dataset '${chart.datasetId}'`
      );
    }

    // Check position
    if (
      !chart.position ||
      chart.position.col < 1 ||
      chart.position.row < 1
    ) {
      errors.push(`Chart ${chart.id}: invalid position`);
    }

    // Check size
    if (
      !chart.size ||
      chart.size.width <= 0 ||
      chart.size.height <= 0
    ) {
      errors.push(`Chart ${chart.id}: invalid size`);
    }
  });

  // === KPI Validation ===

  recipe.kpis.forEach((kpi, index) => {
    // Check required fields
    if (!kpi.id || !kpi.label || !kpi.formula) {
      errors.push(`KPI ${index} is missing required fields`);
    }

    // Check cell position
    if (
      !kpi.cell ||
      !kpi.cell.sheet ||
      kpi.cell.col < 1 ||
      kpi.cell.row < 1
    ) {
      errors.push(`KPI ${kpi.id}: invalid cell position`);
    }
  });

  // === Refresh Policy Validation ===

  if (!recipe.refreshPolicy) {
    errors.push('Refresh policy is required');
  } else {
    if (recipe.refreshPolicy.minInterval < 10) {
      warnings.push('Refresh interval should be at least 10 seconds');
    }

    if (
      !recipe.refreshPolicy.planLimits ||
      !recipe.refreshPolicy.planLimits.free ||
      !recipe.refreshPolicy.planLimits.pro ||
      !recipe.refreshPolicy.planLimits.premium
    ) {
      errors.push('Refresh policy must define limits for all plans');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a recipe is compatible with a given plan tier
 */
export function checkPlanCompatibility(
  recipe: RecipeV1,
  plan: 'free' | 'pro' | 'premium'
): { compatible: boolean; requiredPlan?: 'pro' | 'premium'; reason?: string } {
  // Check dataset plan gates
  for (const dataset of recipe.datasets) {
    if (
      plan === 'free' &&
      !SOURCES_MATRIX_RULES.planGates.free.includes(dataset.type)
    ) {
      if (SOURCES_MATRIX_RULES.planGates.pro.includes(dataset.type)) {
        return {
          compatible: false,
          requiredPlan: 'pro',
          reason: `Dataset ${dataset.id} (${dataset.type}) requires Pro plan`,
        };
      }
      if (SOURCES_MATRIX_RULES.planGates.premium.includes(dataset.type)) {
        return {
          compatible: false,
          requiredPlan: 'premium',
          reason: `Dataset ${dataset.id} (${dataset.type}) requires Premium plan`,
        };
      }
    }

    if (
      plan === 'pro' &&
      SOURCES_MATRIX_RULES.planGates.premium.includes(dataset.type)
    ) {
      return {
        compatible: false,
        requiredPlan: 'premium',
        reason: `Dataset ${dataset.id} (${dataset.type}) requires Premium plan`,
      };
    }
  }

  return { compatible: true };
}

/**
 * Generate default refresh policy based on datasets
 */
export function generateRefreshPolicy(
  datasets: DatasetConfig[]
): RecipeV1['refreshPolicy'] {
  // Determine minimum interval based on dataset types
  let minInterval = 60; // Default 1 minute

  const hasRealtime = datasets.some((d) =>
    ['ohlcv_1m', 'funding_realtime'].includes(d.type)
  );
  const hasFastData = datasets.some((d) =>
    ['ohlcv_5m', 'price'].includes(d.type)
  );

  if (hasRealtime) {
    minInterval = 10; // 10 seconds for real-time
  } else if (hasFastData) {
    minInterval = 30; // 30 seconds for fast data
  }

  return {
    minInterval,
    planLimits: {
      free: 50, // 50 refreshes per day
      pro: 500, // 500 per day
      premium: -1, // Unlimited
    },
  };
}
