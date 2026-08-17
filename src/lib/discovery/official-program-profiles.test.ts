import { describe, expect, it } from 'vitest';
import { createCandidateFingerprint } from './candidate-service';
import { discoverOfficialProgramCandidates } from './official-program-profiles';

const googleSource = {
  id: 1,
  name: 'Google Cloud Startup',
  type: 'official' as const,
  status: 'active' as const,
  baseUrl: 'https://cloud.google.com/startup',
  canonicalDomain: 'cloud.google.com',
  allowAutomatedSync: true,
  healthStatus: 'healthy' as const,
  consecutiveFailures: 0,
};

const awsSource = {
  ...googleSource,
  id: 2,
  name: 'AWS Activate Credits',
  baseUrl: 'https://aws.amazon.com/startups/credits/',
  canonicalDomain: 'aws.amazon.com',
};

const cloudflareSource = {
  ...googleSource,
  id: 3,
  name: 'Cloudflare for Startups',
  baseUrl: 'https://www.cloudflare.com/startups/',
  canonicalDomain: 'cloudflare.com',
};

describe('official program discovery profiles', () => {
  it('Google Cloud resmi kanıtı için kredi adayı üretir', () => {
    const candidates = discoverOfficialProgramCandidates(googleSource, {
      id: 11,
      url: googleSource.baseUrl,
      title: 'The next generation of startups are building on Google Cloud',
      excerpt:
        'Early stage startups can get up to $350,000 in Cloud credits through the Google for Startups Cloud Program.',
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      offerType: 'credit',
      value: 'Up to $350,000 in Cloud credits',
      officialUrl: googleSource.baseUrl,
    });
  });

  it('AWS ve Cloudflare yalnız kendi resmi kanıt sinyalleriyle aday üretir', () => {
    const awsCandidates = discoverOfficialProgramCandidates(awsSource, {
      id: 12,
      url: awsSource.baseUrl,
      title: 'AWS Activate Credits',
      excerpt:
        'Apply for up to $200,000 in AWS Activate Credits, with additional credits available for AI startups ready to scale.',
    });
    const cloudflareCandidates = discoverOfficialProgramCandidates(cloudflareSource, {
      id: 13,
      url: cloudflareSource.baseUrl,
      title: 'Cloudflare for Startups',
      excerpt:
        'Cloudflare for Startups gives early-stage companies up to $350k in credits to build the next big idea.',
    });

    expect(awsCandidates[0]?.value).toBe('Up to $200,000 in AWS Activate Credits');
    expect(cloudflareCandidates[0]?.value).toBe('Up to $350,000 in credits');
  });

  it('kaynak metninde uygun kanıt yoksa aday üretmez ve fingerprint kararlıdır', () => {
    const candidates = discoverOfficialProgramCandidates(googleSource, {
      id: 14,
      url: googleSource.baseUrl,
      title: 'Google Cloud',
      excerpt: 'A general platform page without a startup credit statement.',
    });
    expect(candidates).toEqual([]);

    const candidate = {
      officialUrl: googleSource.baseUrl,
      headline: 'Google for Startups: up to $350,000 Cloud credits',
      offerType: 'credit' as const,
      value: 'Up to $350,000 in Cloud credits',
      evidenceQuote: 'Proof',
      structuredClaims: {},
      discoveryMethod: 'test',
      priority: 90,
    };
    expect(createCandidateFingerprint(1, candidate)).toBe(createCandidateFingerprint(1, candidate));
    expect(createCandidateFingerprint(1, candidate)).not.toBe(
      createCandidateFingerprint(2, candidate)
    );
  });
});
