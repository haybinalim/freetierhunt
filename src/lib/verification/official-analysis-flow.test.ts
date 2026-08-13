import { describe, expect, it } from 'vitest';
import { parseTelegramOfferCommand } from '@/lib/telegram/offer-parser';
import {
  buildOfficialAnalysisMessages,
  officialOfferAnalysisSchema,
} from './official-analysis-schema';
import {
  supportedOfficialAnalysis,
  syntheticOfficialPage,
  syntheticTelegramOfferCommand,
  unsupportedOfficialAnalysis,
} from './official-analysis.fixtures';
import { resolveOfficialAnalysisStatus } from './official-page-verifier';

describe('synthetic Telegram candidate to official evidence analysis flow', () => {
  it('Telegram komutundan URL adayını çıkarır fakat ham komutu model girdisine taşımaz', () => {
    const candidate = parseTelegramOfferCommand(syntheticTelegramOfferCommand);
    expect(candidate).toMatchObject({
      offerType: 'credit',
      productName: 'Example Compute',
      officialUrl: 'https://provider.example/startups',
    });

    const messages = buildOfficialAnalysisMessages({
      officialUrl: candidate?.officialUrl ?? '',
      pageTitle: syntheticOfficialPage.title,
      pageText: syntheticOfficialPage.text,
    });
    const modelInput = messages.map((message) => message.content).join('\n');

    expect(modelInput).toContain('$75 platform credit');
    expect(modelInput).not.toContain('synthetic channel command');
    expect(modelInput).not.toContain('/offer');
  });

  it('resmi sayfadaki birebir kanıt ve yüksek güven ile otomatik başarı verir', () => {
    const analysis = officialOfferAnalysisSchema.parse(supportedOfficialAnalysis);
    expect(resolveOfficialAnalysisStatus(analysis, syntheticOfficialPage.text)).toBe('succeeded');
  });

  it('desteklenmeyen karar veya resmi metinde olmayan alıntıyı insan incelemesine yönlendirir', () => {
    const unsupported = officialOfferAnalysisSchema.parse(unsupportedOfficialAnalysis);
    expect(resolveOfficialAnalysisStatus(unsupported, syntheticOfficialPage.text)).toBe(
      'needs_review'
    );

    const hallucinatedQuote = officialOfferAnalysisSchema.parse({
      ...supportedOfficialAnalysis,
      evidenceQuote: 'A claim that does not exist on the official page.',
    });
    expect(resolveOfficialAnalysisStatus(hallucinatedQuote, syntheticOfficialPage.text)).toBe(
      'needs_review'
    );
  });
});
