import { logger } from '../logger';
import { BudgetExhaustedError } from './errors';

/**
 * LLM Cost Guard (audit fix B12).
 *
 * Hard caps on paid LLM spend so a runaway loop or quota burst can't blow the budget.
 *
 * Default policy:
 *   - Free providers (Groq, OpenRouter free tier, NVIDIA NIM) → no budget check
 *   - Paid providers (OpenAI direct) → hard limit $5/month, soft alarm at $4
 *
 * Hafta 2 will wire this to `llm_calls` table for real spend aggregation.
 * Until then, returns 0 to allow boot — but logs a warning so we don't forget.
 */

const HARD_LIMIT_USD = 5;
const SOFT_LIMIT_USD = 4;
const CACHE_TTL_MS = 5 * 60 * 1000;

interface BudgetCache {
  totalUsd: number;
  checkedAt: number;
}

let cache: BudgetCache | null = null;

/**
 * Returns total LLM cost (USD) spent this calendar month.
 *
 * TODO Hafta 2: replace stub with `db.select(sum(llmCalls.costUsd)).where(...)`.
 * Until then this returns 0 — paired with a one-shot warn so we notice if it
 * ever ships to production without a real implementation.
 */
async function getMonthlyLLMCost(): Promise<number> {
  if (cache && Date.now() - cache.checkedAt < CACHE_TTL_MS) {
    return cache.totalUsd;
  }

  // 🟡 STUB — Hafta 2 implements DB query
  if (!cache) {
    logger.warn(
      '[LLM Budget] Cost tracking is stubbed (returns 0). Wire to llm_calls table in Hafta 2.'
    );
  }

  const totalUsd = 0;
  cache = { totalUsd, checkedAt: Date.now() };
  return totalUsd;
}

export async function checkLLMBudget(provider: string, isFree: boolean): Promise<void> {
  if (isFree) return;

  const used = await getMonthlyLLMCost();

  if (used >= HARD_LIMIT_USD) {
    logger.error({ provider, used, limit: HARD_LIMIT_USD }, '[LLM Budget] Hard limit reached');
    throw new BudgetExhaustedError(provider, used, HARD_LIMIT_USD);
  }

  if (used >= SOFT_LIMIT_USD) {
    logger.warn(
      { provider, used, softLimit: SOFT_LIMIT_USD, hardLimit: HARD_LIMIT_USD },
      '[LLM Budget] Soft alarm — consider switching to free providers'
    );
  }
}

/**
 * Compute USD cost for a single call.
 * Tokens are typically 1.3× word count; pricing is per million tokens.
 */
export function estimateCostUsd(
  promptTokens: number,
  completionTokens: number,
  inputCostPerMillion: number,
  outputCostPerMillion: number
): number {
  const inputCost = (promptTokens / 1_000_000) * inputCostPerMillion;
  const outputCost = (completionTokens / 1_000_000) * outputCostPerMillion;
  return inputCost + outputCost;
}

/** Reset cache — used by tests / DB-backed implementation when fresh read needed. */
export function _resetBudgetCache() {
  cache = null;
}
