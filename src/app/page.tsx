export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16">
      <div className="border-3 border-brutal-black bg-brutal-white p-12 shadow-brutal-lg">
        <h1 className="text-5xl font-bold uppercase tracking-tight md:text-7xl">FreeTierHunt 🏹</h1>
        <p className="mt-6 text-xl">
          Hunting the best <strong>free tiers</strong>, <strong>trials</strong>, and{' '}
          <strong>promo codes</strong> for AI tools.
        </p>
        <p className="mt-4 text-sm uppercase tracking-wider text-brutal-black/60">
          Coming soon — currently in build phase.
        </p>
      </div>
    </main>
  );
}
