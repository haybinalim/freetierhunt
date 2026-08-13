export const syntheticTelegramOfferCommand =
  '/offer credit | Example Compute | $75 builder credit | https://provider.example/startups | This text is a synthetic channel command and must never be sent to the model.';

export const syntheticOfficialPage = {
  title: 'Example Compute startup credits',
  text: [
    'Example Compute offers verified early-stage startups a $75 platform credit.',
    'The credit is available for 90 days after approval and can be used for compute services.',
    'Applicants must be registered startups. A payment card is not required to apply.',
    'This promotion does not renew automatically after the credit period ends.',
  ].join(' '),
};

export const supportedOfficialAnalysis = {
  category: 'cloud' as const,
  offerType: 'credit' as const,
  verdict: 'supported' as const,
  confidence: 91,
  evidenceQuote: 'Example Compute offers verified early-stage startups a $75 platform credit.',
  eligibility: ['Registered early-stage startup'],
  regions: ['Global'],
  requiresCard: false,
  autoRenews: false,
  durationDays: 90,
  valueSummary: '$75 platform credit',
  reviewReason: 'The official page explicitly states the credit, audience and duration.',
};

export const unsupportedOfficialAnalysis = {
  ...supportedOfficialAnalysis,
  verdict: 'unsupported' as const,
  confidence: 35,
  evidenceQuote: 'This promotion does not renew automatically after the credit period ends.',
  reviewReason: 'The official page text does not establish the claimed offer.',
};
