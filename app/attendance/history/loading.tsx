
export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-72 animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-52 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>

        <div className="h-48 animate-pulse rounded-xl bg-slate-200" />

        <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}