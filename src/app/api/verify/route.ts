import { NextRequest, NextResponse } from 'next/server';
import { verificationEngine, EXAMPLE_CONTRACT, VerificationResponse } from '@/lib/contractVerifier';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'No Solidity code provided' },
        { status: 400 }
      );
    }

    if (code.length > 100000) {
      return NextResponse.json(
        { success: false, error: 'Code too large (max 100KB)' },
        { status: 400 }
      );
    }

    const result: VerificationResponse = await verificationEngine.verify(code);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ code: EXAMPLE_CONTRACT });
}
