/**
 * Packs List API
 *
 * Lists all available pack templates.
 *
 * GET /api/v1/packs - List all packs
 */

import { NextResponse } from 'next/server';
import { PACK_RECIPES } from '@/lib/templates/packGenerator';

export async function GET() {
  const packs = Object.entries(PACK_RECIPES).map(([id, recipe]) => ({
    id,
    name: recipe.name,
    description: recipe.description,
    coins: recipe.coins,
    coins_count: recipe.coins.length,
    metrics: recipe.metrics,
    currency: recipe.currency,
    ohlcv_days: recipe.ohlcv_days,
    movers_count: recipe.movers_count,
    download_url: `/api/v1/packs/${id}`,
  }));

  return NextResponse.json({
    packs,
    total: packs.length,
  });
}
