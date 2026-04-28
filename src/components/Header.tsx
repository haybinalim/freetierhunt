import Link from 'next/link';
import { SearchTrigger } from './SearchCommand';

interface HeaderProps {
  /**
   * Total community savings (USD). Hafta 5'te DB'den hesaplanacak,
   * şu an placeholder.
   */
  savingsUsd?: number;
}

export function Header({ savingsUsd = 0 }: HeaderProps) {
  return (
    <header className="border-b-4 border-brutal-black bg-brutal-yellow">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between md:gap-8">
        <Link href="/" className="group inline-flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold uppercase tracking-tight md:text-4xl">
            FreeTierHunt
          </span>
          <span className="text-2xl transition-transform group-hover:rotate-12 md:text-3xl">
            🏹
          </span>
        </Link>

        <nav className="hidden items-center gap-4 font-mono text-xs uppercase tracking-widest md:flex">
          <Link href="/categories" className="hover:underline">
            Categories
          </Link>
          <Link href="/saved" className="hover:underline">
            Saved ★
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <SearchTrigger />
          <div
            className="border-3 border-brutal-black bg-brutal-white px-4 py-2 shadow-brutal"
            aria-label="Community savings counter"
          >
            <span className="block font-mono text-[10px] uppercase tracking-widest text-brutal-black/60">
              Community saved
            </span>
            <span className="block font-mono text-xl font-bold tabular-nums">
              ${savingsUsd.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
