import { NextRequest, NextResponse } from 'next/server';

// Groq API configuration (fast inference)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

interface ModerationResult {
  approved: boolean;
  blocked: boolean;
  reason?: string;
  category?: string;
}

// Harmful content patterns for fallback detection
const HARMFUL_PATTERNS = {
  hate_speech: [
    /\b(kill|murder|exterminate|genocide)\s+(all|every|the)\s+\w+/i,
    /\b(hate|despise)\s+(all|every)\s+\w+/i,
    /\bdeath\s+to\b/i,
    /\b(n[i1]gg|f[a4]gg|k[i1]ke|sp[i1]c)\b/i,
  ],
  terrorism: [
    /\b(bomb|attack|explode|destroy)\s+(the|a)\s+(building|city|government)/i,
    /\bjihad\b/i,
    /\bterror(ist|ism)?\s+(attack|plot|cell)/i,
    /\b(isis|al.?qaeda|taliban)\s+(support|join|recruit)/i,
  ],
  violence: [
    /\b(how\s+to|ways\s+to)\s+(kill|murder|harm|hurt)\b/i,
    /\b(shoot|stab|poison)\s+(someone|people|him|her)/i,
  ],
  illegal: [
    /\b(buy|sell|make)\s+(drugs|cocaine|heroin|meth)/i,
    /\b(launder|laundering)\s+money\b/i,
    /\bchild\s+(porn|abuse|exploitation)/i,
  ],
  extremism: [
    /\b(white|black)\s+supremacy/i,
    /\bnazi\s+(party|ideology|support)/i,
    /\bfascist\s+(movement|ideology)/i,
    /\bcommunist\s+revolution/i,
    /\bviolent\s+(revolution|uprising|overthrow)/i,
  ],
};

// Fallback moderation using pattern detection
function fallbackModeration(content: string): ModerationResult {
  const lowerContent = content.toLowerCase();

  for (const [category, patterns] of Object.entries(HARMFUL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content) || pattern.test(lowerContent)) {
        return {
          approved: false,
          blocked: true,
          reason: 'Content violates community guidelines',
          category,
        };
      }
    }
  }

  return {
    approved: true,
    blocked: false,
  };
}

// Groq-powered moderation for harmful content
async function groqModeration(content: string): Promise<ModerationResult> {
  if (!GROQ_API_KEY) {
    return fallbackModeration(content);
  }

  try {
    const systemPrompt = `You are a content safety moderator. Your ONLY job is to detect and block harmful content.

BLOCK content that contains:
1. HATE_SPEECH: Racism, sexism, homophobia, religious hatred, discrimination
2. TERRORISM: Support for terrorist groups, violent extremism, radicalization
3. VIOLENCE: Threats, incitement to violence, graphic violence descriptions
4. ILLEGAL: Drug trafficking, money laundering, child exploitation
5. EXTREMISM: Political extremism (far-left/far-right), calls for violent revolution

DO NOT block:
- Normal crypto predictions and analysis
- Market opinions (bullish/bearish)
- Technical analysis discussion
- Price speculation

RESPOND WITH JSON ONLY:
{"approved": true, "blocked": false} - if content is safe
{"approved": false, "blocked": true, "reason": "brief reason", "category": "category_name"} - if harmful`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Check this content:\n\n"${content}"` },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      return fallbackModeration(content);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as ModerationResult;
      return result;
    }

    return fallbackModeration(content);
  } catch (error) {
    console.error('Groq moderation error:', error);
    return fallbackModeration(content);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ approved: true, blocked: false });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < 5) {
      return NextResponse.json({ approved: true, blocked: false });
    }

    const result = await groqModeration(trimmedContent);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Moderation API error:', error);
    // Fail open - allow content if moderation fails
    return NextResponse.json({ approved: true, blocked: false });
  }
}

export async function GET() {
  return NextResponse.json({
    groqEnabled: !!GROQ_API_KEY,
    purpose: 'Harmful content detection only',
    version: '2.0.0',
  });
}
