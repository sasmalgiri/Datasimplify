// ============================================
// AI PROVIDER MANAGEMENT
// Multi-provider support with automatic fallback
// ============================================

import { ChatMessage } from './ragWithData';

// Provider configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export type ProviderName = 'groq' | 'openai';

interface ProviderResponse {
  content: string;
  tokensUsed?: number;
  provider: ProviderName;
  model: string;
  latencyMs: number;
}

interface ProviderHealth {
  name: ProviderName;
  available: boolean;
  lastError?: string;
  lastErrorTime?: number;
  successRate: number;
  avgLatencyMs: number;
}

// Provider health tracking
const providerStats: Record<ProviderName, {
  successes: number;
  failures: number;
  totalLatency: number;
  lastError?: string;
  lastErrorTime?: number;
}> = {
  groq: { successes: 0, failures: 0, totalLatency: 0 },
  openai: { successes: 0, failures: 0, totalLatency: 0 },
};

// Cooldown period after failure (5 minutes)
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Check if a provider is available and healthy
 */
function isProviderAvailable(provider: ProviderName): boolean {
  const stats = providerStats[provider];

  // Check API key
  if (provider === 'groq' && !GROQ_API_KEY) return false;
  if (provider === 'openai' && !OPENAI_API_KEY) return false;

  // Check cooldown after failure
  if (stats.lastErrorTime) {
    const timeSinceError = Date.now() - stats.lastErrorTime;
    if (timeSinceError < FAILURE_COOLDOWN_MS) {
      // Still in cooldown, but allow if it's the only option
      return false;
    }
  }

  return true;
}

/**
 * Get ordered list of available providers
 */
function getAvailableProviders(): ProviderName[] {
  const providers: ProviderName[] = [];

  // Primary: Groq (free & fast)
  if (isProviderAvailable('groq')) {
    providers.push('groq');
  }

  // Fallback: OpenAI
  if (isProviderAvailable('openai')) {
    providers.push('openai');
  }

  // If all in cooldown, try groq anyway
  if (providers.length === 0 && GROQ_API_KEY) {
    providers.push('groq');
  }

  return providers;
}

/**
 * Call Groq API
 */
async function callGroq(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<{ content: string; tokensUsed?: number }> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens,
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<{ content: string; tokensUsed?: number }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens,
  };
}

/**
 * Chat with automatic provider fallback
 */
export async function chatWithFallback(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<ProviderResponse> {
  const providers = getAvailableProviders();

  if (providers.length === 0) {
    throw new Error('No AI providers configured. Add GROQ_API_KEY or OPENAI_API_KEY.');
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    const startTime = Date.now();

    try {
      let result: { content: string; tokensUsed?: number };
      let model: string;

      if (provider === 'groq') {
        result = await callGroq(messages, systemPrompt);
        model = GROQ_MODEL;
      } else {
        result = await callOpenAI(messages, systemPrompt);
        model = OPENAI_MODEL;
      }

      const latencyMs = Date.now() - startTime;

      // Update stats
      providerStats[provider].successes++;
      providerStats[provider].totalLatency += latencyMs;

      return {
        content: result.content,
        tokensUsed: result.tokensUsed,
        provider,
        model,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      lastError = error instanceof Error ? error : new Error(String(error));

      // Update failure stats
      providerStats[provider].failures++;
      providerStats[provider].lastError = lastError.message;
      providerStats[provider].lastErrorTime = Date.now();
      providerStats[provider].totalLatency += latencyMs;

      console.error(`Provider ${provider} failed:`, lastError.message);

      // Continue to next provider
    }
  }

  // All providers failed
  throw lastError || new Error('All AI providers failed');
}

/**
 * Get provider health status
 */
export function getProviderHealth(): ProviderHealth[] {
  const health: ProviderHealth[] = [];

  for (const name of ['groq', 'openai'] as ProviderName[]) {
    const stats = providerStats[name];
    const total = stats.successes + stats.failures;
    const successRate = total > 0 ? stats.successes / total : 1;
    const avgLatencyMs = total > 0 ? stats.totalLatency / total : 0;

    const hasApiKey = name === 'groq' ? !!GROQ_API_KEY : !!OPENAI_API_KEY;

    health.push({
      name,
      available: hasApiKey && isProviderAvailable(name),
      lastError: stats.lastError,
      lastErrorTime: stats.lastErrorTime,
      successRate: Math.round(successRate * 100),
      avgLatencyMs: Math.round(avgLatencyMs),
    });
  }

  return health;
}

/**
 * Reset provider stats (for testing)
 */
export function resetProviderStats(): void {
  for (const provider of ['groq', 'openai'] as ProviderName[]) {
    providerStats[provider] = {
      successes: 0,
      failures: 0,
      totalLatency: 0,
    };
  }
}
