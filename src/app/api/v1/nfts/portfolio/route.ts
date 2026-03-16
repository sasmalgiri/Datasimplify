/**
 * NFT Portfolio Endpoint
 *
 * GET /api/v1/nfts/portfolio?address=0x...&chain=ethereum
 *
 * Fetches NFTs owned by an address using block explorer APIs.
 * Returns collection info, floor prices, and estimated portfolio value.
 */

import { NextRequest, NextResponse } from 'next/server';

interface OwnedNft {
  tokenId: string;
  contractAddress: string;
  name: string;
  collectionName: string;
  imageUrl?: string;
  chain: string;
  standard: 'ERC-721' | 'ERC-1155';
  floorPrice?: number;
  lastSalePrice?: number;
  estimatedValue?: number;
}

interface NftPortfolioResult {
  address: string;
  chain: string;
  nfts: OwnedNft[];
  totalEstimatedValue: number;
  collectionBreakdown: { collection: string; count: number; floorPrice?: number; totalValue: number }[];
}

/* ── Fetch NFTs from block explorers ── */

const EXPLORER_APIS: Record<string, { url: string; apiKey: string }> = {
  ethereum: {
    url: 'https://api.etherscan.io/api',
    apiKey: process.env.ETHERSCAN_API_KEY || '',
  },
  polygon: {
    url: 'https://api.polygonscan.com/api',
    apiKey: process.env.POLYGONSCAN_API_KEY || '',
  },
  bsc: {
    url: 'https://api.bscscan.com/api',
    apiKey: process.env.BSCSCAN_API_KEY || '',
  },
  arbitrum: {
    url: 'https://api.arbiscan.io/api',
    apiKey: process.env.ARBISCAN_API_KEY || '',
  },
  base: {
    url: 'https://api.basescan.org/api',
    apiKey: process.env.BASESCAN_API_KEY || '',
  },
};

async function fetchNftsFromExplorer(
  address: string,
  chain: string,
): Promise<OwnedNft[]> {
  const explorer = EXPLORER_APIS[chain];
  if (!explorer) return [];

  // Fetch ERC-721 transfers TO this address
  const url721 = `${explorer.url}?module=account&action=tokennfttx&address=${address}&page=1&offset=200&sort=desc&apikey=${explorer.apiKey}`;
  const res721 = await fetch(url721, { signal: AbortSignal.timeout(15000) });
  const data721 = await res721.json();

  // Track NFT ownership: received = owned, sent = not owned
  const nftMap = new Map<string, OwnedNft>();

  if (data721.status === '1' && Array.isArray(data721.result)) {
    for (const tx of data721.result) {
      const key = `${tx.contractAddress}:${tx.tokenID}`;
      const isReceive = tx.to.toLowerCase() === address.toLowerCase();

      if (isReceive) {
        nftMap.set(key, {
          tokenId: tx.tokenID,
          contractAddress: tx.contractAddress,
          name: `${tx.tokenName} #${tx.tokenID}`,
          collectionName: tx.tokenName || 'Unknown Collection',
          chain,
          standard: 'ERC-721',
        });
      } else {
        nftMap.delete(key);
      }
    }
  }

  // Also fetch ERC-1155 transfers
  const url1155 = `${explorer.url}?module=account&action=token1155tx&address=${address}&page=1&offset=100&sort=desc&apikey=${explorer.apiKey}`;
  const res1155 = await fetch(url1155, { signal: AbortSignal.timeout(10000) }).catch(() => null);

  if (res1155?.ok) {
    const data1155 = await res1155.json();
    if (data1155.status === '1' && Array.isArray(data1155.result)) {
      for (const tx of data1155.result) {
        const key = `${tx.contractAddress}:${tx.tokenID}`;
        const isReceive = tx.to.toLowerCase() === address.toLowerCase();

        if (isReceive) {
          nftMap.set(key, {
            tokenId: tx.tokenID,
            contractAddress: tx.contractAddress,
            name: `${tx.tokenName || 'ERC-1155'} #${tx.tokenID}`,
            collectionName: tx.tokenName || 'Unknown Collection',
            chain,
            standard: 'ERC-1155',
          });
        } else {
          nftMap.delete(key);
        }
      }
    }
  }

  return Array.from(nftMap.values());
}

/* ── Enrich with CoinGecko floor price data ── */

async function enrichWithFloorPrices(nfts: OwnedNft[]): Promise<void> {
  // Group by collection
  const collections = new Set(nfts.map((n) => n.contractAddress));

  for (const contractAddr of Array.from(collections).slice(0, 5)) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/nfts/ethereum/contract/${contractAddr}`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!res.ok) continue;
      const data = await res.json();

      const floorPrice = data.floor_price?.usd || 0;

      for (const nft of nfts) {
        if (nft.contractAddress === contractAddr) {
          nft.floorPrice = floorPrice;
          nft.estimatedValue = floorPrice;
          if (data.image?.small) nft.imageUrl = data.image.small;
          if (data.name) nft.collectionName = data.name;
        }
      }
    } catch { /* skip */ }
  }
}

/* ── Route Handler ── */

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address');
    if (!address) {
      return NextResponse.json({ error: 'address parameter is required' }, { status: 400 });
    }

    const chain = request.nextUrl.searchParams.get('chain') || 'ethereum';
    const supportedChains = Object.keys(EXPLORER_APIS);

    if (!supportedChains.includes(chain)) {
      return NextResponse.json(
        { error: `Unsupported chain. Supported: ${supportedChains.join(', ')}` },
        { status: 400 },
      );
    }

    const nfts = await fetchNftsFromExplorer(address, chain);
    await enrichWithFloorPrices(nfts);

    // Build collection breakdown
    const collectionMap = new Map<string, { count: number; floorPrice?: number; totalValue: number }>();
    for (const nft of nfts) {
      const existing = collectionMap.get(nft.collectionName) || {
        count: 0,
        floorPrice: nft.floorPrice,
        totalValue: 0,
      };
      existing.count += 1;
      existing.totalValue += nft.estimatedValue || 0;
      collectionMap.set(nft.collectionName, existing);
    }

    const collectionBreakdown = Array.from(collectionMap.entries())
      .map(([collection, data]) => ({ collection, ...data }))
      .sort((a, b) => b.totalValue - a.totalValue);

    const totalEstimatedValue = nfts.reduce((s, n) => s + (n.estimatedValue || 0), 0);

    const result: NftPortfolioResult = {
      address,
      chain,
      nfts,
      totalEstimatedValue,
      collectionBreakdown,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[NFT Portfolio] Error:', err);
    const message = err instanceof Error ? err.message : 'NFT API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
