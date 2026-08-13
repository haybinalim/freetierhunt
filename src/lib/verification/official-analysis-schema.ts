import { z } from 'zod';

export const officialCategorySchema = z.enum([
  'ai_api',
  'cloud',
  'developer_tool',
  'observability',
  'database',
  'communication',
  'productivity',
  'other',
]);

export const officialOfferTypeSchema = z.enum(['free_tier', 'trial', 'credit', 'discount']);
export const verificationVerdictSchema = z.enum(['supported', 'partial', 'unsupported']);

export const officialOfferAnalysisSchema = z
  .object({
    category: officialCategorySchema,
    offerType: officialOfferTypeSchema,
    verdict: verificationVerdictSchema,
    confidence: z.number().int().min(0).max(100),
    evidenceQuote: z.string().min(1).max(1_000),
    eligibility: z.array(z.string().min(1).max(160)).max(12),
    regions: z.array(z.string().min(1).max(80)).max(30),
    requiresCard: z.boolean(),
    autoRenews: z.boolean(),
    durationDays: z.number().int().min(0).max(3_650).nullable(),
    valueSummary: z.string().min(1).max(300).nullable(),
    reviewReason: z.string().min(1).max(500),
  })
  .strict();

export type OfficialOfferAnalysis = z.infer<typeof officialOfferAnalysisSchema>;

export type OfficialEvidenceInput = {
  officialUrl: string;
  pageTitle: string | null;
  pageText: string;
};

export const OFFICIAL_ANALYSIS_PROMPT_VERSION = 'official-evidence-v1';

export function buildOfficialAnalysisMessages(input: OfficialEvidenceInput) {
  const evidence = input.pageText.slice(0, 12_000);
  return [
    {
      role: 'system' as const,
      content:
        'You are a conservative offer verifier. Analyze only the official provider webpage supplied by the user. Do not infer facts that are absent. Do not use any social-media, chat, or user message content. Return JSON only. The evidenceQuote must be a short exact quote from the supplied official page text. Use verdict=supported only when the page directly supports an offer; use partial when it supports some but not all material claims; use unsupported when no offer can be established. If unsure, lower confidence and use partial or unsupported.',
    },
    {
      role: 'user' as const,
      content: [
        `Official provider page title: ${input.pageTitle ?? '(not available)'}`,
        'Official page text follows:',
        evidence,
      ].join('\n\n'),
    },
  ];
}
