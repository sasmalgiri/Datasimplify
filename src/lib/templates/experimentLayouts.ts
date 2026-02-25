/**
 * Maps template categories to experiment layout types.
 * Each layout type defines what UI to render and what data endpoints to fetch.
 */

import type { TemplateCategoryId, TemplateType } from './templateConfig';
import { getTemplateConfig } from './templateConfig';

export type ExperimentLayoutType =
  | 'market-table'
  | 'technical-chart'
  | 'defi-protocol'
  | 'sentiment-gauge'
  | 'derivatives-data';

/** Category → layout type mapping */
export const TEMPLATE_LAYOUT_MAP: Record<TemplateCategoryId, ExperimentLayoutType> = {
  market: 'market-table',
  technical: 'technical-chart',
  onchain: 'derivatives-data',
  defi: 'defi-protocol',
  sentiment: 'sentiment-gauge',
  derivatives: 'derivatives-data',
  portfolio: 'market-table',
  nft: 'sentiment-gauge',
  tokens: 'derivatives-data',
};

/** Layout type → data endpoints to fetch */
export const LAYOUT_ENDPOINTS: Record<ExperimentLayoutType, string[]> = {
  'market-table': ['markets', 'global', 'fear_greed'],
  'technical-chart': ['markets', 'ohlc', 'coin_history'],
  'defi-protocol': ['defillama_protocols', 'defillama_chains', 'defillama_tvl_history'],
  'sentiment-gauge': ['markets', 'global', 'fear_greed', 'categories'],
  'derivatives-data': ['markets', 'derivatives', 'global'],
};

/** Layout display metadata */
export const LAYOUT_META: Record<ExperimentLayoutType, { title: string; description: string }> = {
  'market-table': { title: 'Market Overview', description: 'Live market data table with price charts and global stats' },
  'technical-chart': { title: 'Technical Analysis', description: 'Interactive candlestick charts with indicators and volume' },
  'defi-protocol': { title: 'DeFi Analytics', description: 'TVL trends, protocol rankings, and chain comparison' },
  'sentiment-gauge': { title: 'Market Sentiment', description: 'Fear & Greed gauge, sentiment trends, and mood indicators' },
  'derivatives-data': { title: 'Derivatives & Metrics', description: 'Funding rates, derivatives data, and global metrics' },
};

/** Get the experiment layout type for a given template */
export function getLayoutForTemplate(templateId: TemplateType): ExperimentLayoutType {
  const config = getTemplateConfig(templateId);
  return TEMPLATE_LAYOUT_MAP[config.category];
}
