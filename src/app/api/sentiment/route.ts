import { NextResponse } from 'next/server';

// Alternative.me Fear & Greed Index API (FREE)
const FEAR_GREED_API = 'https://api.alternative.me/fng/';

export async function GET() {
  try {
    const response = await fetch(FEAR_GREED_API, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }, // Cache for 5 minutes (updates once per day)
    });

    if (!response.ok) {
      console.error('Fear & Greed API error:', response.status);
      return NextResponse.json({ value: null, classification: 'Unknown' }, { status: response.status });
    }

    const result = await response.json();
    const data = result.data?.[0];

    if (!data) {
      return NextResponse.json({ value: 50, classification: 'Neutral' });
    }

    return NextResponse.json({
      value: parseInt(data.value),
      classification: data.value_classification,
      timestamp: data.timestamp,
      time_until_update: data.time_until_update,
      source: 'alternative.me',
    });

  } catch (error) {
    console.error('Sentiment API error:', error);
    return NextResponse.json({ value: 50, classification: 'Neutral', error: 'Failed to fetch' });
  }
}
