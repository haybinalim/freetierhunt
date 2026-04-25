/**
 * LLM Router Smoke Test (Hafta 1 Cumartesi)
 *
 * Run from repo root:
 *   pnpm tsx scripts/test-llm.ts                   # default: identity prompt
 *   pnpm tsx scripts/test-llm.ts json              # test JSON mode
 *   pnpm tsx scripts/test-llm.ts groq              # force a specific provider
 *
 * Prints which provider answered + token/cost metrics.
 * Exit code 0 on success, 1 on AllProvidersFailedError.
 */
import { chat, AllProvidersFailedError } from '../src/lib/llm/router';
import { getActiveProviders } from '../src/lib/llm/providers';

async function main() {
  const arg = process.argv[2];
  const wantJson = arg === 'json';
  const forceProvider = arg && arg !== 'json' ? arg : undefined;

  const active = getActiveProviders();
  if (active.length === 0) {
    console.error('❌ No active providers. Add at least one API key to .env.local:');
    console.error('   GROQ_API_KEY / OPENROUTER_API_KEY / OPENAI_API_KEY / NVIDIA_NIM_API_KEY');
    process.exit(1);
  }
  console.log('🔌 Active providers (in fallback order):');
  for (const p of active) console.log(`   ${p.priority}. ${p.name} (${p.model})`);
  console.log();

  const messages = wantJson
    ? [
        {
          role: 'system' as const,
          content: 'You are a helpful assistant. Always respond in JSON.',
        },
        {
          role: 'user' as const,
          content:
            'Return a JSON object with: tool="cursor", offer_type="trial", days=14, confidence=0.9.',
        },
      ]
    : [
        { role: 'system' as const, content: 'You are concise. One sentence answers.' },
        { role: 'user' as const, content: 'Hello, who are you? Which model is responding?' },
      ];

  console.log(
    `📤 Sending ${wantJson ? 'JSON-mode' : 'text'} request${forceProvider ? ` (forced: ${forceProvider})` : ''}...`
  );
  console.log();

  try {
    const start = Date.now();
    const result = await chat({
      messages,
      responseFormat: wantJson ? 'json' : 'text',
      temperature: wantJson ? 0.1 : 0.5,
      maxTokens: 200,
      preferredProviders: forceProvider ? [forceProvider] : undefined,
    });
    const totalMs = Date.now() - start;

    console.log('✅ Success');
    console.log(`   Provider:      ${result.provider}`);
    console.log(`   Model:         ${result.model}`);
    console.log(`   Latency:       ${result.latencyMs}ms (total ${totalMs}ms)`);
    console.log(
      `   Tokens:        ${result.promptTokens} in + ${result.completionTokens} out = ${result.tokens}`
    );
    console.log(`   Cost:          $${result.costUsd.toFixed(6)}`);
    console.log(`   Attempt index: ${result.attemptIndex}`);
    console.log();
    console.log('📥 Response:');
    console.log(result.content);
    process.exit(0);
  } catch (err) {
    if (err instanceof AllProvidersFailedError) {
      console.error('❌ All providers failed:');
      for (const a of err.attempts) {
        console.error(`   - ${a.provider}: ${a.error}`);
      }
    } else {
      console.error('❌ Unexpected error:', err);
    }
    process.exit(1);
  }
}

main();
