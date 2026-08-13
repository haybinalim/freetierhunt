import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { llmCalls, officialPageAnalyses, submissions } from '@/lib/db/schema';
import { chat } from '@/lib/llm/router';
import { OfficialHttpAdapter } from '@/lib/sources/official-http-adapter';
import type { SourceRecord } from '@/lib/sources/types';
import {
  buildOfficialAnalysisMessages,
  OFFICIAL_ANALYSIS_PROMPT_VERSION,
  officialOfferAnalysisSchema,
  type OfficialOfferAnalysis,
} from './official-analysis-schema';

function stripMarkup(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPageTitle(html: string): string | null {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1] ? stripMarkup(match[1]).slice(0, 500) : '';
  return title || null;
}

function quoteAppearsInEvidence(quote: string, pageText: string): boolean {
  const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
  return normalize(pageText).includes(normalize(quote));
}

function createSourceRecord(url: string): SourceRecord {
  const parsed = new URL(url);
  return {
    id: 0,
    name: 'Official verification page',
    type: 'official',
    status: 'active',
    baseUrl: parsed.toString(),
    canonicalDomain: parsed.hostname.replace(/^www\./, '').toLowerCase(),
    allowAutomatedSync: false,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  };
}

export type VerifySubmissionResult = {
  status: 'succeeded' | 'needs_review' | 'failed';
  analysis?: OfficialOfferAnalysis;
  reason?: string;
};

/**
 * Runs an LLM only over fetched official-provider HTML. It does not pass Telegram
 * message content, Telegram identifiers or social metadata to the model.
 */
export async function verifySubmissionFromOfficialPage(
  submissionId: number
): Promise<VerifySubmissionResult> {
  const [submission] = await db
    .select({ sourceUrl: submissions.sourceUrl, website: submissions.website })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  const officialUrl = submission?.sourceUrl ?? submission?.website;
  if (!officialUrl) return { status: 'failed', reason: 'Submission has no official URL' };

  const now = new Date();
  await db
    .insert(officialPageAnalyses)
    .values({ submissionId, officialUrl, status: 'pending', createdAt: now })
    .onConflictDoUpdate({
      target: officialPageAnalyses.submissionId,
      set: { status: 'pending', errorMessage: null, completedAt: null, officialUrl },
    });

  const fetched = await new OfficialHttpAdapter().fetch(createSourceRecord(officialUrl));
  if (fetched.status !== 'succeeded' || !fetched.body) {
    const reason = fetched.errorMessage ?? 'Official page could not be fetched';
    await db
      .update(officialPageAnalyses)
      .set({ status: 'failed', errorMessage: reason, completedAt: new Date() })
      .where(eq(officialPageAnalyses.submissionId, submissionId));
    return { status: 'failed', reason };
  }

  const pageText = stripMarkup(fetched.body).slice(0, 20_000);
  if (pageText.length < 80) {
    const reason = 'Official page did not contain enough readable text for verification';
    await db
      .update(officialPageAnalyses)
      .set({ status: 'needs_review', reviewReason: reason, completedAt: new Date() })
      .where(eq(officialPageAnalyses.submissionId, submissionId));
    return { status: 'needs_review', reason };
  }

  try {
    const result = await chat({
      messages: buildOfficialAnalysisMessages({
        officialUrl,
        pageTitle: extractPageTitle(fetched.body),
        pageText,
      }),
      temperature: 0,
      maxTokens: 1_200,
      responseFormat: 'json',
    });
    const analysis = officialOfferAnalysisSchema.parse(JSON.parse(result.content));
    const quoteIsVerbatim = quoteAppearsInEvidence(analysis.evidenceQuote, pageText);
    const status =
      analysis.verdict === 'supported' && analysis.confidence >= 80 && quoteIsVerbatim
        ? 'succeeded'
        : 'needs_review';
    const reviewReason = !quoteIsVerbatim
      ? 'Model evidence quote was not found verbatim on the official page'
      : analysis.verdict !== 'supported'
        ? `Official evidence verdict: ${analysis.verdict}`
        : analysis.confidence < 80
          ? 'Confidence is below automatic verification threshold'
          : analysis.reviewReason;

    await db
      .update(officialPageAnalyses)
      .set({
        status,
        category: analysis.category,
        offerType: analysis.offerType,
        confidence: analysis.confidence,
        evidenceQuote: analysis.evidenceQuote,
        structuredClaims: {
          verdict: analysis.verdict,
          eligibility: analysis.eligibility,
          regions: analysis.regions,
          requiresCard: analysis.requiresCard,
          autoRenews: analysis.autoRenews,
          durationDays: analysis.durationDays,
          valueSummary: analysis.valueSummary,
        },
        reviewReason,
        model: result.model,
        promptVersion: OFFICIAL_ANALYSIS_PROMPT_VERSION,
        inputHash: createHash('sha256').update(pageText).digest('hex'),
        costUsd: result.costUsd.toFixed(6),
        completedAt: new Date(),
      })
      .where(eq(officialPageAnalyses.submissionId, submissionId));

    await db.insert(llmCalls).values({
      provider: result.provider,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      costUsd: result.costUsd.toFixed(6),
      success: true,
      latencyMs: result.latencyMs,
      metadata: { kind: 'official_page_analysis', submissionId },
    });

    return { status, analysis, reason: reviewReason };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Official page analysis failed';
    await db
      .update(officialPageAnalyses)
      .set({ status: 'failed', errorMessage: reason, completedAt: new Date() })
      .where(eq(officialPageAnalyses.submissionId, submissionId));
    await db.insert(llmCalls).values({
      provider: 'router',
      model: 'official-page-analysis',
      success: false,
      errorMessage: reason,
      metadata: { kind: 'official_page_analysis', submissionId },
    });
    return { status: 'failed', reason };
  }
}
