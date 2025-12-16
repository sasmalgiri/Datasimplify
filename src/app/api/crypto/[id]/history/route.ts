import { NextResponse } from 'next/server';
import { getPriceHistory } from '@/lib/coingecko';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  try {
    const prices = await getPriceHistory(id, days);
    
    return NextResponse.json({
      coinId: id,
      days,
      prices,
    });
  } catch (error) {
    console.error('Price history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history', prices: [] },
      { status: 500 }
    );
  }
}
