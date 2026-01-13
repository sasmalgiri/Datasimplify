import { NextResponse } from 'next/server';

/**
 * Market Data Download API - DISABLED
 *
 * DataSimplify does not redistribute market data.
 * Instead, we provide Excel templates with CryptoSheets formulas
 * that fetch data directly via the user's CryptoSheets account.
 *
 * Use /api/templates/download for template generation.
 */

export async function GET() {
  return NextResponse.json(
    {
      error: 'Data downloads are not available',
      message: 'DataSimplify provides Excel templates with formulas, not market data downloads. ' +
               'Templates fetch data via the CryptoSheets add-in on your machine.',
      alternative: '/api/templates/download',
      documentation: '/template-requirements',
    },
    { status: 410 } // Gone - resource no longer available
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Data downloads are not available',
      message: 'DataSimplify provides Excel templates with formulas, not market data downloads. ' +
               'Templates fetch data via the CryptoSheets add-in on your machine.',
      alternative: '/api/templates/download',
      documentation: '/template-requirements',
    },
    { status: 410 }
  );
}
