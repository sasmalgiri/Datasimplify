import { NextRequest, NextResponse } from 'next/server';

import { moderateContent } from '@/lib/moderation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content = body?.content;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ approved: true, blocked: false });
    }

    const result = await moderateContent(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Moderation API error:', error);
    // Safer fallback (do not blindly fail-open on unexpected errors)
    return NextResponse.json({ approved: false, blocked: true, reason: 'Moderation unavailable' }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({
    groqEnabled: !!process.env.GROQ_API_KEY,
    purpose: 'Harmful content detection only',
    version: '2.1.0',
  });
}
