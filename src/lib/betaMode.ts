/**
 * Beta Mode Switch
 *
 * NEXT_PUBLIC_BETA_MODE=true  → everything free, no tier/credit/download gates
 * NEXT_PUBLIC_BETA_MODE=false → full monetization (tiers, credits, limits)
 */
export const IS_BETA_MODE = process.env.NEXT_PUBLIC_BETA_MODE === 'true';
