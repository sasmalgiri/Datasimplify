/**
 * Recipe System - Main Export
 *
 * Central export for all recipe-related functionality
 */

export * from './types';
export * from './validation';
export * from './templates';

// Re-export commonly used types for convenience
export type {
  RecipeV1,
  DatasetConfig,
  ChartConfig,
  KPIConfig,
  SavedRecipe,
  RecipeValidationResult,
} from './types';

// Re-export validation functions
export { validateRecipe, checkPlanCompatibility, generateRefreshPolicy } from './validation';

// Re-export templates
export { RECIPE_TEMPLATES } from './templates';
