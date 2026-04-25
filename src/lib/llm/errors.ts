export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: string
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class RateLimitError extends LLMError {
  constructor(
    provider: string,
    public readonly retryAfterMs?: number
  ) {
    super(
      `Rate limited by ${provider}${retryAfterMs ? ` (retry after ${retryAfterMs}ms)` : ''}`,
      provider
    );
    this.name = 'RateLimitError';
  }
}

export class InvalidJsonError extends LLMError {
  constructor(
    provider: string,
    public readonly snippet: string
  ) {
    super(
      `Provider ${provider} returned non-JSON when JSON requested: ${snippet.slice(0, 120)}…`,
      provider
    );
    this.name = 'InvalidJsonError';
  }
}

export class EmptyResponseError extends LLMError {
  constructor(provider: string) {
    super(`Provider ${provider} returned empty content`, provider);
    this.name = 'EmptyResponseError';
  }
}

export class BudgetExhaustedError extends LLMError {
  constructor(
    provider: string,
    public readonly used: number,
    public readonly limit: number
  ) {
    super(
      `LLM budget exhausted: $${used.toFixed(2)} / $${limit} (provider: ${provider})`,
      provider
    );
    this.name = 'BudgetExhaustedError';
  }
}

export class AllProvidersFailedError extends Error {
  constructor(public readonly attempts: { provider: string; error: string }[]) {
    super(
      `All ${attempts.length} LLM providers failed:\n` +
        attempts.map((a) => `  - ${a.provider}: ${a.error}`).join('\n')
    );
    this.name = 'AllProvidersFailedError';
  }
}

export function isRateLimitError(err: unknown): boolean {
  if (err instanceof RateLimitError) return true;
  if (err && typeof err === 'object' && 'status' in err) {
    return (err as { status?: number }).status === 429;
  }
  return false;
}
