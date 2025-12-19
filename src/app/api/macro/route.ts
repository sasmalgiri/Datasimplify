import { NextResponse } from 'next/server';
import { fetchMacroData, getRiskInterpretation } from '@/lib/macroData';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const data = await fetchMacroData();
    const interpretation = getRiskInterpretation(data);

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        interpretation
      }
    });
  } catch (error) {
    console.error('Macro API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch macro data',
        data: null
      },
      { status: 500 }
    );
  }
}
