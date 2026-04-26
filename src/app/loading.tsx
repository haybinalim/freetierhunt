/**
 * Global suspense fallback. Brutal skeleton while RSC streams.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-20">
      <div
        className="animate-pulse border-3 border-brutal-black bg-brutal-white p-8 shadow-brutal-lg md:p-12"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="h-3 w-32 bg-brutal-black/20" />
        <div className="mt-6 h-12 w-3/4 bg-brutal-black/30 md:h-16" />
        <div className="mt-3 h-12 w-1/2 bg-brutal-black/30 md:h-16" />
        <div className="mt-8 h-4 w-full max-w-2xl bg-brutal-black/15" />
        <div className="mt-2 h-4 w-3/4 max-w-2xl bg-brutal-black/15" />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse border-3 border-brutal-black bg-brutal-yellow/60 shadow-brutal"
          />
        ))}
      </div>

      <div className="mt-12 space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse border-3 border-brutal-black bg-brutal-white shadow-brutal"
          />
        ))}
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}
