/**
 * AI Data Wallets API
 * Query and manage wallet profiles
 */

import { NextResponse } from 'next/server';
import { getHighImpactWallets, getWalletProfile, createWalletProfile, getWalletSignals } from '@/lib/walletProfiler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const type = searchParams.get('type') as 'whale' | 'exchange' | 'fund' | 'miner' | 'protocol' | 'unknown' | null;
    const minImpact = parseInt(searchParams.get('minImpact') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');
    const signals = searchParams.get('signals') === 'true';
    const coinSymbol = searchParams.get('coin') || 'BTC';

    // If requesting signals for a specific coin
    if (signals) {
      const walletSignals = await getWalletSignals(coinSymbol, 24);
      return NextResponse.json(walletSignals);
    }

    // If requesting a specific wallet
    if (address) {
      const wallet = await getWalletProfile(address);
      if (!wallet) {
        return NextResponse.json(
          { error: `Wallet not found: ${address}` },
          { status: 404 }
        );
      }
      return NextResponse.json(wallet);
    }

    // Get high impact wallets with filters
    const wallets = await getHighImpactWallets(limit, minImpact, type || undefined);

    return NextResponse.json({
      count: wallets.length,
      filters: {
        type: type || 'all',
        minImpact,
        limit,
      },
      wallets,
    });
  } catch (error) {
    console.error('Wallets API error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, address, blockchain, walletType, label, knownEntity } = body;

    if (action === 'track' || !action) {
      if (!address || !blockchain) {
        return NextResponse.json(
          { error: 'address and blockchain are required' },
          { status: 400 }
        );
      }

      const result = await createWalletProfile(address, blockchain, {
        walletType: walletType || 'unknown',
        label,
        knownEntity,
      });

      if (!result) {
        return NextResponse.json(
          { error: 'Failed to create wallet profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        walletId: result.id,
        message: `Wallet ${address} is now being tracked`,
      });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Wallets POST error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
