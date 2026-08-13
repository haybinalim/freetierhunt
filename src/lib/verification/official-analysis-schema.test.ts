import { describe, expect, it } from 'vitest';
import {
  buildOfficialAnalysisMessages,
  officialOfferAnalysisSchema,
} from './official-analysis-schema';

describe('buildOfficialAnalysisMessages', () => {
  it('model girdisine sadece resmi sayfa başlığı ve metnini taşır', () => {
    const messages = buildOfficialAnalysisMessages({
      officialUrl: 'https://provider.example/private-campaign-path',
      pageTitle: 'Official Free Tier',
      pageText: 'The official free tier includes 1,000 requests per month.',
    });

    expect(messages[1]?.content).toContain('Official Free Tier');
    expect(messages[1]?.content).toContain('1,000 requests');
    expect(messages[1]?.content).not.toContain('private-campaign-path');
  });
});

describe('officialOfferAnalysisSchema', () => {
  const valid = {
    category: 'developer_tool',
    offerType: 'free_tier',
    verdict: 'supported',
    confidence: 92,
    evidenceQuote: 'The official free tier includes 1,000 requests per month.',
    eligibility: ['New accounts'],
    regions: ['Global'],
    requiresCard: false,
    autoRenews: false,
    durationDays: null,
    valueSummary: '1,000 requests/month',
    reviewReason: 'Direct offer language found on the official page.',
  };

  it('geçerli, yapılandırılmış resmi kanıt analizini kabul eder', () => {
    expect(officialOfferAnalysisSchema.parse(valid)).toMatchObject({ confidence: 92 });
  });

  it('ek alanları ve geçersiz güven puanını reddeder', () => {
    expect(() => officialOfferAnalysisSchema.parse({ ...valid, confidence: 101 })).toThrow();
    expect(() =>
      officialOfferAnalysisSchema.parse({ ...valid, hallucinated: 'not allowed' })
    ).toThrow();
  });
});
