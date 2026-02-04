import { NextResponse } from 'next/server';

/**
 * Excel Market Data API - DISABLED
 *
 * CryptoReportKit does not redistribute market data via API.
 * Instead, we provide Excel templates with CRK formulas
 * that fetch data directly via the user's own API keys (BYOK).
 *
 * Use /api/templates/download for template generation.
 */

export async function GET() {
  return NextResponse.json(
    {
      error: 'Market data API is not available',
      message: 'CryptoReportKit provides Excel templates with formulas, not market data APIs. ' +
               'Templates fetch data via the CRK add-in on your machine using your own API keys (BYOK).',
      alternative: '/api/templates/download',
      documentation: '/template-requirements',
    },
    { status: 410 }
  );
}
