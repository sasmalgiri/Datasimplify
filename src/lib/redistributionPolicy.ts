import { isDisplayOnly, getDataSource } from './dataSources';

export type RedistributionPurpose = 'chart' | 'download';

export type RedistributionContext = {
  purpose: RedistributionPurpose;
  route?: string;
  category?: string;
};

const FREE_ONLY_SOURCES = new Set([
  // Sources that are used without paid/API-key requirements in this project.
  // Note: "free" does not automatically mean "redistributable"; use this only for cost-driven restrictions.
  'binance',
  'coinlore',
  'alternativeme',
  'defillama',
  'blockchaininfo',
  'publicrpc',
]);

// Display-only sources that CANNOT be redistributed without a special license
// These are checked separately from the allowlist
const DISPLAY_ONLY_SOURCES = new Set([
  'coingecko', // Requires Data Redistribution License for downloads
]);

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Redistribution policy:
 * - In production, defaults to STRICT (fail closed) unless explicitly disabled.
 * - In development, defaults to OFF unless explicitly enabled.
 */
export function isRedistributionPolicyEnabled(): boolean {
  // In APP_MODE=free, always enforce source gating.
  const appMode = (process.env.NEXT_PUBLIC_APP_MODE || '').trim().toLowerCase();
  if (appMode === 'free') return true;

  const mode = (process.env.REDISTRIBUTION_MODE || '').trim().toLowerCase();
  if (mode === 'off' || mode === 'disabled' || mode === '0' || mode === 'false') return false;
  if (mode === 'strict' || mode === 'on' || mode === 'enabled' || mode === '1' || mode === 'true') return true;
  return isProduction();
}

/**
 * Comma-separated allowlist of data source keys that you have verified are legally redistributable.
 * Example: REDISTRIBUTABLE_SOURCES=binance,alternativeme
 */
export function getRedistributableSourcesAllowlist(): Set<string> {
  const appMode = (process.env.NEXT_PUBLIC_APP_MODE || '').trim().toLowerCase();
  const raw = (process.env.REDISTRIBUTABLE_SOURCES || '').trim();

  const fromEnv = new Set(
    (raw ? raw.split(',') : [])
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
  );

  // Free mode: default to the built-in free-only set, and always intersect
  // with it to prevent accidental enablement of paid/non-free sources.
  if (appMode === 'free') {
    const base = fromEnv.size > 0 ? fromEnv : new Set(FREE_ONLY_SOURCES);
    return new Set([...base].filter(s => FREE_ONLY_SOURCES.has(s)));
  }

  return fromEnv;
}

export function isSourceRedistributable(sourceKey: string): boolean {
  const key = String(sourceKey || '').trim().toLowerCase();

  // Display-only sources are NEVER redistributable (without a special license)
  if (DISPLAY_ONLY_SOURCES.has(key) || isDisplayOnly(key)) {
    return false;
  }

  const allow = getRedistributableSourcesAllowlist();
  return allow.has(key);
}

/**
 * Check if a source is display-only (cannot be redistributed)
 * Uses both the local set and the dataSources module for comprehensive checking
 */
export function isSourceDisplayOnly(sourceKey: string): boolean {
  const key = String(sourceKey || '').trim().toLowerCase();
  return DISPLAY_ONLY_SOURCES.has(key) || isDisplayOnly(key);
}

/**
 * Get information about why a source cannot be redistributed
 */
export function getRedistributionBlockReason(sourceKey: string): string | null {
  const key = String(sourceKey || '').trim().toLowerCase();

  if (DISPLAY_ONLY_SOURCES.has(key) || isDisplayOnly(key)) {
    const source = getDataSource(key);
    return `${source?.name || key} data is display-only and cannot be included in downloads. ` +
           `A Data Redistribution License is required for exports.`;
  }

  if (isRedistributionPolicyEnabled()) {
    const allow = getRedistributableSourcesAllowlist();
    if (!allow.has(key)) {
      return `Source "${key}" is not in the REDISTRIBUTABLE_SOURCES allowlist.`;
    }
  }

  return null;
}

export function assertRedistributionAllowed(sources: string | string[], context: RedistributionContext): void {
  const list = Array.isArray(sources) ? sources : [sources];
  const normalized = list
    .map(s => String(s || '').trim().toLowerCase())
    .filter(Boolean);

  // ALWAYS check display-only sources, regardless of policy setting
  // Display-only sources can NEVER be redistributed without a special license
  for (const source of normalized) {
    if (DISPLAY_ONLY_SOURCES.has(source) || isDisplayOnly(source)) {
      const sourceInfo = getDataSource(source);
      const where = context.route ? ` (route: ${context.route})` : '';
      const what = context.category ? ` (category: ${context.category})` : '';
      throw new Error(
        `Redistribution blocked: ${sourceInfo?.name || source} is display-only${where}${what}. ` +
        `A Data Redistribution License is required for downloads.`
      );
    }
  }

  // If redistribution policy is disabled, allow everything except display-only
  if (!isRedistributionPolicyEnabled()) return;

  const allow = getRedistributableSourcesAllowlist();

  if (allow.size === 0) {
    throw new Error(
      `Redistribution policy is enabled but REDISTRIBUTABLE_SOURCES is empty (blocked ${context.purpose}).`
    );
  }

  for (const source of normalized) {
    if (!allow.has(source)) {
      const where = context.route ? ` (route: ${context.route})` : '';
      const what = context.category ? ` (category: ${context.category})` : '';
      throw new Error(
        `Redistribution blocked for source "${source}"${where}${what}. Add it to REDISTRIBUTABLE_SOURCES only after verifying rights.`
      );
    }
  }
}
