import Link from 'next/link';

const STATS = [
  { label: 'AI tools tracked', value: '500+' },
  { label: 'Active offers', value: '1,200+' },
  { label: 'Avg saved / dev', value: '$80/mo' },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-20">
      {/* Hero */}
      <section className="border-3 border-brutal-black bg-brutal-white p-8 shadow-brutal-lg md:p-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">
          v0.1 · Coming soon
        </p>
        <h1 className="mt-4 font-mono text-4xl font-bold uppercase leading-none tracking-tight md:text-6xl lg:text-7xl">
          Stop overpaying
          <br />
          for AI tools.
        </h1>
        <p className="mt-6 max-w-2xl text-lg md:text-xl">
          Curated <strong>free tiers</strong>, <strong>generous trials</strong>, and{' '}
          <strong>verified promo codes</strong> for the AI tools indie hackers actually use. Updated
          daily by an autonomous agent + the community.
        </p>
        <div className="mt-8 flex flex-col gap-4 md:flex-row">
          <Link
            href="#waitlist"
            className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-black px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-brutal-yellow shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg"
          >
            Join the waitlist →
          </Link>
          <Link
            href="https://github.com/freetierhunt/freetierhunt"
            className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-yellow px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg"
          >
            ⭐ Star on GitHub
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="border-3 border-brutal-black bg-brutal-yellow p-6 shadow-brutal"
          >
            <div className="font-mono text-3xl font-bold tabular-nums md:text-4xl">
              {stat.value}
            </div>
            <div className="mt-1 font-mono text-xs uppercase tracking-widest text-brutal-black/70">
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* Waitlist placeholder — Hafta 1 Çarşamba'da Tally form embed olacak */}
      <section
        id="waitlist"
        className="mt-12 border-3 border-brutal-black bg-brutal-black p-8 text-brutal-yellow shadow-brutal-lg md:p-12"
      >
        <h2 className="font-mono text-2xl font-bold uppercase tracking-tight md:text-3xl">
          Get early access
        </h2>
        <p className="mt-3 max-w-2xl text-base md:text-lg">
          Be first to know when we launch. No spam, just the deals worth your time.
        </p>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest opacity-70">
          ↳ Tally waitlist embed coming Hafta 1 Çarşamba
        </p>
      </section>
    </div>
  );
}
