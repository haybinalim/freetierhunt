export type OfferLifecycleStatus =
  | 'draft'
  | 'under_review'
  | 'active'
  | 'stale'
  | 'expired'
  | 'withdrawn'
  | 'superseded'
  | 'disabled';

export type OfferVerificationState = 'unverified' | 'verified' | 'needs_review' | 'failed';

export type OfferFreshnessInput = {
  status: OfferLifecycleStatus;
  verificationState: OfferVerificationState;
  expiresAt: Date | null;
  lastVerifiedAt: Date | null;
  reverifyAt: Date | null;
};

export type OfferFreshness = {
  status: OfferLifecycleStatus;
  isClaimable: boolean;
  isStale: boolean;
  label: string;
};

/**
 * Resolves the user-facing state without mutating the persisted offer record.
 * Expiration always wins over recency; a stale result should never be claimable.
 */
export function resolveOfferFreshness(
  offer: OfferFreshnessInput,
  now: Date = new Date()
): OfferFreshness {
  if (
    offer.status === 'expired' ||
    (offer.expiresAt && offer.expiresAt.getTime() <= now.getTime())
  ) {
    return { status: 'expired', isClaimable: false, isStale: false, label: 'Expired' };
  }

  if (offer.status === 'withdrawn') {
    return { status: 'withdrawn', isClaimable: false, isStale: false, label: 'Withdrawn' };
  }

  if (offer.status === 'superseded') {
    return { status: 'superseded', isClaimable: false, isStale: false, label: 'Replaced' };
  }

  if (offer.status === 'disabled' || offer.status === 'draft' || offer.status === 'under_review') {
    return { status: offer.status, isClaimable: false, isStale: false, label: 'Unavailable' };
  }

  const isStale =
    offer.status === 'stale' ||
    offer.verificationState !== 'verified' ||
    (offer.reverifyAt !== null && offer.reverifyAt.getTime() <= now.getTime());

  if (isStale) {
    return { status: 'stale', isClaimable: false, isStale: true, label: 'Needs re-check' };
  }

  return { status: 'active', isClaimable: true, isStale: false, label: 'Verified active' };
}

export function formatLastVerified(lastVerifiedAt: Date | null, now: Date = new Date()): string {
  if (!lastVerifiedAt) return 'Not yet verified';

  const elapsedMs = Math.max(0, now.getTime() - lastVerifiedAt.getTime());
  const elapsedHours = Math.floor(elapsedMs / (60 * 60 * 1000));

  if (elapsedHours < 1) return 'Checked less than an hour ago';
  if (elapsedHours < 24) return `Checked ${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Checked ${elapsedDays}d ago`;
}
