import { z } from 'zod';

export const chatRoleSchema = z.enum(['system', 'user', 'assistant']);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string().min(1),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatParamsSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(8192).optional(),
  responseFormat: z.enum(['json', 'text']).optional(),
  /** Override automatic provider order. Useful for tests. */
  preferredProviders: z.array(z.string()).optional(),
});
export type ChatParams = z.infer<typeof chatParamsSchema>;

export interface ChatResult {
  content: string;
  /** "groq:llama-3.3-70b-versatile" */
  model: string;
  /** Provider key (e.g. "groq", "openrouter") */
  provider: string;
  /** Total tokens including prompt + completion */
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  /** Estimated cost in USD (0 for free tiers) */
  costUsd: number;
  latencyMs: number;
  /** How many fallbacks happened before this provider succeeded */
  attemptIndex: number;
}

export interface ProviderConfig {
  name: string;
  /** Display order priority (lower = tried earlier) */
  priority: number;
  /** API key from env, undefined → provider skipped */
  apiKey: string | undefined;
  /** Custom OpenAI baseURL, undefined = official OpenAI */
  baseURL?: string;
  model: string;
  /** USD per 1M input tokens — used for budget tracking (B12) */
  inputCostPerMillion: number;
  /** USD per 1M output tokens */
  outputCostPerMillion: number;
  /** Skip budget check (free tiers) */
  isFree: boolean;
}
