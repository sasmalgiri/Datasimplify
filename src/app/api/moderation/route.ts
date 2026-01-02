import { NextRequest, NextResponse } from 'next/server';

// Groq API configuration (fast inference)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

interface ModerationResult {
  approved: boolean;
  flagged: boolean;
  categories: {
    spam: boolean;
    hate_speech: boolean;
    scam: boolean;
    manipulation: boolean;
    harassment: boolean;
    illegal: boolean;
    low_quality: boolean;
  };
  reason?: string;
  suggestions?: string[];
  confidence: number;
}

// Fallback moderation using keyword detection
function fallbackModeration(content: string): ModerationResult {
  const lowerContent = content.toLowerCase();

  // Prohibited keywords/patterns
  const spamPatterns = [
    /buy now/i, /limited time/i, /act fast/i, /guaranteed profit/i,
    /100x gains/i, /moonshot/i, /to the moon/i, /easy money/i,
    /(.)\1{4,}/i, // Repeated characters (e.g., "MOOOOON")
  ];

  const scamPatterns = [
    /send.*wallet/i, /private key/i, /seed phrase/i, /double your/i,
    /free crypto/i, /airdrop.*click/i, /connect wallet/i,
    /telegram.*group/i, /whatsapp.*group/i, /dm me/i,
  ];

  const hatePatterns = [
    // General hate speech indicators (keeping it generic)
    /\b(hate|kill|die|death to)\b.*\b(all|every)\b/i,
  ];

  const manipulationPatterns = [
    /pump.*dump/i, /coordinated.*buy/i, /everyone.*buy/i,
    /let's.*pump/i, /group.*buy/i,
  ];

  const lowQualityPatterns = [
    /^.{0,20}$/, // Too short (less than 20 chars)
    /^[A-Z\s!]+$/, // All caps
    /!{3,}/, // Multiple exclamation marks
  ];

  const categories = {
    spam: spamPatterns.some(p => p.test(content)),
    hate_speech: hatePatterns.some(p => p.test(content)),
    scam: scamPatterns.some(p => p.test(content)),
    manipulation: manipulationPatterns.some(p => p.test(content)),
    harassment: false,
    illegal: false,
    low_quality: lowQualityPatterns.some(p => p.test(content)),
  };

  const flagged = Object.values(categories).some(v => v);

  const reasons: string[] = [];
  if (categories.spam) reasons.push('Contains spam-like content');
  if (categories.scam) reasons.push('Contains potential scam indicators');
  if (categories.hate_speech) reasons.push('Contains potentially harmful language');
  if (categories.manipulation) reasons.push('Appears to promote market manipulation');
  if (categories.low_quality) reasons.push('Content quality is too low');

  const suggestions: string[] = [];
  if (categories.low_quality) suggestions.push('Add more detail and analysis to your prediction');
  if (categories.spam) suggestions.push('Remove promotional language and focus on analysis');
  if (categories.manipulation) suggestions.push('Rephrase to share your opinion without coordinating buying');

  return {
    approved: !flagged,
    flagged,
    categories,
    reason: reasons.join('; ') || undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    confidence: 0.7, // Lower confidence for fallback
  };
}

// Groq-powered moderation (using Llama or Mixtral for fast inference)
async function groqModeration(content: string, coinSymbol?: string): Promise<ModerationResult> {
  if (!GROQ_API_KEY) {
    console.log('Groq API key not configured, using fallback moderation');
    return fallbackModeration(content);
  }

  try {
    const systemPrompt = `You are a content moderator for a cryptocurrency prediction community. Your job is to review user-submitted predictions and determine if they violate community guidelines.

GUIDELINES TO CHECK:
1. SPAM: Excessive promotional content, repeated posts, irrelevant content
2. SCAM: Phishing links, requests for private keys/seed phrases, "double your crypto" schemes
3. HATE_SPEECH: Content promoting hatred based on race, religion, gender, etc.
4. MANIPULATION: Pump-and-dump schemes, coordinated buying/selling calls
5. HARASSMENT: Personal attacks, threats, bullying
6. ILLEGAL: Money laundering discussion, tax evasion advice, illegal activities
7. LOW_QUALITY: Extremely short posts, all caps, no actual analysis

RESPONSE FORMAT (JSON only):
{
  "approved": boolean,
  "flagged": boolean,
  "categories": {
    "spam": boolean,
    "hate_speech": boolean,
    "scam": boolean,
    "manipulation": boolean,
    "harassment": boolean,
    "illegal": boolean,
    "low_quality": boolean
  },
  "reason": "string explaining issues if flagged",
  "suggestions": ["array of suggestions to improve if flagged"],
  "confidence": number between 0 and 1
}`;

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
          {
            role: 'user',
            content: `Review this crypto prediction${coinSymbol ? ` for ${coinSymbol}` : ''}:\n\n"${content}"\n\nRespond with JSON only.`
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
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
    const { content, coinSymbol, useGrok = true } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Trim and check minimum length
    const trimmedContent = content.trim();
    if (trimmedContent.length < 10) {
      return NextResponse.json({
        approved: false,
        flagged: true,
        categories: {
          spam: false,
          hate_speech: false,
          scam: false,
          manipulation: false,
          harassment: false,
          illegal: false,
          low_quality: true,
        },
        reason: 'Content is too short. Please provide more detail.',
        suggestions: ['Add your reasoning and analysis for this prediction'],
        confidence: 1.0,
      });
    }

    // Use Groq if enabled and API key is available, otherwise fallback
    const result = useGrok
      ? await groqModeration(trimmedContent, coinSymbol)
      : fallbackModeration(trimmedContent);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Moderation API error:', error);
    return NextResponse.json(
      { error: 'Moderation check failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if Groq moderation is available
export async function GET() {
  return NextResponse.json({
    groqEnabled: !!GROQ_API_KEY,
    fallbackEnabled: true,
    version: '1.0.0',
  });
}
