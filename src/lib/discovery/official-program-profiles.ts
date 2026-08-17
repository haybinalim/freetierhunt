import type { SourceRecord } from '@/lib/sources/types';
import type { DiscoveryCandidateDraft, DiscoveryProfile, SourceObservationInput } from './types';

function canonicalText(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function quoteContaining(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match?.[0] ? canonicalText(match[0]) : null;
}

function isOfficialDomain(source: SourceRecord, expectedDomain: string): boolean {
  if (source.type !== 'official') return false;
  try {
    const hostname = new URL(source.baseUrl).hostname.toLowerCase();
    return hostname === expectedDomain || hostname.endsWith(`.${expectedDomain}`);
  } catch {
    return false;
  }
}

function candidate(
  input: Omit<DiscoveryCandidateDraft, 'officialUrl'>,
  observation: SourceObservationInput
): DiscoveryCandidateDraft {
  return { ...input, officialUrl: observation.url };
}

const googleCloudStartupProfile: DiscoveryProfile = {
  key: 'google-cloud-startup-v1',
  matches: (source) => isOfficialDomain(source, 'cloud.google.com'),
  extract(source, observation) {
    const text = canonicalText(observation.excerpt);
    const quote = quoteContaining(
      text,
      /Early stage startups can get up to \$350,000 in Cloud credits through the Google for Startups Cloud Program\.?/i
    );
    if (!quote) return [];

    return [
      candidate(
        {
          headline: 'Google for Startups: up to $350,000 Cloud credits',
          offerType: 'credit',
          value: 'Up to $350,000 in Cloud credits',
          evidenceQuote: quote,
          structuredClaims: {
            program: 'Google for Startups Cloud Program',
            audience: ['Early-stage startups'],
            provider: source.name,
          },
          discoveryMethod: 'official-program-profile:google-cloud-startup-v1',
          priority: 90,
        },
        observation
      ),
    ];
  },
};

const awsActivateProfile: DiscoveryProfile = {
  key: 'aws-activate-v1',
  matches: (source) => isOfficialDomain(source, 'aws.amazon.com'),
  extract(source, observation) {
    const text = canonicalText(observation.excerpt);
    const quote = quoteContaining(
      text,
      /Apply for up to \$200,000 in AWS Activate Credits, with additional credits available for AI startups ready to scale\.?/i
    );
    if (!quote) return [];

    return [
      candidate(
        {
          headline: 'AWS Activate: up to $200,000 in startup credits',
          offerType: 'credit',
          value: 'Up to $200,000 in AWS Activate Credits',
          evidenceQuote: quote,
          structuredClaims: {
            program: 'AWS Activate',
            audience: ['Pre-seed to pre-Series B startups'],
            provider: source.name,
          },
          discoveryMethod: 'official-program-profile:aws-activate-v1',
          priority: 90,
        },
        observation
      ),
    ];
  },
};

const cloudflareStartupProfile: DiscoveryProfile = {
  key: 'cloudflare-startups-v1',
  matches: (source) => isOfficialDomain(source, 'cloudflare.com'),
  extract(source, observation) {
    const text = canonicalText(observation.excerpt);
    const quote = quoteContaining(
      text,
      /Cloudflare for Startups gives early-stage companies up to \$350k in credits to build the next big idea\.?/i
    );
    if (!quote) return [];

    return [
      candidate(
        {
          headline: 'Cloudflare for Startups: up to $350,000 in credits',
          offerType: 'credit',
          value: 'Up to $350,000 in credits',
          evidenceQuote: quote,
          structuredClaims: {
            program: 'Cloudflare for Startups',
            audience: ['Early-stage companies'],
            provider: source.name,
          },
          discoveryMethod: 'official-program-profile:cloudflare-startups-v1',
          priority: 90,
        },
        observation
      ),
    ];
  },
};

export const officialProgramProfiles: DiscoveryProfile[] = [
  googleCloudStartupProfile,
  awsActivateProfile,
  cloudflareStartupProfile,
];

export function discoverOfficialProgramCandidates(
  source: SourceRecord,
  observation: SourceObservationInput
): DiscoveryCandidateDraft[] {
  return officialProgramProfiles
    .filter((profile) => profile.matches(source))
    .flatMap((profile) => profile.extract(source, observation));
}
