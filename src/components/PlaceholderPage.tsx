import Link from 'next/link';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  /** Brief preview of what will live here */
  preview?: React.ReactNode;
  /** Plan reference, e.g. "Hafta 10 Salı" */
  shipsIn: string;
}

export function PlaceholderPage({ title, subtitle, preview, shipsIn }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <div className="border-3 border-brutal-black bg-brutal-white p-8 shadow-brutal-lg md:p-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">
          Coming soon · {shipsIn}
        </p>
        <h1 className="mt-4 font-mono text-4xl font-bold uppercase leading-none tracking-tight md:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="mt-4 text-lg text-brutal-black/80">{subtitle}</p>}
        {preview && (
          <div className="mt-6 border-3 border-brutal-black bg-brutal-yellow p-4 font-mono text-sm">
            {preview}
          </div>
        )}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center border-3 border-brutal-black bg-brutal-black px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest text-brutal-yellow shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg"
          >
            ← Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
