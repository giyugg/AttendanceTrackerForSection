
export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-72 animate-pulse rounded bg-slate-200" />

        <div className="h-32 animate-pulse rounded-xl bg-slate-200" />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>

        <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-36 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}