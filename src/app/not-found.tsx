import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="border-3 border-brutal-black bg-brutal-white p-8 shadow-brutal-lg md:p-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">
          Error · 404
        </p>
        <h1 className="mt-3 font-mono text-5xl font-bold uppercase tracking-tight md:text-7xl">
          Lost in space.
        </h1>
        <p className="mt-4 max-w-2xl text-base md:text-lg">
          Bu sayfa yok ya da kaldırıldı. Belki <strong>yeni indirimlere</strong> bakmak istersin?
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-black px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-brutal-yellow shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            ← Back home
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-yellow px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            What is this?
          </Link>
        </div>
      </div>
    </div>
  );
}
