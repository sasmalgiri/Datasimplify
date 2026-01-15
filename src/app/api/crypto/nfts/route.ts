/**
 * NFT Collections API Route
 *
 * Returns trending NFT collections from CoinGecko
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 * CoinGecko data cannot be redistributed without a Data Redistribution License.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_BASE_URL = 'https://pro-api.coingecko.com/api/v3';

// Cache data for 5 minutes
interface CachedNFT {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  native_currency?: string;
  floor_price_native?: number;
  floor_price_usd?: number;
  market_cap_usd?: number;
  volume_24h_usd?: number;
  floor_price_change_24h?: number;
  unique_addresses?: number;
  total_supply?: number;
  contract_address?: string;
  asset_platform?: string;
}

let cachedData: {
  nfts: CachedNFT[] | null;
  timestamp: number;
} = {
  nfts: null,
  timestamp: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface NFTListItem {
  id: string;
  contract_address: string;
  name: string;
  asset_platform_id: string;
  symbol: string;
}

interface NFTDetails {
  id: string;
  name: string;
  symbol: string;
  image?: { small: string };
  description?: string;
  native_currency?: string;
  floor_price?: { native_currency: number; usd: number };
  market_cap?: { native_currency: number; usd: number };
  volume_24h?: { native_currency: number; usd: number };
  floor_price_in_usd_24h_percentage_change?: number;
  number_of_unique_addresses?: number;
  total_supply?: number;
}

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/nfts');
  if (blocked) return blocked;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const order = searchParams.get('order') || 'market_cap_usd_desc';

    // Check cache first
    const now = Date.now();
    if (cachedData.nfts && now - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cachedData.nfts.slice(0, limit),
        cached: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    // Fetch NFT list
    const response = await fetch(
      `${COINGECKO_BASE_URL}/nfts/list?order=${order}&per_page=${limit}`,
      {
        headers: {
          'x-cg-pro-api-key': COINGECKO_API_KEY || '',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const nftList: NFTListItem[] = await response.json();

    // Fetch details for top NFTs (limit to 10 to avoid rate limits)
    const detailedNfts = await Promise.all(
      nftList.slice(0, 10).map(async (nft) => {
        try {
          const detailResponse = await fetch(
            `${COINGECKO_BASE_URL}/nfts/${nft.id}`,
            {
              headers: {
                'x-cg-pro-api-key': COINGECKO_API_KEY || '',
                'Accept': 'application/json',
              },
            }
          );

          if (!detailResponse.ok) {
            return {
              id: nft.id,
              name: nft.name,
              symbol: nft.symbol,
              contract_address: nft.contract_address,
              asset_platform: nft.asset_platform_id,
            };
          }

          const details: NFTDetails = await detailResponse.json();
          return {
            id: details.id,
            name: details.name,
            symbol: details.symbol,
            image: details.image?.small,
            description: details.description?.slice(0, 200),
            native_currency: details.native_currency,
            floor_price_native: details.floor_price?.native_currency,
            floor_price_usd: details.floor_price?.usd,
            market_cap_usd: details.market_cap?.usd,
            volume_24h_usd: details.volume_24h?.usd,
            floor_price_change_24h: details.floor_price_in_usd_24h_percentage_change,
            unique_addresses: details.number_of_unique_addresses,
            total_supply: details.total_supply,
          };
        } catch {
          return {
            id: nft.id,
            name: nft.name,
            symbol: nft.symbol,
          };
        }
      })
    );

    // Update cache
    cachedData = {
      nfts: detailedNfts,
      timestamp: now,
    };

    return NextResponse.json({
      success: true,
      data: detailedNfts,
      cached: false,
      source: 'coingecko',
      attribution: 'Data provided by CoinGecko',
    });
  } catch (error) {
    console.error('[NFT API] Error:', error);

    // Return cached data if available
    if (cachedData.nfts) {
      return NextResponse.json({
        success: true,
        data: cachedData.nfts,
        cached: true,
        stale: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch NFT collections',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
