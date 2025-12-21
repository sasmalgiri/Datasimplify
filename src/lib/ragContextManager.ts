// ============================================
// RAG CONTEXT WINDOW MANAGEMENT
// Smart truncation for long conversations
// ============================================

import { ChatMessage } from './ragWithData';

// Token limits (approximate - 1 token ≈ 4 chars)
const MAX_CONTEXT_TOKENS = 8000; // Leave room for system prompt and response
const MAX_MESSAGE_TOKENS = 2000; // Max per individual message
const CHARS_PER_TOKEN = 4;

/**
 * Estimate token count for text
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Truncate text to max tokens while keeping meaning
 */
function truncateText(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;

  if (text.length <= maxChars) return text;

  // Try to truncate at sentence boundary
  const truncated = text.slice(0, maxChars);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );

  if (lastSentenceEnd > maxChars * 0.7) {
    return truncated.slice(0, lastSentenceEnd + 1) + ' [truncated]';
  }

  // Fallback: truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxChars * 0.8) {
    return truncated.slice(0, lastSpace) + '... [truncated]';
  }

  return truncated + '... [truncated]';
}

/**
 * Summarize a message for context retention
 */
function summarizeMessage(message: ChatMessage): ChatMessage {
  const tokens = estimateTokens(message.content);

  if (tokens <= MAX_MESSAGE_TOKENS) {
    return message;
  }

  return {
    ...message,
    content: truncateText(message.content, MAX_MESSAGE_TOKENS),
  };
}

/**
 * Manage conversation history to fit context window
 * Strategy: Keep recent messages, summarize old ones
 */
export function manageContextWindow(
  history: ChatMessage[],
  systemPromptTokens: number = 1500
): ChatMessage[] {
  if (history.length === 0) return [];

  // Calculate available tokens
  const availableTokens = MAX_CONTEXT_TOKENS - systemPromptTokens;
  let usedTokens = 0;
  const result: ChatMessage[] = [];

  // Process from most recent to oldest
  for (let i = history.length - 1; i >= 0; i--) {
    const message = summarizeMessage(history[i]);
    const messageTokens = estimateTokens(message.content);

    if (usedTokens + messageTokens > availableTokens) {
      // Can't fit more messages
      if (i > 0) {
        // Add a summary of skipped context
        const skippedCount = i + 1;
        result.unshift({
          role: 'system',
          content: `[${skippedCount} earlier messages summarized: The conversation discussed crypto market analysis and predictions.]`,
        });
      }
      break;
    }

    usedTokens += messageTokens;
    result.unshift(message);
  }

  return result;
}

/**
 * Get conversation summary for long chats
 */
export function getConversationSummary(history: ChatMessage[]): string {
  if (history.length === 0) return 'No previous conversation.';

  // Extract key topics
  const topics = new Set<string>();
  const coinPattern = /\b(BTC|ETH|SOL|XRP|ADA|DOGE|bitcoin|ethereum|solana)\b/gi;

  for (const message of history) {
    const matches = message.content.match(coinPattern);
    if (matches) {
      matches.forEach(m => topics.add(m.toUpperCase()));
    }
  }

  // Count message types
  const userMessages = history.filter(m => m.role === 'user').length;
  const assistantMessages = history.filter(m => m.role === 'assistant').length;

  let summary = `Previous conversation: ${userMessages} questions, ${assistantMessages} responses.`;

  if (topics.size > 0) {
    summary += ` Topics discussed: ${Array.from(topics).slice(0, 5).join(', ')}.`;
  }

  return summary;
}

/**
 * Check if context window is near limit
 */
export function isContextNearLimit(history: ChatMessage[]): boolean {
  const totalTokens = history.reduce(
    (sum, msg) => sum + estimateTokens(msg.content),
    0
  );

  return totalTokens > MAX_CONTEXT_TOKENS * 0.8;
}

/**
 * Get context usage stats
 */
export function getContextStats(history: ChatMessage[]): {
  messageCount: number;
  totalTokens: number;
  usagePercent: number;
  remainingTokens: number;
} {
  const totalTokens = history.reduce(
    (sum, msg) => sum + estimateTokens(msg.content),
    0
  );

  return {
    messageCount: history.length,
    totalTokens,
    usagePercent: Math.round((totalTokens / MAX_CONTEXT_TOKENS) * 100),
    remainingTokens: Math.max(0, MAX_CONTEXT_TOKENS - totalTokens),
  };
}
