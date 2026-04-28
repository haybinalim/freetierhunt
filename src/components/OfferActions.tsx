'use client';

import { useEffect, useRef, useState } from 'react';
import { useVisitorId } from '@/hooks/useVisitorId';
import { useSavedOffers } from '@/hooks/useSavedOffers';

const REPORT_REASONS = [
  { value: 'expired', label: 'Expired' },
  { value: 'broken', label: 'Broken link' },
  { value: 'spam', label: 'Spam' },
  { value: 'incorrect', label: 'Incorrect info' },
  { value: 'other', label: 'Other' },
] as const;

type Vote = 'up' | 'down';

interface OfferActionsProps {
  offerId: number;
  /** Compact mode hides labels (used inside dense feeds). */
  compact?: boolean;
  /** Server-prefetched counts; will be optimistically incremented on vote. */
  initialCounts?: { up: number; down: number };
}

/**
 * Anonymous-safe interactive controls: vote up/down, save, report.
 * Vote choice is persisted in localStorage so the UI reflects past votes.
 */
export function OfferActions({ offerId, compact = false, initialCounts }: OfferActionsProps) {
  const visitorId = useVisitorId();
  const { isSaved, toggle: toggleSave } = useSavedOffers();
  const [vote, setVote] = useState<Vote | null>(null);
  const [counts, setCounts] = useState(initialCounts ?? { up: 0, down: 0 });
  const [voting, setVoting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Hydrate prior vote from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`fth_vote_${offerId}`);
      if (raw === 'up' || raw === 'down') setVote(raw);
    } catch {
      /* noop */
    }
  }, [offerId]);

  // Close report dropdown on outside click
  useEffect(() => {
    if (!reportOpen) return;
    const onClick = (e: MouseEvent) => {
      if (reportRef.current && !reportRef.current.contains(e.target as Node)) {
        setReportOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [reportOpen]);

  async function castVote(direction: Vote) {
    if (!visitorId || voting || vote === direction) return;
    setVoting(true);
    const previous = vote;
    const previousCounts = counts;
    // Optimistic count delta: remove previous vote (if any), add new one.
    const next = { ...counts };
    if (previous === 'up') next.up = Math.max(0, next.up - 1);
    if (previous === 'down') next.down = Math.max(0, next.down - 1);
    if (direction === 'up') next.up += 1;
    if (direction === 'down') next.down += 1;
    setVote(direction);
    setCounts(next);
    try {
      const res = await fetch(`/api/offers/${offerId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, vote: direction }),
      });
      if (!res.ok) throw new Error('vote failed');
      try {
        localStorage.setItem(`fth_vote_${offerId}`, direction);
      } catch {
        /* noop */
      }
    } catch {
      setVote(previous);
      setCounts(previousCounts);
    } finally {
      setVoting(false);
    }
  }

  async function submitReport(reason: (typeof REPORT_REASONS)[number]['value']) {
    setReportOpen(false);
    setReported(true);
    try {
      await fetch(`/api/offers/${offerId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: visitorId ?? undefined, reason }),
      });
    } catch {
      // silent — UX already shows confirmation
    }
  }

  const saved = isSaved(offerId);

  return (
    <div
      className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Vote up */}
      <button
        type="button"
        onClick={() => castVote('up')}
        disabled={voting || !visitorId}
        aria-pressed={vote === 'up'}
        aria-label={`Upvote (${counts.up})`}
        className={`inline-flex h-8 items-center gap-1 border-2 border-brutal-black px-2 font-mono text-xs font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50 ${
          vote === 'up' ? 'bg-brutal-green' : 'bg-brutal-white'
        }`}
      >
        <span aria-hidden>▲</span>
        <span className="tabular-nums">{counts.up}</span>
      </button>

      {/* Vote down */}
      <button
        type="button"
        onClick={() => castVote('down')}
        disabled={voting || !visitorId}
        aria-pressed={vote === 'down'}
        aria-label={`Downvote (${counts.down})`}
        className={`inline-flex h-8 items-center gap-1 border-2 border-brutal-black px-2 font-mono text-xs font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50 ${
          vote === 'down' ? 'bg-brutal-red text-brutal-white' : 'bg-brutal-white'
        }`}
      >
        <span aria-hidden>▼</span>
        <span className="tabular-nums">{counts.down}</span>
      </button>

      {/* Save */}
      <button
        type="button"
        onClick={() => toggleSave(offerId)}
        aria-pressed={saved}
        aria-label={saved ? 'Unsave' : 'Save'}
        title={saved ? 'Unsave' : 'Save for later'}
        className={`inline-flex h-8 items-center justify-center border-2 border-brutal-black px-2 font-mono text-xs font-bold uppercase tracking-widest transition-transform hover:-translate-y-0.5 ${
          saved ? 'bg-brutal-yellow' : 'bg-brutal-white'
        }`}
      >
        {saved ? '★' : '☆'}
        {!compact && <span className="ml-1">{saved ? 'Saved' : 'Save'}</span>}
      </button>

      {/* Report */}
      <div ref={reportRef} className="relative">
        <button
          type="button"
          onClick={() => !reported && setReportOpen((v) => !v)}
          disabled={reported}
          aria-haspopup="menu"
          aria-expanded={reportOpen}
          aria-label="Report"
          title={reported ? 'Reported, thanks' : 'Report this offer'}
          className="inline-flex h-8 items-center justify-center border-2 border-brutal-black bg-brutal-white px-2 font-mono text-xs font-bold uppercase tracking-widest transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {reported ? '✓' : '⚑'}
          {!compact && <span className="ml-1">{reported ? 'Sent' : 'Flag'}</span>}
        </button>
        {reportOpen && (
          <ul
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-44 border-3 border-brutal-black bg-brutal-white shadow-brutal-lg"
          >
            {REPORT_REASONS.map((r) => (
              <li key={r.value} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => submitReport(r.value)}
                  className="block w-full border-b border-brutal-black/10 px-3 py-2 text-left font-mono text-xs uppercase tracking-widest hover:bg-brutal-yellow"
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
