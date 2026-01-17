/**
 * All Coins API Route
 *
 * Returns list of all available coins (metadata only, no prices)
 * Uses dynamic coin discovery for 600+ coins from Binance
 *
 * Ideal for: dropdowns, coin selectors, search autocomplete
 */

import { NextRequest, NextResponse } from 'next/server';
import { discoverCoins } from '@/lib/coinDiscovery';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

// Cache the coin list
let cachedCoins: { coins: CoinMeta[]; total: number; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CoinMeta {
  id: string;
  symbol: string;
  name: string;
  image: string;
  category: string;
}

export async function GET(request: NextRequest) {
  // Enforce display-only access
  const blocked = enforceDisplayOnly(request, '/api/crypto/all');
  if (blocked) return blocked;

  try {
    // Return cached if fresh
    if (cachedCoins && Date.now() - cachedCoins.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        coins: cachedCoins.coins,
        total: cachedCoins.total,
        source: 'cache',
        updated: new Date(cachedCoins.timestamp).toISOString(),
      });
    }

    // Discover all coins from Binance
    const discoveredCoins = await discoverCoins();

    // Map to minimal metadata format
    const coins: CoinMeta[] = discoveredCoins.map(c => ({
      id: c.geckoId || c.symbol.toLowerCase(),
      symbol: c.symbol,
      name: c.name,
      image: c.image,
      category: c.category,
    }));

    // Cache the results
    cachedCoins = {
      coins,
      total: coins.length,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      coins,
      total: coins.length,
      source: 'binance-discovery',
      updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching all coins:', error);

    // Return cached if available on error
    if (cachedCoins) {
      return NextResponse.json({
        success: true,
        coins: cachedCoins.coins,
        total: cachedCoins.total,
        source: 'stale-cache',
        updated: new Date(cachedCoins.timestamp).toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch coin list' },
      { status: 500 }
    );
  }
}
