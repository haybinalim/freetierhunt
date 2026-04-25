import Link from 'next/link';

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

        <p className="hidden font-mono text-sm uppercase tracking-wider text-brutal-black/70 md:block">
          Free credits · Trials · Promo codes for AI tools
        </p>

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
    </header>
  );
}
