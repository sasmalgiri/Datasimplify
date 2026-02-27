/**
 * Shareable URL state for DataLab.
 * Encodes/decodes chart configuration into URL search params.
 */

interface DataLabURLState {
  coin?: string;
  days?: number;
  preset?: string;
  vsCurrency?: string;
  logScale?: boolean;
  normalizeMode?: boolean;
  params?: Record<string, number>;
}

/**
 * Encode current DataLab state into URL search params string.
 */
export function encodeStateToURL(state: DataLabURLState): string {
  const p = new URLSearchParams();

  if (state.coin) p.set('coin', state.coin);
  if (state.days) p.set('days', String(state.days));
  if (state.preset) p.set('preset', state.preset);
  if (state.vsCurrency && state.vsCurrency !== 'usd') p.set('cur', state.vsCurrency);
  if (state.logScale) p.set('log', '1');
  if (state.normalizeMode) p.set('norm', '1');

  // Encode custom parameters as compact key=value pairs
  if (state.params && Object.keys(state.params).length > 0) {
    p.set('p', JSON.stringify(state.params));
  }

  return p.toString();
}

/**
 * Decode URL search params into DataLab state overrides.
 * Returns null if no DataLab params found.
 */
export function decodeStateFromURL(search: string): DataLabURLState | null {
  const p = new URLSearchParams(search);

  // Check if any DataLab params exist
  if (!p.has('coin') && !p.has('preset') && !p.has('days')) return null;

  const state: DataLabURLState = {};

  if (p.has('coin')) state.coin = p.get('coin')!;
  if (p.has('days')) state.days = parseInt(p.get('days')!, 10) || undefined;
  if (p.has('preset')) state.preset = p.get('preset')!;
  if (p.has('cur')) state.vsCurrency = p.get('cur')!;
  if (p.has('log')) state.logScale = p.get('log') === '1';
  if (p.has('norm')) state.normalizeMode = p.get('norm') === '1';

  if (p.has('p')) {
    try {
      state.params = JSON.parse(p.get('p')!);
    } catch { /* ignore invalid JSON */ }
  }

  return state;
}

/**
 * Build a full shareable URL for the current DataLab state.
 */
export function buildShareURL(state: DataLabURLState): string {
  const encoded = encodeStateToURL(state);
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/datalab${encoded ? '?' + encoded : ''}`;
}
