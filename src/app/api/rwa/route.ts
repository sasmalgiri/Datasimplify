/**
 * Real World Asset (RWA) Tokenization Data API
 *
 * Provides tokenized RWA market data including:
 * - Tokenized US Treasuries
 * - Tokenized Private Credit
 * - Tokenized Commodities
 * - Total RWA Market Cap
 *
 * Data sourced from RWA.xyz (when API access is configured)
 * Falls back to cached/sample data when API is not available
 *
 * Attribution: Data powered by RWA.xyz (https://rwa.xyz)
 */

import { NextRequest, NextResponse } from 'next/server';

// Note: RWA.xyz API requires enterprise access - contact team@rwa.xyz
// When API access is available, set RWA_XYZ_API_KEY in environment
const RWA_API_KEY = process.env.RWA_XYZ_API_KEY;
const RWA_API_BASE = 'https://api.rwa.xyz/v1'; // Placeholder - actual endpoint TBD

// Sample data based on publicly available RWA.xyz dashboard data (February 2026)
// This data is illustrative and will be replaced with live API data when available
const SAMPLE_RWA_DATA = {
  lastUpdated: new Date().toISOString(),
  isSampleData: true, // Flag to indicate this is sample data
  dataSource: 'RWA.xyz (sample data - API access required for live data)',
  attribution: 'Data powered by RWA.xyz',
  attributionUrl: 'https://rwa.xyz',

  overview: {
    totalMarketCap: 36_000_000_000, // $36B
    totalMarketCapFormatted: '$36.0B',
    growth30d: 12.5, // 12.5% growth
    totalAssets: 500,
    totalHolders: 300000,
    totalNetworks: 15,
    totalIssuers: 240,
  },

  categories: [
    {
      id: 'treasuries',
      name: 'Tokenized US Treasuries',
      totalValue: 9_690_000_000, // $9.69B
      totalValueFormatted: '$9.69B',
      change7d: 1.12,
      apy7d: 3.32,
      totalAssets: 61,
      holders: 65377,
      holdersChange7d: 10.85,
      topProtocols: [
        { name: 'Ondo Finance', value: 2_100_000_000, share: 21.7 },
        { name: 'Securitize', value: 1_800_000_000, share: 18.6 },
        { name: 'Franklin Templeton', value: 1_500_000_000, share: 15.5 },
      ],
      description: 'US Treasury bills and bonds tokenized on-chain for 24/7 liquidity',
    },
    {
      id: 'private-credit',
      name: 'Tokenized Private Credit',
      totalValue: 18_910_000_000, // $18.91B
      totalValueFormatted: '$18.91B',
      change7d: 2.3,
      apy7d: 8.5,
      totalAssets: 150,
      holders: 12500,
      holdersChange7d: 5.2,
      cumulativeOriginations: 33_660_000_000,
      topProtocols: [
        { name: 'Centrifuge', value: 5_200_000_000, share: 27.5 },
        { name: 'Maple Finance', value: 3_800_000_000, share: 20.1 },
        { name: 'Goldfinch', value: 2_100_000_000, share: 11.1 },
      ],
      description: 'Corporate loans and credit facilities tokenized for DeFi integration',
    },
    {
      id: 'commodities',
      name: 'Tokenized Commodities',
      totalValue: 1_200_000_000, // $1.2B
      totalValueFormatted: '$1.2B',
      change7d: -0.5,
      totalAssets: 25,
      holders: 45000,
      holdersChange7d: 3.1,
      topAssets: [
        { name: 'Gold (PAXG)', value: 650_000_000, share: 54.2 },
        { name: 'Gold (XAUT)', value: 420_000_000, share: 35.0 },
        { name: 'Silver', value: 80_000_000, share: 6.7 },
      ],
      description: 'Precious metals and commodities with on-chain proof of reserves',
    },
    {
      id: 'stocks',
      name: 'Tokenized Public Stocks',
      totalValue: 877_700_000, // $877.7M
      totalValueFormatted: '$877.7M',
      change30d: 21.7,
      monthlyVolume: 2_500_000_000,
      monthlyActiveAddresses: 39248,
      holders: 157350,
      holdersChange30d: 22.31,
      description: 'Public equities tokenized for 24/7 global trading',
    },
    {
      id: 'real-estate',
      name: 'Tokenized Real Estate',
      totalValue: 3_500_000_000, // $3.5B
      totalValueFormatted: '$3.5B',
      change7d: 1.8,
      totalProperties: 120,
      holders: 28000,
      avgYield: 6.2,
      description: 'Commercial and residential real estate with fractional ownership',
    },
  ],

  networkDistribution: [
    { network: 'Ethereum', share: 65, value: 23_400_000_000 },
    { network: 'Stellar', share: 12, value: 4_320_000_000 },
    { network: 'Polygon', share: 8, value: 2_880_000_000 },
    { network: 'Arbitrum', share: 5, value: 1_800_000_000 },
    { network: 'Solana', share: 4, value: 1_440_000_000 },
    { network: 'Others', share: 6, value: 2_160_000_000 },
  ],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    // If RWA API key is available, fetch live data
    if (RWA_API_KEY) {
      try {
        const liveData = await fetchLiveRWAData(category);
        return NextResponse.json({
          success: true,
          data: liveData,
          isSampleData: false,
          source: 'rwa.xyz',
          attribution: 'Data powered by RWA.xyz',
          attributionUrl: 'https://rwa.xyz',
        });
      } catch (apiError) {
        console.error('[RWA API] Live API error, falling back to sample:', apiError);
        // Fall through to sample data
      }
    }

    // Return sample data with clear labeling
    let responseData;
    if (category) {
      const categoryData = SAMPLE_RWA_DATA.categories.find(
        (c) => c.id === category.toLowerCase()
      );
      if (!categoryData) {
        return NextResponse.json(
          { success: false, error: 'Category not found', validCategories: SAMPLE_RWA_DATA.categories.map((c) => c.id) },
          { status: 404 }
        );
      }
      responseData = {
        ...categoryData,
        overview: SAMPLE_RWA_DATA.overview,
      };
    } else {
      responseData = SAMPLE_RWA_DATA;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      isSampleData: true,
      sampleDataNote: 'This is illustrative sample data based on publicly available RWA.xyz dashboard information. For live data, RWA.xyz API access is required (contact team@rwa.xyz).',
      source: 'rwa.xyz',
      attribution: 'Data inspired by RWA.xyz public dashboard',
      attributionUrl: 'https://rwa.xyz',
    });
  } catch (error) {
    console.error('[RWA API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch RWA data' },
      { status: 500 }
    );
  }
}

/**
 * Fetch live data from RWA.xyz API
 * Note: Actual endpoint and authentication method TBD based on API access
 */
async function fetchLiveRWAData(category: string | null) {
  // Placeholder for actual API integration
  // Will be implemented when RWA.xyz API access is established
  const endpoint = category
    ? `${RWA_API_BASE}/categories/${category}`
    : `${RWA_API_BASE}/overview`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${RWA_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`RWA API error: ${response.status}`);
  }

  return response.json();
}
