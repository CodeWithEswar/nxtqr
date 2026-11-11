import type { AIMessage } from "../contracts/ai-assistant.types";

export interface TokenBudgetConfig {
  maxTotalTokens: number;
  maxContextTokens: number;
  maxHistoryTokens: number;
  maxOutputTokens: number;
}

export const DEFAULT_TOKEN_BUDGET: TokenBudgetConfig = {
  maxTotalTokens: 8192,
  maxContextTokens: 4096,
  maxHistoryTokens: 2048,
  maxOutputTokens: 2048,
};

/**
 * Fast token estimation using 4 characters per token heuristic
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Truncates and budgets conversation history to stay strictly within limits.
 * Retains the latest messages while dropping older ones if budget is exceeded.
 */
export function budgetConversationHistory(
  messages: AIMessage[],
  maxTokens: number = DEFAULT_TOKEN_BUDGET.maxHistoryTokens
): AIMessage[] {
  if (!messages || messages.length === 0) return [];

  const budgeted: AIMessage[] = [];
  let tokenSum = 0;

  // Traverse from most recent to oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokenCount(msg.content);

    if (tokenSum + msgTokens > maxTokens && budgeted.length > 0) {
      break;
    }

    budgeted.unshift(msg);
    tokenSum += msgTokens;
  }

  return budgeted;
}

/**
 * Clamps a text snippet to a maximum token count.
 */
export function clampTextTokens(text: string, maxTokens: number): string {
  const estimated = estimateTokenCount(text);
  if (estimated <= maxTokens) return text;
  const suffix = "\n...[Context truncated to meet token budget]";
  const suffixChars = suffix.length;
  const maxChars = Math.max(0, maxTokens * 4 - suffixChars);
  return text.slice(0, maxChars) + suffix;
}
