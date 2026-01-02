export interface ModerationResult {
  approved: boolean;
  blocked: boolean;
  reason?: string;
  category?:
    | 'hate_speech'
    | 'harassment'
    | 'violence'
    | 'self_harm'
    | 'sexual'
    | 'terrorism'
    | 'illegal'
    | 'personal_data';
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Harmful content patterns for fallback detection (simple heuristic).
// This is not exhaustive; it exists as a safety net when LLM moderation is unavailable.
const HARMFUL_PATTERNS: Record<NonNullable<ModerationResult['category']>, RegExp[]> = {
  hate_speech: [
    /\b(kill|murder|exterminate|genocide)\s+(all|every|the)\s+\w+/i,
    /\b(hate|despise)\s+(all|every)\s+\w+/i,
    /\bdeath\s+to\b/i,
    /\b(n[i1]gg|f[a4]gg|k[i1]ke|sp[i1]c)\b/i,
  ],
  harassment: [
    /\b(go\s+die|you\s+should\s+die)\b/i,
    /\b(i\s+will\s+find\s+you|doxx|doxxing)\b/i,
    /\b(rape\s+you|kill\s+you)\b/i,
  ],
  violence: [
    /\b(how\s+to|ways\s+to)\s+(kill|murder|harm|hurt)\b/i,
    /\b(shoot|stab|poison)\s+(someone|people|him|her|them)\b/i,
  ],
  self_harm: [
    /\b(how\s+to\s+kill\s+myself|i\s+want\s+to\s+die|suicide\s+note)\b/i,
  ],
  sexual: [
    /\bchild\s+(porn|abuse|exploitation)\b/i,
  ],
  terrorism: [
    /\b(bomb|attack|explode|destroy)\s+(the|a)\s+(building|city|government)\b/i,
    /\b(jihad|terror(ist|ism)?)\b/i,
    /\b(isis|al.?qaeda|taliban)\s+(support|join|recruit)\b/i,
  ],
  illegal: [
    /\b(buy|sell|make)\s+(drugs|cocaine|heroin|meth)\b/i,
    /\b(launder|laundering)\s+money\b/i,
  ],
  personal_data: [
    /\b(ssn|social\s+security\s+number)\b/i,
    /\b(passport\s+number|credit\s+card\s+number)\b/i,
  ],
};

export function fallbackModeration(content: string): ModerationResult {
  const text = content || '';
  for (const [category, patterns] of Object.entries(HARMFUL_PATTERNS) as Array<[
    NonNullable<ModerationResult['category']>,
    RegExp[],
  ]>) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return {
          approved: false,
          blocked: true,
          reason: 'Content violates community guidelines',
          category,
        };
      }
    }
  }

  return { approved: true, blocked: false };
}

function parseModerationJson(text: string): ModerationResult | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]) as Partial<ModerationResult>;
    if (typeof parsed.approved !== 'boolean' || typeof parsed.blocked !== 'boolean') return null;
    return {
      approved: parsed.approved,
      blocked: parsed.blocked,
      reason: typeof parsed.reason === 'string' ? parsed.reason : undefined,
      category: parsed.category as ModerationResult['category'],
    };
  } catch {
    return null;
  }
}

export async function moderateContent(content: string): Promise<ModerationResult> {
  const trimmed = (content || '').trim();
  if (trimmed.length < 5) return { approved: true, blocked: false };

  if (!GROQ_API_KEY) {
    return fallbackModeration(trimmed);
  }

  const systemPrompt = `You are a content safety moderator for a crypto community.

Goal: BLOCK only clearly unsafe content.

BLOCK content that includes any of the following:
1) HATE_SPEECH: slurs or targeted hate against protected groups
2) HARASSMENT: personal attacks, threats, incitement, stalking/doxxing
3) VIOLENCE: threats or instructions to harm others
4) SELF_HARM: encouragement or instructions for self-harm or suicide
5) SEXUAL: sexual content involving minors (always block)
6) TERRORISM: praise/support/recruitment for terrorist or violent extremist groups
7) ILLEGAL: instructions or facilitation for serious illegal wrongdoing (e.g., money laundering, drug trafficking)
8) PERSONAL_DATA: sharing someone else's sensitive personal data (doxxing)

DO NOT block:
- Normal crypto predictions/analysis, hype, memes (even if aggressive language like "this coin will kill it")
- Discussion of news, regulation, or politics if non-violent and not hateful
- General criticism of projects/ideas (without personal attacks)

Return JSON ONLY. Use this schema:
{"approved": true, "blocked": false}
or
{"approved": false, "blocked": true, "reason": "brief reason", "category": "hate_speech|harassment|violence|self_harm|sexual|terrorism|illegal|personal_data"}`;

  try {
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
          { role: 'user', content: `Check this content:\n\n"${trimmed}"` },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      return fallbackModeration(trimmed);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    const parsed = parseModerationJson(responseText);
    return parsed ?? fallbackModeration(trimmed);
  } catch {
    return fallbackModeration(trimmed);
  }
}
