import { NextResponse } from 'next/server';
import { fetchDerivativesData, getFundingInterpretation } from '@/lib/derivativesData';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1 minute

export async function GET() {
  try {
    const data = await fetchDerivativesData();
    const interpretation = getFundingInterpretation(data);

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        interpretation
      }
    });
  } catch (error) {
    console.error('Derivatives API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch derivatives data',
        data: null
      },
      { status: 500 }
    );
  }
}
