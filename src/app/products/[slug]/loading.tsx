export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16" aria-busy="true">
      <div className="h-3 w-48 bg-brutal-black/20" />

      <div className="mt-6 animate-pulse border-3 border-brutal-black bg-brutal-white p-6 shadow-brutal-lg md:p-10">
        <div className="h-12 w-2/3 bg-brutal-black/30 md:h-16" />
        <div className="mt-4 h-4 w-3/4 max-w-3xl bg-brutal-black/15" />
        <div className="mt-2 h-4 w-1/2 max-w-3xl bg-brutal-black/15" />
        <div className="mt-6 h-4 w-24 bg-brutal-black/20" />
      </div>

      <div className="mt-10 h-8 w-64 bg-brutal-black/20" />

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse border-3 border-brutal-black bg-brutal-white shadow-brutal"
          />
        ))}
      </div>

      <span className="sr-only">Loading product…</span>
    </div>
  );
}
