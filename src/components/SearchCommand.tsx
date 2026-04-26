'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchResult } from '@/lib/db/queries';

const TYPE_BG = {
  free_tier: 'bg-brutal-green',
  trial: 'bg-brutal-yellow',
  credit: 'bg-brutal-orange',
  discount: 'bg-brutal-red',
} as const;

type FlatItem =
  | { kind: 'product'; id: number; href: string; title: string; subtitle: string | null }
  | {
      kind: 'offer';
      id: number;
      href: string;
      title: string;
      subtitle: string;
      type: keyof typeof TYPE_BG;
      value: string | null;
    };

function flatten(results: SearchResult): FlatItem[] {
  return [
    ...results.products.map(
      (p): FlatItem => ({
        kind: 'product',
        id: p.id,
        href: `/products/${p.slug}`,
        title: p.name,
        subtitle: p.category ?? p.description,
      })
    ),
    ...results.offers.map(
      (o): FlatItem => ({
        kind: 'offer',
        id: o.id,
        href: `/products/${o.productSlug}`,
        title: o.headline,
        subtitle: o.productName,
        type: o.type,
        value: o.value,
      })
    ),
  ];
}

/**
 * Global Cmd+K / Ctrl+K command palette.
 * Mounted once in root layout. Manages its own open state via keyboard listener.
 */
export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<FlatItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setActiveIdx(0);
    } else {
      setQuery('');
      setItems([]);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error('search failed');
        const data = (await res.json()) as SearchResult;
        setItems(flatten(data));
        setActiveIdx(0);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  const navigate = useCallback(
    (item: FlatItem) => {
      router.push(item.href);
      setOpen(false);
    },
    [router]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[activeIdx];
      if (item) navigate(item);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-50 flex items-start justify-center bg-brutal-black/60 px-4 pt-20 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-2xl border-3 border-brutal-black bg-brutal-white shadow-brutal-lg">
        <div className="flex items-center gap-3 border-b-3 border-brutal-black px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-widest text-brutal-black/60">
            Search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a tool, headline or category…"
            className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-brutal-black/40"
            autoComplete="off"
          />
          <kbd className="border-2 border-brutal-black bg-brutal-yellow px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="px-4 py-6 text-center font-mono text-xs uppercase tracking-widest text-brutal-black/50">
              Start typing… ↑↓ to navigate · ↵ to open
            </p>
          ) : loading && items.length === 0 ? (
            <p className="px-4 py-6 text-center font-mono text-xs uppercase tracking-widest text-brutal-black/50">
              Searching…
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-center font-mono text-xs uppercase tracking-widest text-brutal-black/50">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <ul role="listbox">
              {items.map((item, idx) => {
                const active = idx === activeIdx;
                return (
                  <li key={`${item.kind}-${item.id}`} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => navigate(item)}
                      className={`flex w-full items-center gap-3 border-b border-brutal-black/10 px-4 py-3 text-left transition-colors ${
                        active ? 'bg-brutal-yellow' : 'bg-brutal-white hover:bg-brutal-yellow/40'
                      }`}
                    >
                      <span
                        className={`shrink-0 border-2 border-brutal-black px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          item.kind === 'product' ? 'bg-brutal-white' : TYPE_BG[item.type]
                        }`}
                      >
                        {item.kind === 'product' ? 'PRODUCT' : item.type.replace('_', ' ')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-sm font-bold">
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span className="block truncate text-xs text-brutal-black/60">
                            {item.subtitle}
                          </span>
                        )}
                      </span>
                      {item.kind === 'offer' && item.value && (
                        <span className="shrink-0 border-2 border-brutal-black bg-brutal-black px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-brutal-yellow">
                          {item.value}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Header trigger button — opens the command palette via custom event. */
export function SearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => {
        // Re-dispatch a Cmd+K so SearchCommand handler reacts uniformly.
        const ev = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: navigator.platform.toLowerCase().includes('mac'),
          ctrlKey: !navigator.platform.toLowerCase().includes('mac'),
          bubbles: true,
        });
        window.dispatchEvent(ev);
      }}
      className="hidden items-center gap-2 border-3 border-brutal-black bg-brutal-white px-3 py-1.5 font-mono text-xs uppercase tracking-widest shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 md:inline-flex"
      aria-label="Search (Cmd+K)"
    >
      <span aria-hidden>🔍</span>
      <span>Search</span>
      <kbd className="border-2 border-brutal-black bg-brutal-yellow px-1 py-0.5 text-[10px] font-bold">
        ⌘K
      </kbd>
    </button>
  );
}
