import type { ReportPackDefinition } from './types';

export const REPORT_PACK_DEFINITIONS: ReportPackDefinition[] = [
  {
    id: 'portfolio-weekly',
    name: 'Portfolio Weekly Pack',
    description:
      'Executive summary with KPIs, performance charts, and full position breakdown. Client-ready PDF + Excel + CSV.',
    icon: '📊',
    tier: 'free',
    sections: [
      {
        id: 'exec-summary',
        type: 'executive_summary',
        title: 'Executive Summary',
        config: {
          kpis: [
            'total_value',
            'return_7d',
            'return_30d',
            'asset_count',
            'top_winner',
            'top_loser',
          ],
        },
      },
      {
        id: 'value-chart',
        type: 'chart',
        title: 'Portfolio Value Over Time',
        config: { chartType: 'area', dataKey: 'portfolio_history', color: '#10B981' },
      },
      {
        id: 'allocation-chart',
        type: 'chart',
        title: 'Asset Allocation',
        config: { chartType: 'donut', dataKey: 'allocation' },
      },
      {
        id: 'performance-chart',
        type: 'chart',
        title: '24h Performance',
        config: { chartType: 'bar', dataKey: 'performance_24h', color: '#10B981' },
      },
      {
        id: 'sector-chart',
        type: 'chart',
        title: 'Category Breakdown',
        config: { chartType: 'bar', dataKey: 'categories' },
      },
      {
        id: 'positions-table',
        type: 'appendix',
        title: 'All Positions',
        config: {
          columns: [
            'rank',
            'name',
            'symbol',
            'price',
            'change_24h',
            'change_7d',
            'market_cap',
            'volume',
          ],
        },
      },
    ],
    requiredData: ['markets', 'global', 'categories'],
    creditCost: 0,
  },
];

export function getPackDefinition(id: string): ReportPackDefinition | undefined {
  return REPORT_PACK_DEFINITIONS.find((p) => p.id === id);
}
