import { env } from '../env';
import type { ProviderConfig } from './types';

/**
 * Provider chain — tried in priority order.
 * Plan order (Hafta 1 Cumartesi):
 *   1. Groq         — fastest, free tier 14k req/day
 *   2. OpenRouter   — secondary, free models
 *   3. OpenAI       — paid fallback (budget guard via B12)
 *   4. NVIDIA NIM   — backup, free credits
 *
 * Pricing reference (Oct 2025, USD per 1M tokens):
 *   - groq llama-3.3-70b: free
 *   - openrouter llama-3.1-405b:free: free
 *   - openai gpt-4o-mini: $0.15 input / $0.60 output
 *   - nvidia nim llama-3.1-405b: free (build credits)
 */
export const PROVIDERS: ProviderConfig[] = [
  {
    name: 'groq',
    priority: 1,
    apiKey: env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    inputCostPerMillion: 0,
    outputCostPerMillion: 0,
    isFree: true,
  },
  {
    name: 'openrouter',
    priority: 2,
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.1-405b-instruct:free',
    inputCostPerMillion: 0,
    outputCostPerMillion: 0,
    isFree: true,
  },
  {
    name: 'openai',
    priority: 3,
    apiKey: env.OPENAI_API_KEY,
    baseURL: undefined,
    model: 'gpt-4o-mini',
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.6,
    isFree: false,
  },
  {
    name: 'nvidia-nim',
    priority: 4,
    apiKey: env.NVIDIA_NIM_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
    model: 'meta/llama-3.1-405b-instruct',
    inputCostPerMillion: 0,
    outputCostPerMillion: 0,
    isFree: true,
  },
];

export function getActiveProviders(): ProviderConfig[] {
  return PROVIDERS.filter((p) => p.apiKey).sort((a, b) => a.priority - b.priority);
}

export function getProviderByName(name: string): ProviderConfig | undefined {
  return PROVIDERS.find((p) => p.name === name);
}
