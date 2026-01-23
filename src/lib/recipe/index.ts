/**
 * Recipe System - Main Export
 *
 * Central export for all recipe-related functionality
 */

export * from './types';
export * from './validation';
export * from './templates';
export * from './executor';
export * from './generator';

// Re-export commonly used types for convenience
export type {
  RecipeV1,
  DatasetConfig,
  ChartConfig,
  KPIConfig,
  SavedRecipe,
  RecipeValidationResult,
} from './types';

export type {
  ExecutionContext,
  ExecutionResult,
  DatasetResult,
} from './executor';

// Re-export validation functions
export { validateRecipe, checkPlanCompatibility, generateRefreshPolicy } from './validation';

// Re-export templates
export { RECIPE_TEMPLATES } from './templates';

// Re-export execution functions
export { executeRecipe, executeDataset } from './executor';

// Re-export generation functions
export { generateWorkbook } from './generator';
