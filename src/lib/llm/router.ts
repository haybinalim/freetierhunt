import OpenAI from 'openai';
import { logger } from '../logger';
import { checkLLMBudget, estimateCostUsd } from './budget';
import {
  AllProvidersFailedError,
  EmptyResponseError,
  InvalidJsonError,
  isRateLimitError,
  LLMError,
} from './errors';
import { getActiveProviders, getProviderByName } from './providers';
import { chatParamsSchema, type ChatParams, type ChatResult, type ProviderConfig } from './types';

const RATE_LIMIT_BACKOFF_MS = 1_000;
const JSON_RETRY_LIMIT = 1;

/**
 * Smart LLM router with cascading fallback (Hafta 1 Cumartesi).
 *
 * Tries providers in priority order. Specific failures trigger:
 *   - 429 / rate limit  → wait 1s, advance to next provider
 *   - Invalid JSON      → retry once on same provider, then advance
 *   - Empty response    → advance immediately
 *   - Other errors      → log and advance
 *
 * If all providers fail, throws AllProvidersFailedError with each attempt's error.
 *
 * Budget guard (B12): paid providers checked against monthly cap before call.
 */
export async function chat(rawParams: ChatParams): Promise<ChatResult> {
  const params = chatParamsSchema.parse(rawParams);

  const providerOrder = params.preferredProviders
    ? params.preferredProviders
        .map((name) => getProviderByName(name))
        .filter((p): p is ProviderConfig => p !== undefined && p.apiKey !== undefined)
    : getActiveProviders();

  if (providerOrder.length === 0) {
    throw new Error(
      'No LLM provider available. Set at least one of GROQ_API_KEY / OPENROUTER_API_KEY / OPENAI_API_KEY / NVIDIA_NIM_API_KEY in .env.local'
    );
  }

  const attempts: { provider: string; error: string }[] = [];

  for (let i = 0; i < providerOrder.length; i++) {
    const provider = providerOrder[i];
    if (!provider) continue;
    try {
      const result = await callProvider(provider, params, i);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      attempts.push({ provider: provider.name, error: msg });
      logger.warn(
        { provider: provider.name, error: msg, attempt: i + 1, total: providerOrder.length },
        '[LLM Router] Provider failed, advancing fallback'
      );

      if (isRateLimitError(err) && i < providerOrder.length - 1) {
        await sleep(RATE_LIMIT_BACKOFF_MS);
      }
    }
  }

  throw new AllProvidersFailedError(attempts);
}

async function callProvider(
  provider: ProviderConfig,
  params: ChatParams,
  attemptIndex: number
): Promise<ChatResult> {
  if (!provider.apiKey) {
    throw new LLMError('apiKey is undefined (provider should have been filtered)', provider.name);
  }

  await checkLLMBudget(provider.name, provider.isFree);

  const client = new OpenAI({ apiKey: provider.apiKey, baseURL: provider.baseURL });
  const wantsJson = params.responseFormat === 'json';

  let lastJsonError: InvalidJsonError | undefined;

  for (let jsonAttempt = 0; jsonAttempt <= JSON_RETRY_LIMIT; jsonAttempt++) {
    const start = Date.now();
    const response = await client.chat.completions.create({
      model: provider.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.2,
      max_tokens: params.maxTokens ?? 2000,
      ...(wantsJson ? { response_format: { type: 'json_object' as const } } : {}),
    });
    const latencyMs = Date.now() - start;

    const choice = response.choices[0];
    const content = choice?.message?.content;
    if (!content) throw new EmptyResponseError(provider.name);

    if (wantsJson) {
      try {
        JSON.parse(content);
      } catch {
        lastJsonError = new InvalidJsonError(provider.name, content);
        if (jsonAttempt < JSON_RETRY_LIMIT) {
          logger.info(
            { provider: provider.name, attempt: jsonAttempt + 1 },
            '[LLM Router] Invalid JSON, retrying same provider'
          );
          continue;
        }
        throw lastJsonError;
      }
    }

    const promptTokens = response.usage?.prompt_tokens ?? 0;
    const completionTokens = response.usage?.completion_tokens ?? 0;
    const totalTokens = response.usage?.total_tokens ?? promptTokens + completionTokens;
    const costUsd = estimateCostUsd(
      promptTokens,
      completionTokens,
      provider.inputCostPerMillion,
      provider.outputCostPerMillion
    );

    logger.info(
      {
        provider: provider.name,
        model: provider.model,
        tokens: totalTokens,
        latencyMs,
        costUsd: costUsd.toFixed(6),
        attemptIndex,
      },
      '[LLM Router] Call success'
    );

    return {
      content,
      model: `${provider.name}:${provider.model}`,
      provider: provider.name,
      tokens: totalTokens,
      promptTokens,
      completionTokens,
      costUsd,
      latencyMs,
      attemptIndex,
    };
  }

  // Unreachable, but TS needs it
  throw lastJsonError ?? new LLMError('Exhausted JSON retries', provider.name);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Re-exports for convenient consumer imports
export type { ChatMessage, ChatParams, ChatResult } from './types';
export {
  AllProvidersFailedError,
  BudgetExhaustedError,
  EmptyResponseError,
  InvalidJsonError,
  LLMError,
  RateLimitError,
} from './errors';
