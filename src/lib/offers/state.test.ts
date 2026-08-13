import { describe, expect, it } from 'vitest';
import { formatLastVerified, resolveOfferFreshness } from './state';

const now = new Date('2026-08-13T09:00:00.000Z');

const activeOffer = {
  status: 'active' as const,
  verificationState: 'verified' as const,
  expiresAt: null,
  lastVerifiedAt: new Date('2026-08-12T09:00:00.000Z'),
  reverifyAt: new Date('2026-08-14T09:00:00.000Z'),
};

describe('resolveOfferFreshness', () => {
  it('yakın zamanda doğrulanmış aktif teklifi claim edilebilir bırakır', () => {
    expect(resolveOfferFreshness(activeOffer, now)).toMatchObject({
      status: 'active',
      isClaimable: true,
      isStale: false,
    });
  });

  it('son kullanma tarihi geçmiş teklifin aktif durumunu geçersiz kılar', () => {
    expect(
      resolveOfferFreshness(
        { ...activeOffer, expiresAt: new Date('2026-08-12T23:59:59.000Z') },
        now
      )
    ).toMatchObject({ status: 'expired', isClaimable: false });
  });

  it('yeniden doğrulama zamanı gelen teklifi stale durumuna taşır', () => {
    expect(
      resolveOfferFreshness(
        { ...activeOffer, reverifyAt: new Date('2026-08-13T08:59:59.000Z') },
        now
      )
    ).toMatchObject({ status: 'stale', isClaimable: false, isStale: true });
  });

  it('doğrulanmamış teklifi stale olarak değerlendirir', () => {
    expect(
      resolveOfferFreshness({ ...activeOffer, verificationState: 'unverified' }, now)
    ).toMatchObject({ status: 'stale', isClaimable: false });
  });
});

describe('formatLastVerified', () => {
  it('son kontrol zamanını kısa ve okunabilir biçimde gösterir', () => {
    expect(formatLastVerified(new Date('2026-08-13T06:00:00.000Z'), now)).toBe('Checked 3h ago');
    expect(formatLastVerified(new Date('2026-08-10T09:00:00.000Z'), now)).toBe('Checked 3d ago');
    expect(formatLastVerified(null, now)).toBe('Not yet verified');
  });
});
