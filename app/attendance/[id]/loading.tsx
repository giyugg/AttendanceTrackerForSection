
export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />

        <div className="h-32 animate-pulse rounded-xl bg-slate-200" />

        <div className="h-20 animate-pulse rounded-xl bg-slate-200" />

        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
    </main>
  );
}