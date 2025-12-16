import { NextResponse } from 'next/server';
import { getCoinDetails } from '@/lib/coingecko';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const coin = await getCoinDetails(id);
    
    if (!coin) {
      return NextResponse.json(
        { error: 'Coin not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(coin);
  } catch (error) {
    console.error('Coin detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin data' },
      { status: 500 }
    );
  }
}
